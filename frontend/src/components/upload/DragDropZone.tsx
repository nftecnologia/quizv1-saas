import { useCallback, useState } from 'react';
import { Upload, FileText, Image, Video, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DragDropProps } from '../../types/upload';

export function DragDropZone({
  onFilesSelected,
  accept = '*/*',
  multiple = true,
  maxSize,
  disabled = false,
  className,
  children
}: DragDropProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      // Check file size
      if (maxSize && file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB`);
        return;
      }

      // Check file type if accept is specified
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isValidType = acceptedTypes.some(acceptedType => {
          if (acceptedType.startsWith('.')) {
            return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
          }
          if (acceptedType.includes('/*')) {
            const baseType = acceptedType.split('/')[0];
            return file.type.startsWith(baseType);
          }
          return file.type === acceptedType;
        });

        if (!isValidType) {
          errors.push(`${file.name}: File type not allowed`);
          return;
        }
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setTimeout(() => setError(null), 5000);
    }

    return validFiles;
  }, [accept, maxSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [disabled, validateFiles, onFilesSelected]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
    
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [disabled, validateFiles, onFilesSelected]);

  const getFileTypeIcon = (acceptType: string) => {
    if (acceptType.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
    if (acceptType.includes('video')) return <Video className="w-8 h-8 text-purple-500" />;
    if (acceptType.includes('application')) return <FileText className="w-8 h-8 text-green-500" />;
    return <Upload className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-all duration-200',
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {children || (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {getFileTypeIcon(accept)}
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Clique para enviar</span> ou arraste e solte
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {accept === '*/*' ? 'Qualquer tipo de arquivo' : 
               accept.includes('image') ? 'Imagens (PNG, JPG, WEBP)' :
               accept.includes('video') ? 'Vídeos (MP4, WEBM, MOV)' :
               'Documentos permitidos'}
            </p>
            {maxSize && (
              <p className="text-xs text-gray-400 mt-1">
                Tamanho máximo: {formatFileSize(maxSize)}
              </p>
            )}
          </div>
        )}

        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-950/40 rounded-lg">
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              Solte os arquivos aqui
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <X className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
              {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}