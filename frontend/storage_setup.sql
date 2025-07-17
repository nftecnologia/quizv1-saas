-- =============================================
-- SUPABASE STORAGE SETUP
-- Sistema completo de upload de arquivos
-- =============================================

-- 1. Criar buckets do Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('videos', 'videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/mov']),
  ('documents', 'documents', true, 26214400, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Criar tabela para metadados dos arquivos
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  bucket TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'general',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  
  -- Índices
  CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_bucket ON public.media_files(bucket);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON public.media_files(type);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_at ON public.media_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_name_search ON public.media_files USING gin(to_tsvector('portuguese', name));

-- 3. Habilitar RLS na tabela
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para media_files
DROP POLICY IF EXISTS "Users can view own media files" ON public.media_files;
CREATE POLICY "Users can view own media files"
  ON public.media_files FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own media files" ON public.media_files;
CREATE POLICY "Users can insert own media files"
  ON public.media_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own media files" ON public.media_files;
CREATE POLICY "Users can update own media files"
  ON public.media_files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own media files" ON public.media_files;
CREATE POLICY "Users can delete own media files"
  ON public.media_files FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Políticas do Storage para images bucket
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
CREATE POLICY "Users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Políticas do Storage para videos bucket
DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
CREATE POLICY "Users can view own videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
CREATE POLICY "Users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Políticas do Storage para documents bucket
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Políticas do Storage para avatars bucket
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
CREATE POLICY "Users can view own avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 9. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_media_files_updated_at ON public.media_files;
CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Função para busca de arquivos
CREATE OR REPLACE FUNCTION search_media_files(
  search_query TEXT,
  user_uuid UUID DEFAULT NULL,
  bucket_filter TEXT DEFAULT NULL,
  file_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  size BIGINT,
  url TEXT,
  thumbnail_url TEXT,
  bucket TEXT,
  folder TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  metadata JSONB,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mf.id,
    mf.name,
    mf.type,
    mf.size,
    mf.url,
    mf.thumbnail_url,
    mf.bucket,
    mf.folder,
    mf.uploaded_at,
    mf.user_id,
    mf.metadata,
    ts_rank(to_tsvector('portuguese', mf.name), plainto_tsquery('portuguese', search_query)) as rank
  FROM public.media_files mf
  WHERE 
    (user_uuid IS NULL OR mf.user_id = user_uuid) AND
    (bucket_filter IS NULL OR mf.bucket = bucket_filter) AND
    to_tsvector('portuguese', mf.name) @@ plainto_tsquery('portuguese', search_query)
  ORDER BY rank DESC, mf.uploaded_at DESC
  LIMIT file_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Função para estatísticas de storage do usuário
CREATE OR REPLACE FUNCTION get_user_storage_stats(user_uuid UUID)
RETURNS TABLE (
  bucket TEXT,
  file_count BIGINT,
  total_size BIGINT,
  avg_size NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mf.bucket,
    COUNT(*)::BIGINT as file_count,
    SUM(mf.size)::BIGINT as total_size,
    AVG(mf.size)::NUMERIC as avg_size
  FROM public.media_files mf
  WHERE mf.user_id = user_uuid
  GROUP BY mf.bucket
  ORDER BY total_size DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para limpeza de arquivos órfãos
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete files older than 30 days with no references
  DELETE FROM public.media_files
  WHERE uploaded_at < NOW() - INTERVAL '30 days'
    AND id NOT IN (
      -- Add references from other tables here as needed
      SELECT DISTINCT media_file_id 
      FROM public.quiz_questions 
      WHERE media_file_id IS NOT NULL
    );
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Criar tabela de configurações de storage por usuário
CREATE TABLE IF NOT EXISTS public.user_storage_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  max_storage_mb INTEGER DEFAULT 1000,
  auto_compress BOOLEAN DEFAULT true,
  compression_quality NUMERIC DEFAULT 0.8,
  max_image_width INTEGER DEFAULT 1920,
  max_image_height INTEGER DEFAULT 1080,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para user_storage_settings
ALTER TABLE public.user_storage_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own storage settings" ON public.user_storage_settings;
CREATE POLICY "Users can view own storage settings"
  ON public.user_storage_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own storage settings" ON public.user_storage_settings;
CREATE POLICY "Users can update own storage settings"
  ON public.user_storage_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at em user_storage_settings
DROP TRIGGER IF EXISTS update_user_storage_settings_updated_at ON public.user_storage_settings;
CREATE TRIGGER update_user_storage_settings_updated_at
  BEFORE UPDATE ON public.user_storage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 14. View para estatísticas completas de usuário
CREATE OR REPLACE VIEW user_media_stats AS
SELECT 
  u.id as user_id,
  COALESCE(stats.total_files, 0) as total_files,
  COALESCE(stats.total_size_mb, 0) as total_size_mb,
  COALESCE(uss.max_storage_mb, 1000) as max_storage_mb,
  ROUND((COALESCE(stats.total_size_mb, 0) / COALESCE(uss.max_storage_mb, 1000) * 100)::NUMERIC, 2) as storage_usage_percent
FROM auth.users u
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_files,
    ROUND((SUM(size) / 1024.0 / 1024.0)::NUMERIC, 2) as total_size_mb
  FROM public.media_files
  GROUP BY user_id
) stats ON u.id = stats.user_id
LEFT JOIN public.user_storage_settings uss ON u.id = uss.user_id;

COMMENT ON VIEW user_media_stats IS 'Estatísticas de uso de storage por usuário';

-- Conceder permissões
GRANT SELECT ON user_media_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_media_files TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_storage_stats TO authenticated;