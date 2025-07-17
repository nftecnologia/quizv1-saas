-- Function to get funnel analytics
CREATE OR REPLACE FUNCTION public.get_funnel_analytics(funnel_uuid UUID)
RETURNS TABLE (
    total_views BIGINT,
    total_conversions BIGINT,
    conversion_rate DECIMAL,
    avg_completion_rate DECIMAL,
    daily_views JSONB,
    daily_conversions JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            DATE(created_at) as date,
            SUM(views) as views,
            SUM(conversions) as conversions
        FROM public.analytics
        WHERE funnel_id = funnel_uuid
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    ),
    totals AS (
        SELECT 
            COALESCE(SUM(views), 0) as total_views,
            COALESCE(SUM(conversions), 0) as total_conversions,
            CASE 
                WHEN SUM(views) > 0 THEN ROUND((SUM(conversions)::DECIMAL / SUM(views)::DECIMAL) * 100, 2)
                ELSE 0
            END as conversion_rate,
            ROUND(AVG(completion_rate), 2) as avg_completion_rate
        FROM public.analytics
        WHERE funnel_id = funnel_uuid
    )
    SELECT 
        t.total_views,
        t.total_conversions,
        t.conversion_rate,
        t.avg_completion_rate,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', date,
                    'views', views
                )
            )
            FROM daily_stats
        ) as daily_views,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', date,
                    'conversions', conversions
                )
            )
            FROM daily_stats
        ) as daily_conversions
    FROM totals t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(user_uuid UUID)
RETURNS TABLE (
    total_funnels BIGINT,
    published_funnels BIGINT,
    total_leads BIGINT,
    total_views BIGINT,
    total_conversions BIGINT,
    avg_conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_funnels AS (
        SELECT id FROM public.funnels WHERE user_id = user_uuid
    ),
    funnel_stats AS (
        SELECT 
            COUNT(DISTINCT f.id) as total_funnels,
            COUNT(DISTINCT CASE WHEN f.published THEN f.id END) as published_funnels
        FROM public.funnels f
        WHERE f.user_id = user_uuid
    ),
    lead_stats AS (
        SELECT COUNT(*) as total_leads
        FROM public.leads l
        WHERE l.funnel_id IN (SELECT id FROM user_funnels)
    ),
    analytics_stats AS (
        SELECT 
            COALESCE(SUM(a.views), 0) as total_views,
            COALESCE(SUM(a.conversions), 0) as total_conversions,
            CASE 
                WHEN SUM(a.views) > 0 THEN ROUND((SUM(a.conversions)::DECIMAL / SUM(a.views)::DECIMAL) * 100, 2)
                ELSE 0
            END as avg_conversion_rate
        FROM public.analytics a
        WHERE a.funnel_id IN (SELECT id FROM user_funnels)
    )
    SELECT 
        fs.total_funnels,
        fs.published_funnels,
        ls.total_leads,
        ans.total_views,
        ans.total_conversions,
        ans.avg_conversion_rate
    FROM funnel_stats fs
    CROSS JOIN lead_stats ls
    CROSS JOIN analytics_stats ans;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record funnel view
CREATE OR REPLACE FUNCTION public.record_funnel_view(funnel_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.analytics (funnel_id, views, conversions, completion_rate)
    VALUES (funnel_uuid, 1, 0, 0.00)
    ON CONFLICT (funnel_id, DATE(created_at))
    DO UPDATE SET views = analytics.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record funnel conversion
CREATE OR REPLACE FUNCTION public.record_funnel_conversion(funnel_uuid UUID, completion_rate_value DECIMAL DEFAULT 100.00)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.analytics (funnel_id, views, conversions, completion_rate)
    VALUES (funnel_uuid, 0, 1, completion_rate_value)
    ON CONFLICT (funnel_id, DATE(created_at))
    DO UPDATE SET 
        conversions = analytics.conversions + 1,
        completion_rate = (analytics.completion_rate + completion_rate_value) / 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get funnel leads with pagination
CREATE OR REPLACE FUNCTION public.get_funnel_leads(
    funnel_uuid UUID,
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    name VARCHAR,
    phone VARCHAR,
    answers JSONB,
    utm_source VARCHAR,
    utm_medium VARCHAR,
    utm_campaign VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH total AS (
        SELECT COUNT(*) as count
        FROM public.leads l
        WHERE l.funnel_id = funnel_uuid
    )
    SELECT 
        l.id,
        l.email,
        l.name,
        l.phone,
        l.answers,
        l.utm_source,
        l.utm_medium,
        l.utm_campaign,
        l.created_at,
        t.count as total_count
    FROM public.leads l
    CROSS JOIN total t
    WHERE l.funnel_id = funnel_uuid
    ORDER BY l.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get funnel with all related data
CREATE OR REPLACE FUNCTION public.get_funnel_with_structure(funnel_uuid UUID)
RETURNS TABLE (
    funnel_id UUID,
    funnel_title VARCHAR,
    funnel_description TEXT,
    funnel_config JSONB,
    funnel_published BOOLEAN,
    funnel_created_at TIMESTAMP WITH TIME ZONE,
    funnel_updated_at TIMESTAMP WITH TIME ZONE,
    steps JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.title,
        f.description,
        f.config,
        f.published,
        f.created_at,
        f.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'order', s.order_num,
                    'title', s.title,
                    'config', s.config,
                    'created_at', s.created_at,
                    'updated_at', s.updated_at,
                    'elements', s.elements
                )
                ORDER BY s.order_num
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
        ) as steps
    FROM public.funnels f
    LEFT JOIN (
        SELECT 
            s.*,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', e.id,
                        'type', e.type,
                        'order', e.order_num,
                        'config', e.config,
                        'created_at', e.created_at,
                        'updated_at', e.updated_at
                    )
                    ORDER BY e.order_num
                ) FILTER (WHERE e.id IS NOT NULL),
                '[]'::jsonb
            ) as elements
        FROM public.steps s
        LEFT JOIN public.elements e ON e.step_id = s.id
        GROUP BY s.id, s.funnel_id, s.order_num, s.title, s.config, s.created_at, s.updated_at
    ) s ON s.funnel_id = f.id
    WHERE f.id = funnel_uuid
    GROUP BY f.id, f.title, f.description, f.config, f.published, f.created_at, f.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to duplicate a funnel
