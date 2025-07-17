-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for funnels table
CREATE POLICY "Users can view own funnels" ON public.funnels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own funnels" ON public.funnels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own funnels" ON public.funnels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own funnels" ON public.funnels
    FOR DELETE USING (auth.uid() = user_id);

-- Allow anonymous users to view published funnels
CREATE POLICY "Anonymous users can view published funnels" ON public.funnels
    FOR SELECT USING (published = true);

-- RLS Policies for steps table
CREATE POLICY "Users can view own funnel steps" ON public.steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = steps.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own funnel steps" ON public.steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = steps.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own funnel steps" ON public.steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = steps.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own funnel steps" ON public.steps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = steps.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

-- Allow anonymous users to view published funnel steps
CREATE POLICY "Anonymous users can view published funnel steps" ON public.steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = steps.funnel_id 
            AND funnels.published = true
        )
    );

-- RLS Policies for elements table
CREATE POLICY "Users can view own step elements" ON public.elements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.steps 
            JOIN public.funnels ON funnels.id = steps.funnel_id
            WHERE steps.id = elements.step_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own step elements" ON public.elements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.steps 
            JOIN public.funnels ON funnels.id = steps.funnel_id
            WHERE steps.id = elements.step_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own step elements" ON public.elements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.steps 
            JOIN public.funnels ON funnels.id = steps.funnel_id
            WHERE steps.id = elements.step_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own step elements" ON public.elements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.steps 
            JOIN public.funnels ON funnels.id = steps.funnel_id
            WHERE steps.id = elements.step_id 
            AND funnels.user_id = auth.uid()
        )
    );

-- Allow anonymous users to view published funnel elements
CREATE POLICY "Anonymous users can view published funnel elements" ON public.elements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.steps 
            JOIN public.funnels ON funnels.id = steps.funnel_id
            WHERE steps.id = elements.step_id 
            AND funnels.published = true
        )
    );

-- RLS Policies for leads table
CREATE POLICY "Users can view own funnel leads" ON public.leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = leads.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

-- Allow anonymous users to insert leads for published funnels
CREATE POLICY "Anyone can insert leads for published funnels" ON public.leads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = leads.funnel_id 
            AND funnels.published = true
        )
    );

-- RLS Policies for analytics table
CREATE POLICY "Users can view own funnel analytics" ON public.analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = analytics.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own funnel analytics" ON public.analytics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = analytics.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own funnel analytics" ON public.analytics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.funnels 
            WHERE funnels.id = analytics.funnel_id 
            AND funnels.user_id = auth.uid()
        )
    );

-- RLS Policies for templates table
CREATE POLICY "Users can view own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_plans table
CREATE POLICY "Users can view own plans" ON public.user_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON public.user_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON public.user_plans
    FOR UPDATE USING (auth.uid() = user_id);