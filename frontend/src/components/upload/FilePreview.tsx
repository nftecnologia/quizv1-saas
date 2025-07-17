import { useState, useEffect } from 'react';
import { X, FileText, Film, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

export function FilePreview({
  file,
  onRemove,
  showRemove = true,
  className
}: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    if (file.type.startsWith('video/')) {
      return <Film className="w-8 h-8 text-purple-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const handleImageError = () => {
    setError('Erro ao carregar preview');
    setPreview(null);
  };

  return (
    <div className={cn(
      'relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      className
    )}>
      {/* Remove Button */}
      {showRemove && onRemove && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 z-10 h-6 w-6 p-0"
          onClick={onRemove}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      {/* Preview Area */}
      <div className="aspect-video bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
        {preview && file.type.startsWith('image/') && !error ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : preview && file.type.startsWith('video/') && !error ? (
          <video
            src={preview}
            className="w-full h-full object-cover"
            controls={false}
            muted
            onError={handleImageError}
          >
            <source src={preview} type={file.type} />
          </video>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            {getFileIcon()}
            {error && (
              <span className="text-xs text-red-500 mt-2">{error}</span>
            )}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                {file.type.split('/')[1] || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* File Type Badge */}
        <div className="mt-2">
          <span className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            file.type.startsWith('image/') && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            file.type.startsWith('video/') && 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            file.type.startsWith('application/') && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('application/') && 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          )}>
            {file.type.startsWith('image/') && 'Imagem'}
            {file.type.startsWith('video/') && 'Vídeo'}
            {file.type.startsWith('application/') && 'Documento'}
            {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('application/') && 'Arquivo'}
          </span>
        </div>
      </div>
    </div>
  );
}