CREATE OR REPLACE FUNCTION public.duplicate_funnel(source_funnel_id UUID, new_title VARCHAR)
RETURNS UUID AS $$
DECLARE
    new_funnel_id UUID;
    step_record RECORD;
    element_record RECORD;
    new_step_id UUID;
BEGIN
    -- Create new funnel
    INSERT INTO public.funnels (user_id, title, description, config, published)
    SELECT user_id, new_title, description, config, false
    FROM public.funnels
    WHERE id = source_funnel_id
    RETURNING id INTO new_funnel_id;
    
    -- Copy steps
    FOR step_record IN 
        SELECT * FROM public.steps 
        WHERE funnel_id = source_funnel_id 
        ORDER BY order_num
    LOOP
        INSERT INTO public.steps (funnel_id, order_num, title, config)
        VALUES (new_funnel_id, step_record.order_num, step_record.title, step_record.config)
        RETURNING id INTO new_step_id;
        
        -- Copy elements for this step
        FOR element_record IN 
            SELECT * FROM public.elements 
            WHERE step_id = step_record.id 
            ORDER BY order_num
        LOOP
            INSERT INTO public.elements (step_id, type, config, order_num)
            VALUES (new_step_id, element_record.type, element_record.config, element_record.order_num);
        END LOOP;
    END LOOP;
    
    RETURN new_funnel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user plan status
CREATE OR REPLACE FUNCTION public.get_user_plan_status(user_uuid UUID)
RETURNS TABLE (
    current_plan VARCHAR,
    status VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(up.plan_id, 'free'),
        COALESCE(up.status, 'active'),
        up.expires_at,
        CASE 
            WHEN up.status = 'active' AND (up.expires_at IS NULL OR up.expires_at > NOW()) THEN true
            WHEN up.plan_id = 'free' THEN true
            ELSE false
        END as is_active
    FROM public.users u
    LEFT JOIN public.user_plans up ON up.user_id = u.id AND up.status = 'active'
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;