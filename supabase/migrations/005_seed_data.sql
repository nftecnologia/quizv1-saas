-- Insert sample users (these would typically be created through auth.users)
INSERT INTO public.users (id, email, plan) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'pro'),
('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', 'free'),
('550e8400-e29b-41d4-a716-446655440002', 'admin@example.com', 'enterprise');

-- Insert sample user plans
INSERT INTO public.user_plans (user_id, plan_id, status, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'pro', 'active', '2024-12-31 23:59:59'),
('550e8400-e29b-41d4-a716-446655440001', 'free', 'active', NULL),
('550e8400-e29b-41d4-a716-446655440002', 'enterprise', 'active', '2024-12-31 23:59:59');

-- Insert sample templates
INSERT INTO public.templates (id, user_id, title, description, config, category) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Lead Generation Quiz', 'Template for lead generation with multiple choice questions', 
'{"theme": "modern", "colors": {"primary": "#3B82F6", "secondary": "#EF4444"}, "layout": "vertical"}', 'lead-generation'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Product Recommendation', 'Template for product recommendation based on user preferences',
'{"theme": "elegant", "colors": {"primary": "#10B981", "secondary": "#F59E0B"}, "layout": "horizontal"}', 'product-recommendation'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Personality Test', 'Template for personality assessment quiz',
'{"theme": "playful", "colors": {"primary": "#8B5CF6", "secondary": "#F472B6"}, "layout": "card"}', 'personality-test');

-- Insert sample funnels
INSERT INTO public.funnels (id, user_id, title, description, config, published) VALUES
('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Marketing Quiz', 'A quiz to generate leads for our marketing agency', 
'{"theme": "modern", "colors": {"primary": "#3B82F6", "secondary": "#EF4444"}, "settings": {"showProgress": true, "allowBack": false}}', true),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Product Finder', 'Help customers find the right product', 
'{"theme": "elegant", "colors": {"primary": "#10B981", "secondary": "#F59E0B"}, "settings": {"showProgress": false, "allowBack": true}}', true),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Draft Quiz', 'Work in progress quiz', 
'{"theme": "default", "colors": {"primary": "#6B7280", "secondary": "#9CA3AF"}, "settings": {"showProgress": true, "allowBack": true}}', false);

-- Insert sample steps
INSERT INTO public.steps (id, funnel_id, order_num, title, config) VALUES
-- Steps for Marketing Quiz
('880e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 1, 'Welcome', 
'{"subtitle": "Discover your marketing potential", "description": "Answer a few questions to get personalized recommendations"}'),
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', 2, 'Business Type', 
'{"subtitle": "Tell us about your business", "description": "This helps us provide better recommendations"}'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440000', 3, 'Budget Range', 
'{"subtitle": "What\'s your marketing budget?", "description": "Choose the range that best fits your situation"}'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440000', 4, 'Contact Information', 
'{"subtitle": "Get your results", "description": "We\'ll send your personalized marketing plan"}'),

-- Steps for Product Finder
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 1, 'Product Category', 
'{"subtitle": "What are you looking for?", "description": "Choose the category that interests you most"}'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', 2, 'Price Range', 
'{"subtitle": "What\'s your budget?", "description": "Select your preferred price range"}'),
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440001', 3, 'Recommendations', 
'{"subtitle": "Perfect matches for you", "description": "Based on your preferences, here are our recommendations"}');

-- Insert sample elements
INSERT INTO public.elements (id, step_id, type, config, order_num) VALUES
-- Elements for Marketing Quiz - Welcome step
('990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000', 'text', 
'{"content": "Welcome to our Marketing Assessment", "size": "large", "alignment": "center", "color": "#1F2937"}', 1),
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440000', 'image', 
'{"src": "/images/marketing-hero.jpg", "alt": "Marketing Assessment", "width": "400", "height": "300"}', 2),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440000', 'button', 
'{"text": "Start Assessment", "style": "primary", "size": "large", "action": "next"}', 3),

-- Elements for Marketing Quiz - Business Type step
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 'multiple_choice', 
'{"question": "What type of business do you have?", "options": [
    {"value": "ecommerce", "text": "E-commerce Store", "image": "/images/ecommerce.jpg"},
    {"value": "service", "text": "Service Business", "image": "/images/service.jpg"},
    {"value": "saas", "text": "SaaS Product", "image": "/images/saas.jpg"},
    {"value": "local", "text": "Local Business", "image": "/images/local.jpg"}
], "required": true, "multiSelect": false}', 1),

