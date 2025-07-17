-- This file contains additional seed data for development environment
-- Run this after the initial migrations to populate the database with more test data

-- Insert additional test users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change_sent_at,
    recovery_sent_at,
    invited_at,
    action_link,
    email_otp,
    phone_otp,
    recovery_otp,
    email_change_token_new_sent_at,
    phone_change_token_new_sent_at
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440003',
    'authenticated',
    'authenticated',
    'developer@example.com',
    '$2a$10$N2W.8QaY9J8QfOWrVpO2SeKZ1gKQOYsGLK9YfkNuYJKfqgVJJ8qey', -- password: password123
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    '',
    0,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Developer User"}',
    false,
    NULL,
    NULL,
    '',
    '',
    NULL,
    NOW(),
    NULL,
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    NULL,
    NULL
);

-- Insert more sample templates for different use cases
INSERT INTO public.templates (user_id, title, description, config, category) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Customer Satisfaction Survey', 'Template for collecting customer feedback', 
'{"theme": "professional", "colors": {"primary": "#4F46E5", "secondary": "#06B6D4"}, "layout": "survey"}', 'feedback'),
('550e8400-e29b-41d4-a716-446655440000', 'Skills Assessment', 'Template for evaluating employee skills', 
'{"theme": "corporate", "colors": {"primary": "#059669", "secondary": "#DC2626"}, "layout": "assessment"}', 'hr'),
('550e8400-e29b-41d4-a716-446655440000', 'Event Registration', 'Template for event sign-ups with conditional logic', 
'{"theme": "festive", "colors": {"primary": "#7C3AED", "secondary": "#F59E0B"}, "layout": "registration"}', 'events'),
('550e8400-e29b-41d4-a716-446655440000', 'Medical Intake Form', 'Template for patient information collection', 
'{"theme": "medical", "colors": {"primary": "#0891B2", "secondary": "#16A34A"}, "layout": "form"}', 'healthcare'),
('550e8400-e29b-41d4-a716-446655440000', 'Real Estate Qualifier', 'Template for qualifying potential buyers', 
'{"theme": "luxury", "colors": {"primary": "#B45309", "secondary": "#BE185D"}, "layout": "qualifier"}', 'real-estate');

-- Insert more diverse funnels
INSERT INTO public.funnels (user_id, title, description, config, published) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Customer Onboarding', 'Welcome new customers with interactive onboarding', 
'{"theme": "welcome", "colors": {"primary": "#0EA5E9", "secondary": "#84CC16"}, "settings": {"showProgress": true, "allowBack": true, "timeLimit": 600}}', true),
('550e8400-e29b-41d4-a716-446655440001', 'Fitness Assessment', 'Assess fitness levels and goals', 
'{"theme": "fitness", "colors": {"primary": "#DC2626", "secondary": "#059669"}, "settings": {"showProgress": false, "allowBack": true}}', true),
('550e8400-e29b-41d4-a716-446655440003', 'Code Review Quiz', 'Test coding knowledge and best practices', 
'{"theme": "tech", "colors": {"primary": "#1F2937", "secondary": "#6366F1"}, "settings": {"showProgress": true, "allowBack": false, "timeLimit": 1800}}', false);

-- Insert more complex lead data with realistic UTM parameters
INSERT INTO public.leads (funnel_id, email, name, phone, answers, utm_source, utm_medium, utm_campaign, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440000', 'marketing.director@company.com', 'Alex Johnson', '(555) 111-2222', 
'{"business_type": "saas", "budget": "over10k", "challenges": ["lead_generation", "customer_retention"]}', 'linkedin', 'social', 'b2b-marketing-2024', NOW() - INTERVAL '2 hours'),
('770e8400-e29b-41d4-a716-446655440000', 'startup.founder@newco.com', 'Maria Rodriguez', '(555) 333-4444', 
'{"business_type": "ecommerce", "budget": "5k-10k", "challenges": ["brand_awareness", "conversion_optimization"]}', 'twitter', 'social', 'startup-growth', NOW() - INTERVAL '4 hours'),
('770e8400-e29b-41d4-a716-446655440001', 'buyer@example.com', 'David Kim', '(555) 555-6666', 
'{"category": "home", "price_range": "budget", "preferences": ["eco_friendly", "modern_design"]}', 'google', 'organic', '', NOW() - INTERVAL '1 day'),
('770e8400-e29b-41d4-a716-446655440001', 'shopper@test.com', 'Lisa Chen', '(555) 777-8888', 
'{"category": "sports", "price_range": "premium", "preferences": ["professional_grade", "durability"]}', 'email', 'newsletter', 'weekly-deals', NOW() - INTERVAL '6 hours');

-- Insert more analytics data for better dashboard visualization
INSERT INTO public.analytics (funnel_id, views, conversions, completion_rate, created_at) VALUES
-- More historical data for Marketing Quiz
('770e8400-e29b-41d4-a716-446655440000', 45, 6, 88.9, NOW() - INTERVAL '8 days'),
('770e8400-e29b-41d4-a716-446655440000', 38, 4, 85.2, NOW() - INTERVAL '9 days'),
('770e8400-e29b-41d4-a716-446655440000', 52, 7, 91.1, NOW() - INTERVAL '10 days'),
('770e8400-e29b-41d4-a716-446655440000', 33, 3, 83.7, NOW() - INTERVAL '11 days'),
('770e8400-e29b-41d4-a716-446655440000', 41, 5, 87.3, NOW() - INTERVAL '12 days'),
('770e8400-e29b-41d4-a716-446655440000', 29, 2, 82.8, NOW() - INTERVAL '13 days'),
('770e8400-e29b-41d4-a716-446655440000', 37, 4, 86.5, NOW() - INTERVAL '14 days'),

