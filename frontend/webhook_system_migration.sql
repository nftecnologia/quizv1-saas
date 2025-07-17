-- Migration: Webhook System and User Plans
-- Description: Complete webhook processing system with user plan management

-- Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'active',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    current_usage JSONB NOT NULL DEFAULT '{"funnels_created": 0, "leads_collected": 0, "last_reset_at": ""}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, status) -- Only one active plan per user
);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('hotmart', 'eduzz', 'stripe', 'kirvano', 'monetizze')),
    event_type TEXT NOT NULL,
    transaction_id TEXT,
    user_email TEXT NOT NULL,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_jobs table
CREATE TABLE IF NOT EXISTS webhook_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    webhook_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create upgrade_notifications table
CREATE TABLE IF NOT EXISTS upgrade_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('limit_warning', 'limit_reached', 'plan_expired', 'upgrade_available')),
    seen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);
CREATE INDEX IF NOT EXISTS idx_user_plans_expires_at ON user_plans(expires_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_platform ON webhook_events(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_email ON webhook_events(user_email);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_transaction_id ON webhook_events(transaction_id);

CREATE INDEX IF NOT EXISTS idx_webhook_jobs_status ON webhook_jobs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_jobs_scheduled_at ON webhook_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_webhook_jobs_webhook_event_id ON webhook_jobs(webhook_event_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_platform ON transactions(platform);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_upgrade_notifications_user_id ON upgrade_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_notifications_seen ON upgrade_notifications(seen);
CREATE INDEX IF NOT EXISTS idx_upgrade_notifications_type ON upgrade_notifications(type);

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_plans
CREATE POLICY "Users can view their own plans" ON user_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON user_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for upgrade_notifications
CREATE POLICY "Users can view their own notifications" ON upgrade_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON upgrade_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin-only policies for webhook tables (only service role can access)
CREATE POLICY "Service role can manage webhook_events" ON webhook_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage webhook_jobs" ON webhook_jobs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_statistics()
RETURNS TABLE (
    total_events BIGINT,
    processed_events BIGINT,
    failed_events BIGINT,
    success_rate NUMERIC,
    avg_processing_time INTERVAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE processed = true) as processed_events,
        COUNT(*) FILTER (WHERE error_message IS NOT NULL) as failed_events,
        CASE 
            WHEN COUNT(*) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE processed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate,
        AVG(CASE 
            WHEN processed = true AND last_attempt_at IS NOT NULL 
            THEN last_attempt_at - created_at 
            ELSE NULL 
        END) as avg_processing_time
    FROM webhook_events
    WHERE created_at >= NOW() - INTERVAL '30 days';
END;
$$;

-- Function to check and update plan expiration
CREATE OR REPLACE FUNCTION check_plan_expiration(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_plan user_plans%ROWTYPE;
BEGIN
    -- Get current active plan
    SELECT * INTO current_plan
    FROM user_plans
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    -- If no plan found, create free plan
    IF current_plan IS NULL THEN
        INSERT INTO user_plans (user_id, plan_type, status, starts_at, current_usage)
        VALUES (
            user_uuid,
            'free',
            'active',
            NOW(),
            '{"funnels_created": 0, "leads_collected": 0, "last_reset_at": ""}'::jsonb
        );
        RETURN;
    END IF;
    
    -- Check if plan has expired
    IF current_plan.expires_at IS NOT NULL AND current_plan.expires_at < NOW() THEN
        -- Mark current plan as expired
        UPDATE user_plans 
        SET status = 'expired', updated_at = NOW()
        WHERE id = current_plan.id;
        
        -- Create new free plan
        INSERT INTO user_plans (user_id, plan_type, status, starts_at, current_usage)
        VALUES (
            user_uuid,
            'free',
            'active',
            NOW(),
            '{"funnels_created": 0, "leads_collected": 0, "last_reset_at": ""}'::jsonb
        );
        
        -- Create expiration notification
        INSERT INTO upgrade_notifications (user_id, message, type)
        VALUES (
            user_uuid,
            'Your plan has expired. You have been moved to the free plan.',
            'plan_expired'
        );
    END IF;
END;
$$;

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_plans
    SET 
        current_usage = jsonb_set(
            jsonb_set(
                current_usage,
                '{leads_collected}',
                '0'
            ),
            '{last_reset_at}',
            to_jsonb(NOW()::text)
        ),
        updated_at = NOW()
    WHERE 
        status = 'active' AND
        (
            current_usage->>'last_reset_at' IS NULL OR
            (current_usage->>'last_reset_at')::timestamptz < date_trunc('month', NOW())
        );
END;
$$;

-- Function to update user plan (called by webhook processing)
CREATE OR REPLACE FUNCTION update_user_plan(
    user_uuid UUID,
    plan_type_new TEXT,
    expires_at_new TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deactivate existing plan
    UPDATE user_plans 
    SET status = 'cancelled', updated_at = NOW()
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Insert new plan
    INSERT INTO user_plans (
        user_id, 
        plan_type, 
        status, 
        starts_at, 
        expires_at, 
        current_usage
    )
    VALUES (
        user_uuid,
        plan_type_new,
        'active',
        NOW(),
        expires_at_new,
        '{"funnels_created": 0, "leads_collected": 0, "last_reset_at": ""}'::jsonb
    );
END;
$$;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage_counter(
    user_uuid UUID,
    counter_type TEXT, -- 'funnels' or 'leads'
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_plan user_plans%ROWTYPE;
    field_name TEXT;
    current_value INTEGER;
    max_limit INTEGER;
BEGIN
    -- Get current plan
    SELECT * INTO current_plan
    FROM user_plans
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    IF current_plan IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Determine field name and limits
    IF counter_type = 'funnels' THEN
        field_name := 'funnels_created';
        CASE current_plan.plan_type
            WHEN 'free' THEN max_limit := 3;
            WHEN 'pro' THEN max_limit := 50;
            WHEN 'enterprise' THEN max_limit := NULL; -- unlimited
        END CASE;
    ELSIF counter_type = 'leads' THEN
        field_name := 'leads_collected';
        CASE current_plan.plan_type
            WHEN 'free' THEN max_limit := 100;
            WHEN 'pro' THEN max_limit := 5000;
            WHEN 'enterprise' THEN max_limit := NULL; -- unlimited
        END CASE;
    ELSE
        RETURN FALSE;
    END IF;
    
    -- Get current value
    current_value := (current_plan.current_usage ->> field_name)::INTEGER;
    
    -- Check limits (NULL means unlimited)
    IF max_limit IS NOT NULL AND current_value + increment_by > max_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Update counter
    UPDATE user_plans
    SET 
        current_usage = jsonb_set(
            current_usage,
            ('{' || field_name || '}')::text[],
            ((current_value + increment_by)::text)::jsonb
        ),
        updated_at = NOW()
    WHERE id = current_plan.id;
    
    RETURN TRUE;
END;
$$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Scheduled job to check plan expirations (to be run daily)
-- This would typically be handled by a cron job or scheduled function
CREATE OR REPLACE FUNCTION check_all_plan_expirations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN
        SELECT DISTINCT user_id
        FROM user_plans
        WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= NOW()
    LOOP
        PERFORM check_plan_expiration(user_record.user_id);
    END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert sample data for testing (optional)
/*
INSERT INTO user_plans (user_id, plan_type, status, starts_at, current_usage) VALUES 
(gen_random_uuid(), 'free', 'active', NOW(), '{"funnels_created": 2, "leads_collected": 45, "last_reset_at": "2024-01-01T00:00:00Z"}'),
(gen_random_uuid(), 'pro', 'active', NOW(), '{"funnels_created": 15, "leads_collected": 1200, "last_reset_at": "2024-01-01T00:00:00Z"}');
*/

-- Comments
COMMENT ON TABLE user_plans IS 'Stores user subscription plans and usage limits';
COMMENT ON TABLE webhook_events IS 'Stores incoming webhook events from payment platforms';
COMMENT ON TABLE webhook_jobs IS 'Queue for processing webhook events asynchronously';
COMMENT ON TABLE transactions IS 'Stores completed payment transactions';
COMMENT ON TABLE upgrade_notifications IS 'Stores notifications for plan upgrades and limits';

COMMENT ON FUNCTION get_webhook_statistics() IS 'Returns statistics about webhook processing performance';
COMMENT ON FUNCTION check_plan_expiration(UUID) IS 'Checks and handles plan expiration for a specific user';
COMMENT ON FUNCTION reset_monthly_usage() IS 'Resets monthly usage counters for all active plans';
COMMENT ON FUNCTION update_user_plan(UUID, TEXT, TIMESTAMPTZ) IS 'Updates user plan after successful payment';
COMMENT ON FUNCTION increment_usage_counter(UUID, TEXT, INTEGER) IS 'Safely increments usage counters with limit checking';