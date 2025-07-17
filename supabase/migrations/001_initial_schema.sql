-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create funnels table
CREATE TABLE IF NOT EXISTS public.funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create steps table
CREATE TABLE IF NOT EXISTS public.steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
    order_num INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(funnel_id, order_num)
);

-- Create elements table
CREATE TABLE IF NOT EXISTS public.elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID REFERENCES public.steps(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'video', 'button', 'input', 'multiple_choice', 'rating', 'comparison', 'carousel', 'testimonial', 'chart', 'price')),
    config JSONB DEFAULT '{}',
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(step_id, order_num)
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
    email VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    answers JSONB DEFAULT '{}',
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(funnel_id, DATE(created_at))
);

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL CHECK (plan_id IN ('free', 'pro', 'enterprise')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, plan_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_funnels_user_id ON public.funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_published ON public.funnels(published);
CREATE INDEX IF NOT EXISTS idx_steps_funnel_id ON public.steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_steps_order ON public.steps(funnel_id, order_num);
CREATE INDEX IF NOT EXISTS idx_elements_step_id ON public.elements(step_id);
CREATE INDEX IF NOT EXISTS idx_elements_order ON public.elements(step_id, order_num);
CREATE INDEX IF NOT EXISTS idx_leads_funnel_id ON public.leads(funnel_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_id ON public.analytics(funnel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON public.user_plans(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_funnels_updated_at
    BEFORE UPDATE ON public.funnels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_steps_updated_at
    BEFORE UPDATE ON public.steps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_elements_updated_at
    BEFORE UPDATE ON public.elements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();