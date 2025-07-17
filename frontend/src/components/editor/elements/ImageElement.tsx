import React, { useState, useRef } from 'react';
import { ImageElement as ImageElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { Image, Upload, Link, Settings, FolderOpen } from 'lucide-react';
import { MediaGallery } from '../../upload/MediaGallery';
import { MediaFile } from '../../../types/upload';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface ImageElementProps {
  element: ImageElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<ImageElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const ImageElement: React.FC<ImageElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'gallery' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadSingleFile, uploading, progress } = useFileUpload({
    bucket: 'images',
    folder: 'quiz-elements',
    onUploadComplete: (files) => {
      if (files.length > 0) {
        onUpdate({ src: files[0].url });
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
      onUpdate({ src: files[0].url });
      setShowGallery(false);
    }
  };

  const handleUrlChange = (src: string) => {
    onUpdate({ src });
  };

  const handleAltChange = (alt: string) => {
    onUpdate({ alt });
  };

  const handleCaptionChange = (caption: string) => {
    onUpdate({ caption });
  };

  const handleLinkChange = (link: string) => {
    onUpdate({ link });
  };

  const handleFitChange = (fit: 'cover' | 'contain' | 'fill' | 'scale-down') => {
    onUpdate({ fit });
  };

  const fitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    'scale-down': 'object-scale-down',
  };

  return (
    <div className="space-y-4">
      {/* Editing Controls */}
      {isEditing && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Configurações da Imagem</h3>
            <Button variant="ghost" size="sm" onClick={onEndEdit}>
              Fechar
            </Button>
          </div>

          {/* Upload Mode Selector */}
          <div className="flex gap-2 mb-4">
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
            <Button
              variant={uploadMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMode('url')}
            >
              <Link className="w-4 h-4 mr-1" />
              URL
            </Button>
          </div>

          {/* Upload Mode Content */}
          {uploadMode === 'upload' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Fazer Upload de Imagem
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
                  accept="image/*"
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
            </div>
          )}

          {uploadMode === 'gallery' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Escolher da Galeria
              </label>
              <MediaGallery
                bucket="images"
                selectable={true}
                multiple={false}
                onSelect={handleGallerySelect}
                compact={true}
              />
            </div>
          )}

          {uploadMode === 'url' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                value={element.src}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">

            {/* Fit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Ajuste
              </label>
              <select
                value={element.fit}
                onChange={(e) => handleFitChange(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="cover">Cobrir</option>
                <option value="contain">Conter</option>
                <option value="fill">Preencher</option>
                <option value="scale-down">Reduzir</option>
              </select>
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Texto Alternativo
              </label>
              <input
                type="text"
                value={element.alt}
                onChange={(e) => handleAltChange(e.target.value)}
                placeholder="Descreva a imagem..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>

            {/* Link */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Link (opcional)
              </label>
              <input
                type="url"
                value={element.link || ''}
                onChange={(e) => handleLinkChange(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Legenda (opcional)
            </label>
            <input
              type="text"
              value={element.caption || ''}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="Legenda da imagem..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
            />
          </div>
        </Card>
      )}

      {/* Image Display */}
      <div className="relative">
        {element.src ? (
          <div className="relative">
            {element.link ? (
              <a href={element.link} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={element.src}
                  alt={element.alt}
                  className={cn(
                    'w-full h-auto rounded-lg',
                    fitClasses[element.fit],
                    isUploading && 'opacity-50'
                  )}
                  style={{
                    maxHeight: '400px',
                  }}
                />
              </a>
            ) : (
              <img
                src={element.src}
                alt={element.alt}
                className={cn(
                  'w-full h-auto rounded-lg',
                  fitClasses[element.fit],
                  isUploading && 'opacity-50'
                )}
                style={{
                  maxHeight: '400px',
                }}
              />
            )}
            
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-sm">Carregando...</div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {isEditing ? 'Adicione uma imagem' : 'Imagem não encontrada'}
              </p>
            </div>
          </div>
        )}

        {/* Caption */}
        {element.caption && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600 italic">{element.caption}</p>
          </div>
        )}

        {/* Link Indicator */}
        {element.link && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1">
            <Link className="w-3 h-3 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
};