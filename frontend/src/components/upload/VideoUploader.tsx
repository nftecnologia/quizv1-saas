import { useState } from 'react';
import { Video, Play, Upload, Film } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { MediaFile } from '../../types/upload';
import { cn } from '../../lib/utils';

interface VideoUploaderProps {
  folder?: string;
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  multiple?: boolean;
  maxVideos?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
}

export function VideoUploader({
  folder = 'videos',
  onUploadComplete,
  onUploadError,
  className,
  multiple = true,
  maxVideos = 5,
  maxFileSize = 50, // 50MB default
  acceptedFormats = ['mp4', 'webm', 'mov']
}: VideoUploaderProps) {
  const [selectedVideos, setSelectedVideos] = useState<MediaFile[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customMaxSize, setCustomMaxSize] = useState(maxFileSize);

  const handleUploadComplete = (files: MediaFile[]) => {
    // Filter only video files
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    setSelectedVideos(prev => [...prev, ...videoFiles]);
    onUploadComplete?.(videoFiles);
  };

  const handleRemoveVideo = (videoId: string) => {
    setSelectedVideos(prev => prev.filter(video => video.id !== videoId));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const remainingSlots = maxVideos - selectedVideos.length;
  const acceptString = acceptedFormats.map(format => `video/${format}`).join(',');

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold">Upload de Vídeos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Envie vídeos com preview automático para seus quizzes
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Film className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxSize">Tamanho Máximo (MB)</Label>
                  <Input
                    id="maxSize"
                    type="number"
                    value={customMaxSize}
                    onChange={(e) => setCustomMaxSize(Number(e.target.value))}
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: até 50MB para melhor performance
                  </p>
                </div>
                <div>
                  <Label>Formatos Aceitos</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {acceptedFormats.map((format) => (
                      <span
                        key={format}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded uppercase"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Upload Area */}
          {remainingSlots > 0 && (
            <FileUploader
              bucket="videos"
              folder={folder}
              multiple={multiple && remainingSlots > 1}
              accept={acceptString}
              maxSize={customMaxSize * 1024 * 1024}
              compress={false}
              onUploadComplete={handleUploadComplete}
              onUploadError={onUploadError}
              className="border-0 shadow-none p-0"
            />
          )}

          {/* Upload Limit Warning */}
          {remainingSlots === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Limite de {maxVideos} vídeos atingido. Remova alguns para adicionar mais.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Videos Gallery */}
      {selectedVideos.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Vídeos Selecionados ({selectedVideos.length}/{maxVideos})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideos([])}
              >
                Limpar Todos
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedVideos.map((video) => (
                <div
                  key={video.id}
                  className="group relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  <div className="relative aspect-video">
                    {/* Video Preview */}
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={`Preview of ${video.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>

                    {/* Controls Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        Ver Vídeo
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveVideo(video.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{video.name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(video.size)}</span>
                      {video.metadata?.duration && (
                        <span>{formatDuration(video.metadata.duration)}</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        <Video className="w-3 h-3 mr-1" />
                        Vídeo
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Video Specs */}
      <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
          Especificações recomendadas:
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700 dark:text-purple-300">
          <div>
            <h6 className="font-medium mb-1">Formato:</h6>
            <ul className="space-y-1">
              <li>• MP4 (H.264/H.265) - Melhor compatibilidade</li>
              <li>• WebM (VP9) - Otimizado para web</li>
              <li>• MOV - Alta qualidade</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Qualidade:</h6>
            <ul className="space-y-1">
              <li>• Resolução: 720p ou 1080p</li>
              <li>• Taxa de bits: 1-5 Mbps</li>
              <li>• Duração: até 5 minutos</li>
              <li>• Audio: AAC, 128kbps</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}