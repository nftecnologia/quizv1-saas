-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, plan)
    VALUES (NEW.id, NEW.email, 'free');
    
    INSERT INTO public.user_plans (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up user data when auth user is deleted
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Create function to check if user has permission for funnel
CREATE OR REPLACE FUNCTION public.user_has_funnel_access(user_id UUID, funnel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.funnels 
        WHERE id = funnel_id AND user_id = user_has_funnel_access.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user plan limits
CREATE OR REPLACE FUNCTION public.check_user_plan_limits(user_id UUID, resource_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan TEXT;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current plan
    SELECT plan INTO current_plan FROM public.users WHERE id = user_id;
    
    -- Set limits based on plan and resource type
    IF resource_type = 'funnels' THEN
        CASE current_plan
            WHEN 'free' THEN max_allowed := 3;
            WHEN 'pro' THEN max_allowed := 50;
            WHEN 'enterprise' THEN max_allowed := -1; -- unlimited
        END CASE;
        
        SELECT COUNT(*) INTO current_count 
        FROM public.funnels 
        WHERE user_id = check_user_plan_limits.user_id;
        
    ELSIF resource_type = 'leads_per_month' THEN
        CASE current_plan
            WHEN 'free' THEN max_allowed := 100;
            WHEN 'pro' THEN max_allowed := 5000;
            WHEN 'enterprise' THEN max_allowed := -1; -- unlimited
        END CASE;
        
        SELECT COUNT(*) INTO current_count 
        FROM public.leads l
        JOIN public.funnels f ON f.id = l.funnel_id
        WHERE f.user_id = check_user_plan_limits.user_id
        AND l.created_at >= DATE_TRUNC('month', CURRENT_DATE);
        
    ELSIF resource_type = 'storage_mb' THEN
        CASE current_plan
            WHEN 'free' THEN max_allowed := 100; -- 100MB
            WHEN 'pro' THEN max_allowed := 10000; -- 10GB
            WHEN 'enterprise' THEN max_allowed := -1; -- unlimited
        END CASE;
        
        SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) / 1024 / 1024 INTO current_count
        FROM storage.objects
        WHERE (storage.foldername(name))[1] = user_id::text;
        
    END IF;
    
    -- Return true if under limit or unlimited
    RETURN (max_allowed = -1 OR current_count < max_allowed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if user is admin (you can customize this logic)
    IF user_id = '550e8400-e29b-41d4-a716-446655440002' THEN
        RETURN 'admin';
    END IF;
    
    -- Get user plan as role
    SELECT plan INTO user_role FROM public.users WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to upgrade user plan
CREATE OR REPLACE FUNCTION public.upgrade_user_plan(
    user_id UUID,
    new_plan TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user plan
    UPDATE public.users SET plan = new_plan WHERE id = user_id;
    
    -- Update or insert user_plans record
    INSERT INTO public.user_plans (user_id, plan_id, status, expires_at)
    VALUES (user_id, new_plan, 'active', expires_at)
    ON CONFLICT (user_id, plan_id) 
    DO UPDATE SET 
        status = 'active',
        expires_at = EXCLUDED.expires_at;
    
    -- Deactivate old plans
    UPDATE public.user_plans 
    SET status = 'inactive' 
    WHERE user_id = upgrade_user_plan.user_id 
    AND plan_id != new_plan;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access admin functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin-only policies for user management
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all user plans" ON public.user_plans
    FOR ALL USING (is_admin(auth.uid()));

-- Create function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
    user_id UUID,
    action TEXT,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_actions (user_id, action, resource_type, resource_id, metadata)
    VALUES (user_id, action, resource_type, resource_id, metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user_actions table for audit log
CREATE TABLE IF NOT EXISTS public.user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for user actions
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON public.user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_resource ON public.user_actions(resource_type, resource_id);

-- Enable RLS on user_actions
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_actions
CREATE POLICY "Users can view own actions" ON public.user_actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all actions" ON public.user_actions
    FOR SELECT USING (is_admin(auth.uid()));

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    user_id UUID,
    action TEXT,
    time_window INTERVAL DEFAULT '1 minute',
    max_requests INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.user_actions
    WHERE user_id = check_rate_limit.user_id
    AND action = check_rate_limit.action
    AND created_at > (NOW() - time_window);
    
    RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate funnel publication
CREATE OR REPLACE FUNCTION public.can_publish_funnel(funnel_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    step_count INTEGER;
    element_count INTEGER;
BEGIN
    -- Check if funnel has at least one step
    SELECT COUNT(*) INTO step_count
    FROM public.steps
    WHERE funnel_id = can_publish_funnel.funnel_id;
    
    -- Check if funnel has at least one element
    SELECT COUNT(*) INTO element_count
    FROM public.elements e
    JOIN public.steps s ON s.id = e.step_id
    WHERE s.funnel_id = can_publish_funnel.funnel_id;
    
    RETURN step_count > 0 AND element_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;