-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('funnel-images', 'funnel-images', true),
('funnel-videos', 'funnel-videos', true),
('user-uploads', 'user-uploads', false),
('templates', 'templates', true);

-- Storage policies for funnel-images bucket
CREATE POLICY "Users can view funnel images" ON storage.objects
    FOR SELECT USING (bucket_id = 'funnel-images');

CREATE POLICY "Users can upload funnel images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'funnel-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own funnel images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'funnel-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own funnel images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'funnel-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for funnel-videos bucket
CREATE POLICY "Users can view funnel videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'funnel-videos');

CREATE POLICY "Users can upload funnel videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'funnel-videos' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own funnel videos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'funnel-videos' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own funnel videos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'funnel-videos' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for user-uploads bucket (private)
CREATE POLICY "Users can view own uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-uploads' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-uploads' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own uploads" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-uploads' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own uploads" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-uploads' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for templates bucket
CREATE POLICY "Everyone can view templates" ON storage.objects
    FOR SELECT USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can upload templates" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'templates' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own templates" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'templates' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own templates" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'templates' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Create function to generate signed URLs for uploads
CREATE OR REPLACE FUNCTION public.generate_upload_url(
    bucket_name TEXT,
    file_path TEXT,
    expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
    signed_url TEXT;
BEGIN
    -- This function would typically use Supabase's built-in storage functions
    -- For now, we'll return a placeholder that can be implemented client-side
    RETURN 'https://your-project.supabase.co/storage/v1/object/sign/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up unused files
CREATE OR REPLACE FUNCTION public.cleanup_unused_files()
RETURNS VOID AS $$
BEGIN
    -- Delete files older than 30 days that are not referenced in any funnel
    DELETE FROM storage.objects 
    WHERE bucket_id IN ('funnel-images', 'funnel-videos', 'user-uploads')
    AND created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
        SELECT 1 FROM public.funnels f 
        WHERE f.config::text LIKE '%' || objects.name || '%'
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.steps s 
        WHERE s.config::text LIKE '%' || objects.name || '%'
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.elements e 
        WHERE e.config::text LIKE '%' || objects.name || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get file upload stats
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_uuid UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    images_count BIGINT,
    videos_count BIGINT,
    uploads_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size,
        COUNT(*) FILTER (WHERE bucket_id = 'funnel-images') as images_count,
        COUNT(*) FILTER (WHERE bucket_id = 'funnel-videos') as videos_count,
        COUNT(*) FILTER (WHERE bucket_id = 'user-uploads') as uploads_count
    FROM storage.objects
    WHERE (storage.foldername(name))[1] = user_uuid::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;