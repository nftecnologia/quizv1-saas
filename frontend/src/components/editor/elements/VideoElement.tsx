import React, { useState, useRef } from 'react';
import { VideoElement as VideoElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { Play, Video, Settings, Upload, FolderOpen, Link } from 'lucide-react';
import { MediaGallery } from '../../upload/MediaGallery';
import { MediaFile } from '../../../types/upload';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface VideoElementProps {
  element: VideoElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<VideoElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const VideoElement: React.FC<VideoElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const [uploadMode, setUploadMode] = useState<'upload' | 'gallery' | 'url'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadSingleFile, uploading, progress } = useFileUpload({
    bucket: 'videos',
    folder: 'quiz-elements',
    onUploadComplete: (files) => {
      if (files.length > 0) {
        onUpdate({ src: files[0].url, platform: 'upload' });
      }
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
      alert('Erro no upload: ' + error);
    }
  });

  const handleFileSelect = async (file: File) => {
    await uploadSingleFile(file);
  };

  const handleGallerySelect = (files: MediaFile[]) => {
    if (files.length > 0) {
      onUpdate({ src: files[0].url, platform: 'upload' });
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Configurações do Vídeo</h3>
            <Button variant="ghost" size="sm" onClick={onEndEdit}>
              Fechar
            </Button>
          </div>

          {/* Upload Mode Selector */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={uploadMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMode('url')}
            >
              <Link className="w-4 h-4 mr-1" />
              URL/Embed
            </Button>
            <Button
              variant={uploadMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMode('upload')}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            <Button
              variant={uploadMode === 'gallery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMode('gallery')}
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              Galeria
            </Button>
          </div>

          {/* Upload Mode Content */}
          {uploadMode === 'url' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">URL do Vídeo</label>
                <input
                  type="url"
                  value={element.src}
                  onChange={(e) => onUpdate({ src: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Plataforma</label>
                <select
                  value={element.platform}
                  onChange={(e) => onUpdate({ platform: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="upload">Upload</option>
                </select>
              </div>
            </div>
          )}

          {uploadMode === 'upload' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Fazer Upload de Vídeo
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </div>
              {uploading && progress.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Upload: {progress[0].progress}%
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Formatos suportados: MP4, WebM, MOV (máx. 50MB)
              </p>
            </div>
          )}

          {uploadMode === 'gallery' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Escolher da Galeria
              </label>
              <MediaGallery
                bucket="videos"
                selectable={true}
                multiple={false}
                onSelect={handleGallerySelect}
                compact={true}
              />
            </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={element.controls}
                onChange={(e) => onUpdate({ controls: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Controles</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={element.autoplay}
                onChange={(e) => onUpdate({ autoplay: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Auto-play</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={element.loop}
                onChange={(e) => onUpdate({ loop: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Loop</span>
            </label>
          </div>
        </Card>
      )}

      <div className="relative">
        {element.src ? (
          element.platform === 'upload' ? (
            <div className="relative">
              <video
                src={element.src}
                controls={element.controls}
                autoPlay={element.autoplay}
                loop={element.loop}
                muted={element.autoplay} // Required for autoplay in most browsers
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '400px' }}
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
              {!element.controls && (
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer"
                     onClick={(e) => {
                       const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
                       if (video.paused) {
                         video.play();
                       } else {
                         video.pause();
                       }
                     }}>
                  <div className="bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-70 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-0 pb-[56.25%]">
              <iframe
                src={getEmbedUrl(element.src)}
                className="absolute inset-0 w-full h-full rounded-lg"
                allowFullScreen
                title="Video"
              />
            </div>
          )
        ) : (
          <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {isEditing ? 'Adicione um vídeo' : 'Vídeo não encontrado'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};