-- Elements for Marketing Quiz - Budget Range step
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', 'multiple_choice', 
'{"question": "What\'s your monthly marketing budget?", "options": [
    {"value": "under1k", "text": "Under $1,000"},
    {"value": "1k-5k", "text": "$1,000 - $5,000"},
    {"value": "5k-10k", "text": "$5,000 - $10,000"},
    {"value": "over10k", "text": "Over $10,000"}
], "required": true, "multiSelect": false}', 1),

-- Elements for Marketing Quiz - Contact Information step
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440003', 'input', 
'{"type": "email", "label": "Email Address", "placeholder": "your@email.com", "required": true}', 1),
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440003', 'input', 
'{"type": "text", "label": "Full Name", "placeholder": "John Doe", "required": true}', 2),
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003', 'input', 
'{"type": "tel", "label": "Phone Number", "placeholder": "(555) 123-4567", "required": false}', 3),
('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440003', 'button', 
'{"text": "Get My Marketing Plan", "style": "primary", "size": "large", "action": "submit"}', 4),

-- Elements for Product Finder - Product Category step
('990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440004', 'multiple_choice', 
'{"question": "Which category interests you most?", "options": [
    {"value": "electronics", "text": "Electronics"},
    {"value": "clothing", "text": "Clothing & Fashion"},
    {"value": "home", "text": "Home & Garden"},
    {"value": "sports", "text": "Sports & Outdoors"}
], "required": true, "multiSelect": false}', 1),

-- Elements for Product Finder - Price Range step
('990e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440005', 'multiple_choice', 
'{"question": "What\'s your preferred price range?", "options": [
    {"value": "budget", "text": "Budget ($0-$50)"},
    {"value": "mid", "text": "Mid-range ($50-$200)"},
    {"value": "premium", "text": "Premium ($200+)"}
], "required": true, "multiSelect": false}', 1);

-- Insert sample leads
INSERT INTO public.leads (id, funnel_id, email, name, phone, answers, utm_source, utm_medium, utm_campaign) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'john.doe@example.com', 'John Doe', '(555) 123-4567', 
'{"business_type": "ecommerce", "budget": "1k-5k"}', 'google', 'cpc', 'summer-2024'),
('aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', 'jane.smith@example.com', 'Jane Smith', '(555) 987-6543', 
'{"business_type": "service", "budget": "5k-10k"}', 'facebook', 'social', 'fb-ads-q2'),
('aa0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'mike.wilson@example.com', 'Mike Wilson', '', 
'{"category": "electronics", "price_range": "premium"}', 'organic', 'search', ''),
('aa0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@example.com', 'Sarah Johnson', '(555) 456-7890', 
'{"category": "clothing", "price_range": "mid"}', 'instagram', 'social', 'ig-stories');

-- Insert sample analytics
INSERT INTO public.analytics (id, funnel_id, views, conversions, completion_rate) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 150, 12, 85.5),
('bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', 200, 15, 82.3),
('bb0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 89, 7, 91.2),
('bb0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 134, 11, 87.8);

-- Create some analytics data for the last 7 days
INSERT INTO public.analytics (funnel_id, views, conversions, completion_rate, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440000', 25, 2, 88.0, NOW() - INTERVAL '1 day'),
('770e8400-e29b-41d4-a716-446655440000', 30, 3, 85.5, NOW() - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440000', 18, 1, 82.1, NOW() - INTERVAL '3 days'),
('770e8400-e29b-41d4-a716-446655440000', 22, 2, 86.3, NOW() - INTERVAL '4 days'),
('770e8400-e29b-41d4-a716-446655440000', 35, 4, 89.2, NOW() - INTERVAL '5 days'),
('770e8400-e29b-41d4-a716-446655440000', 28, 2, 84.7, NOW() - INTERVAL '6 days'),
('770e8400-e29b-41d4-a716-446655440000', 42, 5, 91.3, NOW() - INTERVAL '7 days'),

('770e8400-e29b-41d4-a716-446655440001', 15, 1, 92.1, NOW() - INTERVAL '1 day'),
('770e8400-e29b-41d4-a716-446655440001', 20, 2, 89.5, NOW() - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440001', 12, 1, 87.8, NOW() - INTERVAL '3 days'),
('770e8400-e29b-41d4-a716-446655440001', 18, 1, 90.2, NOW() - INTERVAL '4 days'),
('770e8400-e29b-41d4-a716-446655440001', 25, 3, 93.1, NOW() - INTERVAL '5 days'),
('770e8400-e29b-41d4-a716-446655440001', 22, 2, 88.9, NOW() - INTERVAL '6 days'),
('770e8400-e29b-41d4-a716-446655440001', 30, 3, 91.7, NOW() - INTERVAL '7 days');