import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { DragDropZone } from './DragDropZone';
import { ProgressBar } from './ProgressBar';
import { FilePreview } from './FilePreview';
import { useFileUpload } from '../../hooks/useFileUpload';
import { MediaFile, STORAGE_BUCKETS } from '../../types/upload';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface FileUploaderProps {
  bucket: keyof typeof STORAGE_BUCKETS;
  folder?: string;
  multiple?: boolean;
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  accept?: string;
  maxSize?: number;
  compress?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function FileUploader({
  bucket,
  folder = 'general',
  multiple = true,
  onUploadComplete,
  onUploadError,
  className,
  accept,
  maxSize,
  compress = true,
  quality = 0.8,
  maxWidth = 1920,
  maxHeight = 1080
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const bucketConfig = STORAGE_BUCKETS[bucket];
  const finalAccept = accept || bucketConfig.allowedTypes.join(',');
  const finalMaxSize = maxSize || bucketConfig.maxSize;

  const {
    uploadFiles,
    uploading,
    progress,
    uploadedFiles,
    clearProgress,
    clearUploadedFiles
  } = useFileUpload({
    bucket,
    folder,
    allowedTypes: bucketConfig.allowedTypes,
    maxSize: finalMaxSize,
    compress,
    quality,
    maxWidth,
    maxHeight,
    onUploadComplete,
    onUploadError
  });

  const handleFilesSelected = (files: File[]) => {
    if (!multiple && files.length > 1) {
      files = [files[0]];
    }
    setSelectedFiles(files);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    await uploadFiles(selectedFiles);
    setSelectedFiles([]);
    setShowPreview(false);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setShowPreview(false);
    clearProgress();
    clearUploadedFiles();
  };

  const totalProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
    : 0;

  const completedUploads = progress.filter(p => p.status === 'completed').length;
  const failedUploads = progress.filter(p => p.status === 'error').length;

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Upload de Arquivos</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {bucketConfig.description}
            </p>
          </div>
          {(selectedFiles.length > 0 || uploadedFiles.length > 0) && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Limpar Tudo
            </Button>
          )}
        </div>

        {/* Upload Zone */}
        {!showPreview && (
          <DragDropZone
            onFilesSelected={handleFilesSelected}
            accept={finalAccept}
            multiple={multiple}
            maxSize={finalMaxSize}
            disabled={uploading}
          />
        )}

        {/* File Preview */}
        {showPreview && selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Arquivos Selecionados ({selectedFiles.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Adicionar Mais
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedFiles.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => handleRemoveFile(index)}
                  showRemove={!uploading}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar {selectedFiles.length} Arquivo{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
              {!uploading && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setShowPreview(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && progress.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Progresso do Upload</h4>
              <span className="text-sm text-gray-600">
                {totalProgress}% • {completedUploads}/{progress.length} concluídos
              </span>
            </div>

            <ProgressBar
              progress={totalProgress}
              className="h-2"
            />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {progress.map((p, index) => (
                <div
                  key={`${p.fileName}-${index}`}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {p.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {p.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {p.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.fileName}</p>
                    {p.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">{p.error}</p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {p.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Results */}
        {!uploading && uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-green-700 dark:text-green-400">
                Upload Concluído com Sucesso
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('image/') && file.url && (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Errors */}
        {!uploading && failedUploads > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium text-red-700 dark:text-red-400">
                Alguns arquivos falharam
              </h4>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">
              {failedUploads} de {progress.length} arquivos não puderam ser enviados. 
              Verifique os erros acima e tente novamente.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}