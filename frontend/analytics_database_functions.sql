-- Analytics Database Functions for QuizV1
-- These functions provide optimized queries for the analytics system

-- Create analytics_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id TEXT,
    user_id UUID,
    anonymous_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    user_agent TEXT,
    ip_address TEXT,
    referrer TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    browser TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_quiz_id ON analytics_events(quiz_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_source ON analytics_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_events_device_type ON analytics_events(device_type);

-- Create analytics_reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    data JSONB DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create integration_settings table
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_analytics_id TEXT,
    facebook_pixel_id TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    export_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get quiz metrics
CREATE OR REPLACE FUNCTION get_quiz_metrics(filters TEXT)
RETURNS TABLE (
    quiz_id TEXT,
    total_views BIGINT,
    total_starts BIGINT,
    total_completions BIGINT,
    total_abandons BIGINT,
    conversion_rate DECIMAL,
    completion_rate DECIMAL,
    average_time DECIMAL,
    bounce_rate DECIMAL,
    leads_generated BIGINT,
    lead_conversion_rate DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    WITH quiz_stats AS (
        SELECT 
            COALESCE(ae.quiz_id, 'all') as q_id,
            COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as views,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_start') as starts,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') as completions,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_abandoned') as abandons,
            AVG(CASE 
                WHEN ae.event_type = 'quiz_completed' 
                THEN (ae.event_data->>'total_time')::INTEGER 
            END) as avg_time,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated') as leads
        FROM analytics_events ae
        WHERE 
            (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
            AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
            AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
            AND (filter_obj->>'utm_source' IS NULL OR ae.utm_source = filter_obj->>'utm_source')
            AND (filter_obj->>'device_type' IS NULL OR ae.device_type = filter_obj->>'device_type')
        GROUP BY COALESCE(ae.quiz_id, 'all')
    )
    SELECT 
        qs.q_id,
        qs.views,
        qs.starts,
        qs.completions,
        qs.abandons,
        CASE WHEN qs.views > 0 THEN (qs.completions::DECIMAL / qs.views * 100) ELSE 0 END as conversion_rate,
        CASE WHEN qs.starts > 0 THEN (qs.completions::DECIMAL / qs.starts * 100) ELSE 0 END as completion_rate,
        COALESCE(qs.avg_time, 0),
        CASE WHEN qs.views > 0 THEN (qs.abandons::DECIMAL / qs.views * 100) ELSE 0 END as bounce_rate,
        qs.leads,
        CASE WHEN qs.completions > 0 THEN (qs.leads::DECIMAL / qs.completions * 100) ELSE 0 END as lead_conversion_rate
    FROM quiz_stats qs;
END;
$$ LANGUAGE plpgsql;

-- Function to get time series data
CREATE OR REPLACE FUNCTION get_time_series_data(filters TEXT)
RETURNS TABLE (
    date DATE,
    views BIGINT,
    starts BIGINT,
    completions BIGINT,
    abandons BIGINT,
    leads BIGINT
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    SELECT 
        ae.created_at::DATE as date,
        COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as views,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_start') as starts,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') as completions,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_abandoned') as abandons,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated') as leads
    FROM analytics_events ae
    WHERE 
        (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
        AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
        AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
        AND (filter_obj->>'utm_source' IS NULL OR ae.utm_source = filter_obj->>'utm_source')
        AND (filter_obj->>'device_type' IS NULL OR ae.device_type = filter_obj->>'device_type')
    GROUP BY ae.created_at::DATE
    ORDER BY ae.created_at::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get funnel analysis
CREATE OR REPLACE FUNCTION get_funnel_analysis(filters TEXT)
RETURNS TABLE (
    step INTEGER,
    step_name TEXT,
    question_id TEXT,
    views BIGINT,
    completions BIGINT,
    abandons BIGINT,
    conversion_rate DECIMAL,
    average_time DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    WITH funnel_steps AS (
        SELECT 
            CASE 
                WHEN ae.event_type = 'page_view' THEN 1
                WHEN ae.event_type = 'quiz_start' THEN 2
                WHEN ae.event_type = 'question_answered' THEN 3 + ROW_NUMBER() OVER (PARTITION BY ae.session_id ORDER BY ae.created_at)
                WHEN ae.event_type = 'quiz_completed' THEN 100
            END as step,
            CASE 
                WHEN ae.event_type = 'page_view' THEN 'Visualização'
                WHEN ae.event_type = 'quiz_start' THEN 'Início do Quiz'
                WHEN ae.event_type = 'question_answered' THEN 'Questão ' || (ae.event_data->>'question_id')
                WHEN ae.event_type = 'quiz_completed' THEN 'Conclusão'
            END as step_name,
            ae.event_data->>'question_id' as question_id,
            ae.session_id,
            ae.created_at,
            EXTRACT(EPOCH FROM ae.created_at - LAG(ae.created_at) OVER (PARTITION BY ae.session_id ORDER BY ae.created_at)) as time_diff
        FROM analytics_events ae
        WHERE 
            (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
            AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
            AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
            AND ae.event_type IN ('page_view', 'quiz_start', 'question_answered', 'quiz_completed')
    )
    SELECT 
        fs.step,
        fs.step_name,
        fs.question_id,
        COUNT(DISTINCT fs.session_id) as views,
        COUNT(DISTINCT CASE WHEN next_step.step IS NOT NULL THEN fs.session_id END) as completions,
        COUNT(DISTINCT CASE WHEN next_step.step IS NULL THEN fs.session_id END) as abandons,
        CASE 
            WHEN COUNT(DISTINCT fs.session_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN next_step.step IS NOT NULL THEN fs.session_id END)::DECIMAL / COUNT(DISTINCT fs.session_id) * 100)
            ELSE 0 
        END as conversion_rate,
        COALESCE(AVG(fs.time_diff), 0) as average_time
    FROM funnel_steps fs
    LEFT JOIN funnel_steps next_step ON fs.session_id = next_step.session_id AND next_step.step = fs.step + 1
    WHERE fs.step IS NOT NULL
    GROUP BY fs.step, fs.step_name, fs.question_id
    ORDER BY fs.step;
END;
$$ LANGUAGE plpgsql;

-- Function to get device analytics
CREATE OR REPLACE FUNCTION get_device_analytics(filters TEXT)
RETURNS TABLE (
    device_type TEXT,
    count BIGINT,
    percentage DECIMAL,
    conversion_rate DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    WITH device_stats AS (
        SELECT 
            ae.device_type,
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') as completions
        FROM analytics_events ae
        WHERE 
            (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
            AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
            AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
            AND ae.device_type IS NOT NULL
        GROUP BY ae.device_type
    ),
    total_count AS (
        SELECT SUM(total_events) as total FROM device_stats
    )
    SELECT 
        ds.device_type,
        ds.total_events,
        (ds.total_events::DECIMAL / tc.total * 100) as percentage,
        CASE WHEN ds.total_events > 0 THEN (ds.completions::DECIMAL / ds.total_events * 100) ELSE 0 END as conversion_rate
    FROM device_stats ds
    CROSS JOIN total_count tc
    ORDER BY ds.total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get geographic analytics
CREATE OR REPLACE FUNCTION get_geographic_analytics(filters TEXT)
RETURNS TABLE (
    country TEXT,
    count BIGINT,
    percentage DECIMAL,
    conversion_rate DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    WITH geo_stats AS (
        SELECT 
            COALESCE(ae.country, 'Unknown') as country,
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') as completions
        FROM analytics_events ae
        WHERE 
            (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
            AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
            AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
        GROUP BY COALESCE(ae.country, 'Unknown')
    ),
    total_count AS (
        SELECT SUM(total_events) as total FROM geo_stats
    )
    SELECT 
        gs.country,
        gs.total_events,
        (gs.total_events::DECIMAL / tc.total * 100) as percentage,
        CASE WHEN gs.total_events > 0 THEN (gs.completions::DECIMAL / gs.total_events * 100) ELSE 0 END as conversion_rate
    FROM geo_stats gs
    CROSS JOIN total_count tc
    ORDER BY gs.total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get UTM analytics
CREATE OR REPLACE FUNCTION get_utm_analytics(filters TEXT)
RETURNS TABLE (
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    views BIGINT,
    conversions BIGINT,
    conversion_rate DECIMAL,
    leads BIGINT,
    lead_conversion_rate DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    SELECT 
        COALESCE(ae.utm_source, 'direct') as utm_source,
        ae.utm_medium,
        ae.utm_campaign,
        COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as views,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') as conversions,
        CASE 
            WHEN COUNT(*) FILTER (WHERE ae.event_type = 'page_view') > 0 
            THEN (COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed')::DECIMAL / COUNT(*) FILTER (WHERE ae.event_type = 'page_view') * 100)
            ELSE 0 
        END as conversion_rate,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated') as leads,
        CASE 
            WHEN COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') > 0 
            THEN (COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated')::DECIMAL / COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') * 100)
            ELSE 0 
        END as lead_conversion_rate
    FROM analytics_events ae
    WHERE 
        (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
        AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
        AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
    GROUP BY COALESCE(ae.utm_source, 'direct'), ae.utm_medium, ae.utm_campaign
    HAVING COUNT(*) > 0
    ORDER BY views DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get lead analytics
CREATE OR REPLACE FUNCTION get_lead_analytics(filters TEXT)
RETURNS TABLE (
    total_leads BIGINT,
    conversion_rate DECIMAL,
    cost_per_lead DECIMAL,
    lead_quality_score DECIMAL,
    lead_sources JSONB,
    lead_conversion_funnel JSONB
) AS $$
DECLARE
    filter_obj JSONB;
    sources_result JSONB;
    funnel_result JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    -- Get lead sources
    SELECT jsonb_agg(
        jsonb_build_object(
            'source', source,
            'count', count,
            'percentage', percentage,
            'quality_score', quality_score
        )
    ) INTO sources_result
    FROM (
        SELECT 
            COALESCE(ae.utm_source, 'direct') as source,
            COUNT(*) as count,
            (COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100) as percentage,
            (RANDOM() * 5 + 5)::DECIMAL(3,1) as quality_score -- Mock quality score
        FROM analytics_events ae
        WHERE 
            ae.event_type = 'quiz_completed' 
            AND ae.event_data ? 'lead_generated'
            AND (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
            AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
            AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
        GROUP BY COALESCE(ae.utm_source, 'direct')
        ORDER BY count DESC
    ) t;
    
    -- Get lead conversion funnel
    SELECT jsonb_agg(
        jsonb_build_object(
            'step', step,
            'leads_entered', leads_entered,
            'leads_converted', leads_converted,
            'conversion_rate', conversion_rate
        )
    ) INTO funnel_result
    FROM (
        VALUES 
            ('Visitante', 1000, 300, 30.0),
            ('Quiz Iniciado', 300, 150, 50.0),
            ('Quiz Concluído', 150, 75, 50.0),
            ('Lead Qualificado', 75, 45, 60.0)
    ) AS t(step, leads_entered, leads_converted, conversion_rate);
    
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated') as total_leads,
        CASE 
            WHEN COUNT(*) FILTER (WHERE ae.event_type = 'page_view') > 0 
            THEN (COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated')::DECIMAL / COUNT(*) FILTER (WHERE ae.event_type = 'page_view') * 100)
            ELSE 0 
        END as conversion_rate,
        25.50::DECIMAL as cost_per_lead, -- Mock cost per lead
        7.5::DECIMAL as lead_quality_score, -- Mock quality score
        COALESCE(sources_result, '[]'::JSONB) as lead_sources,
        COALESCE(funnel_result, '[]'::JSONB) as lead_conversion_funnel
    FROM analytics_events ae
    WHERE 
        (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
        AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
        AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION get_real_time_metrics()
RETURNS TABLE (
    active_users INTEGER,
    quiz_views_last_hour BIGINT,
    completions_last_hour BIGINT,
    leads_last_hour BIGINT,
    top_performing_quizzes JSONB
) AS $$
DECLARE
    top_quizzes JSONB;
BEGIN
    -- Get top performing quizzes
    SELECT jsonb_agg(
        jsonb_build_object(
            'quiz_id', quiz_id,
            'title', 'Quiz ' || quiz_id,
            'views', views,
            'conversions', conversions
        )
    ) INTO top_quizzes
    FROM (
        SELECT 
            ae.quiz_id,
            COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as views,
            COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed') as conversions
        FROM analytics_events ae
        WHERE 
            ae.created_at >= NOW() - INTERVAL '24 hours'
            AND ae.quiz_id IS NOT NULL
        GROUP BY ae.quiz_id
        ORDER BY views DESC
        LIMIT 5
    ) t;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE created_at >= NOW() - INTERVAL '30 minutes')::INTEGER as active_users,
        COUNT(*) FILTER (WHERE ae.event_type = 'page_view' AND ae.created_at >= NOW() - INTERVAL '1 hour') as quiz_views_last_hour,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.created_at >= NOW() - INTERVAL '1 hour') as completions_last_hour,
        COUNT(*) FILTER (WHERE ae.event_type = 'quiz_completed' AND ae.event_data ? 'lead_generated' AND ae.created_at >= NOW() - INTERVAL '1 hour') as leads_last_hour,
        COALESCE(top_quizzes, '[]'::JSONB) as top_performing_quizzes
    FROM analytics_events ae;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance metrics
CREATE OR REPLACE FUNCTION get_performance_metrics(filters TEXT)
RETURNS TABLE (
    avg_load_time DECIMAL,
    avg_completion_time DECIMAL,
    bounce_rate DECIMAL,
    error_rate DECIMAL,
    mobile_performance_score DECIMAL,
    desktop_performance_score DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    SELECT 
        AVG(CASE WHEN ae.event_type = 'performance_metric' AND ae.event_data->>'metric' = 'page_load_time' THEN (ae.event_data->>'value')::DECIMAL END) as avg_load_time,
        AVG(CASE WHEN ae.event_type = 'quiz_completed' THEN (ae.event_data->>'total_time')::DECIMAL END) as avg_completion_time,
        CASE 
            WHEN COUNT(*) FILTER (WHERE ae.event_type = 'page_view') > 0 
            THEN (COUNT(*) FILTER (WHERE ae.event_type = 'quiz_abandoned')::DECIMAL / COUNT(*) FILTER (WHERE ae.event_type = 'page_view') * 100)
            ELSE 0 
        END as bounce_rate,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(*) FILTER (WHERE ae.event_type = 'javascript_error')::DECIMAL / COUNT(*) * 100)
            ELSE 0 
        END as error_rate,
        85.5::DECIMAL as mobile_performance_score, -- Mock performance score
        92.3::DECIMAL as desktop_performance_score -- Mock performance score
    FROM analytics_events ae
    WHERE 
        (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
        AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
        AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- Function to get heatmap data
CREATE OR REPLACE FUNCTION get_heatmap_data(filters TEXT)
RETURNS TABLE (
    question_id TEXT,
    option_id TEXT,
    element_type TEXT,
    interactions BIGINT,
    time_spent DECIMAL,
    x_position DECIMAL,
    y_position DECIMAL
) AS $$
DECLARE
    filter_obj JSONB;
BEGIN
    filter_obj := filters::JSONB;
    
    RETURN QUERY
    SELECT 
        ae.event_data->>'question_id' as question_id,
        ae.event_data->>'option_id' as option_id,
        ae.event_data->>'element_type' as element_type,
        COUNT(*) as interactions,
        AVG((ae.event_data->>'time_spent')::DECIMAL) as time_spent,
        AVG((ae.event_data->>'x_position')::DECIMAL) as x_position,
        AVG((ae.event_data->>'y_position')::DECIMAL) as y_position
    FROM analytics_events ae
    WHERE 
        ae.event_type = 'element_interaction'
        AND (filter_obj->>'quiz_id' IS NULL OR ae.quiz_id = filter_obj->>'quiz_id')
        AND (filter_obj->>'date_from' IS NULL OR ae.created_at >= (filter_obj->>'date_from')::DATE)
        AND (filter_obj->>'date_to' IS NULL OR ae.created_at <= (filter_obj->>'date_to')::DATE + INTERVAL '1 day')
    GROUP BY 
        ae.event_data->>'question_id',
        ae.event_data->>'option_id',
        ae.event_data->>'element_type'
    ORDER BY interactions DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security) if needed
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (customize based on your auth system)
CREATE POLICY "Users can view their own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert analytics events" ON analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own reports" ON analytics_reports
    FOR ALL USING (true); -- Customize based on your needs

CREATE POLICY "Users can manage integration settings" ON integration_settings
    FOR ALL USING (true); -- Customize based on your needs