-- Historical data for Product Finder
('770e8400-e29b-41d4-a716-446655440001', 28, 3, 94.2, NOW() - INTERVAL '8 days'),
('770e8400-e29b-41d4-a716-446655440001', 33, 4, 91.8, NOW() - INTERVAL '9 days'),
('770e8400-e29b-41d4-a716-446655440001', 19, 2, 89.5, NOW() - INTERVAL '10 days'),
('770e8400-e29b-41d4-a716-446655440001', 26, 3, 92.3, NOW() - INTERVAL '11 days'),
('770e8400-e29b-41d4-a716-446655440001', 31, 4, 88.7, NOW() - INTERVAL '12 days'),
('770e8400-e29b-41d4-a716-446655440001', 24, 2, 90.1, NOW() - INTERVAL '13 days'),
('770e8400-e29b-41d4-a716-446655440001', 35, 5, 93.6, NOW() - INTERVAL '14 days');

-- Insert some user action logs for testing
INSERT INTO public.user_actions (user_id, action, resource_type, resource_id, metadata) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'create', 'funnel', '770e8400-e29b-41d4-a716-446655440000', '{"title": "Marketing Quiz"}'),
('550e8400-e29b-41d4-a716-446655440000', 'publish', 'funnel', '770e8400-e29b-41d4-a716-446655440000', '{"published": true}'),
('550e8400-e29b-41d4-a716-446655440000', 'update', 'funnel', '770e8400-e29b-41d4-a716-446655440000', '{"field": "title", "old_value": "Marketing Quiz Draft", "new_value": "Marketing Quiz"}'),
('550e8400-e29b-41d4-a716-446655440001', 'create', 'funnel', '770e8400-e29b-41d4-a716-446655440001', '{"title": "Product Finder"}'),
('550e8400-e29b-41d4-a716-446655440001', 'publish', 'funnel', '770e8400-e29b-41d4-a716-446655440001', '{"published": true}'),
('550e8400-e29b-41d4-a716-446655440000', 'duplicate', 'funnel', '770e8400-e29b-41d4-a716-446655440002', '{"source_funnel": "770e8400-e29b-41d4-a716-446655440000", "title": "Draft Quiz"}');

-- Test data for demonstrating various element types
INSERT INTO public.funnels (id, user_id, title, description, config, published) VALUES
('770e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Element Showcase', 'Demonstrates all available element types', 
'{"theme": "showcase", "colors": {"primary": "#6366F1", "secondary": "#EC4899"}, "settings": {"showProgress": true, "allowBack": true}}', true);

INSERT INTO public.steps (id, funnel_id, order_num, title, config) VALUES
('880e8400-e29b-41d4-a716-446655440100', '770e8400-e29b-41d4-a716-446655440100', 1, 'Showcase Step', 
'{"subtitle": "All element types", "description": "This step shows all available element types"}');

INSERT INTO public.elements (step_id, type, config, order_num) VALUES
('880e8400-e29b-41d4-a716-446655440100', 'text', '{"content": "This is a text element", "size": "medium"}', 1),
('880e8400-e29b-41d4-a716-446655440100', 'image', '{"src": "/demo/image.jpg", "alt": "Demo image", "width": "300"}', 2),
('880e8400-e29b-41d4-a716-446655440100', 'video', '{"src": "/demo/video.mp4", "autoplay": false, "controls": true}', 3),
('880e8400-e29b-41d4-a716-446655440100', 'button', '{"text": "Click me", "style": "primary", "action": "next"}', 4),
('880e8400-e29b-41d4-a716-446655440100', 'input', '{"type": "text", "label": "Your name", "required": true}', 5),
('880e8400-e29b-41d4-a716-446655440100', 'rating', '{"question": "Rate this product", "scale": 5, "style": "stars"}', 6),
('880e8400-e29b-41d4-a716-446655440100', 'comparison', '{"items": [{"name": "Option A", "features": ["Fast", "Cheap"]}, {"name": "Option B", "features": ["Reliable", "Premium"]}]}', 7),
('880e8400-e29b-41d4-a716-446655440100', 'carousel', '{"images": ["/demo/slide1.jpg", "/demo/slide2.jpg", "/demo/slide3.jpg"], "autoplay": true}', 8),
('880e8400-e29b-41d4-a716-446655440100', 'testimonial', '{"quote": "This product changed my life!", "author": "Happy Customer", "avatar": "/demo/avatar.jpg"}', 9),
('880e8400-e29b-41d4-a716-446655440100', 'chart', '{"type": "bar", "data": {"labels": ["Jan", "Feb", "Mar"], "values": [10, 20, 30]}}', 10),
('880e8400-e29b-41d4-a716-446655440100', 'price', '{"amount": 99.99, "currency": "USD", "period": "month", "features": ["Feature 1", "Feature 2"]}', 11);