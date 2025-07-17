import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileUploader } from './FileUploader';
import { ImageUploader } from './ImageUploader';
import { VideoUploader } from './VideoUploader';
import { MediaGallery } from './MediaGallery';
import { Upload, Image, Video, FileText, Settings, FolderOpen } from 'lucide-react';
import { MediaFile, STORAGE_BUCKETS } from '../../types/upload';
import { cn } from '../../lib/utils';

interface FileManagerProps {
  mode?: 'full' | 'selector';
  onSelect?: (files: MediaFile[]) => void;
  selectedFiles?: MediaFile[];
  multiple?: boolean;
  allowedBuckets?: (keyof typeof STORAGE_BUCKETS)[];
  defaultTab?: string;
  className?: string;
}

export function FileManager({
  mode = 'full',
  onSelect,
  selectedFiles = [],
  multiple = false,
  allowedBuckets = ['images', 'videos', 'documents'],
  defaultTab = 'gallery',
  className
}: FileManagerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeBucket, setActiveBucket] = useState<keyof typeof STORAGE_BUCKETS>(allowedBuckets[0]);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    documents: 0
  });

  const handleUploadComplete = (files: MediaFile[]) => {
    // Update stats
    setUploadStats(prev => ({
      total: prev.total + files.length,
      images: prev.images + files.filter(f => f.type.startsWith('image/')).length,
      videos: prev.videos + files.filter(f => f.type.startsWith('video/')).length,
      documents: prev.documents + files.filter(f => f.type.startsWith('application/')).length
    }));

    // Auto-select uploaded files in selector mode
    if (mode === 'selector' && onSelect) {
      const newSelection = multiple ? [...selectedFiles, ...files] : files;
      onSelect(newSelection);
    }

    // Switch to gallery tab to see uploaded files
    setActiveTab('gallery');
  };

  const bucketStats = Object.entries(STORAGE_BUCKETS)
    .filter(([key]) => allowedBuckets.includes(key as keyof typeof STORAGE_BUCKETS))
    .map(([key, config]) => ({
      key: key as keyof typeof STORAGE_BUCKETS,
      config,
      count: key === 'images' ? uploadStats.images :
             key === 'videos' ? uploadStats.videos :
             key === 'documents' ? uploadStats.documents : 0
    }));

  return (
    <div className={cn('w-full', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Vídeos
            </TabsTrigger>
          </TabsList>

          {/* Storage Stats */}
          {mode === 'full' && (
            <div className="flex flex-wrap gap-2">
              {bucketStats.map(({ key, config, count }) => (
                <Badge
                  key={key}
                  variant={activeBucket === key ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setActiveBucket(key)}
                >
                  {config.description}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          {mode === 'selector' && selectedFiles.length > 0 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
                </p>
                <Button
                  size="sm"
                  onClick={() => onSelect?.([])}
                  variant="outline"
                >
                  Limpar Seleção
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bucket Filter */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Tipos de Arquivo</h3>
                <div className="space-y-2">
                  {bucketStats.map(({ key, config, count }) => (
                    <button
                      key={key}
                      onClick={() => setActiveBucket(key)}
                      className={cn(
                        'w-full p-3 text-left rounded-lg border transition-colors',
                        activeBucket === key
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {key === 'images' && <Image className="w-4 h-4 text-blue-500" />}
                          {key === 'videos' && <Video className="w-4 h-4 text-purple-500" />}
                          {key === 'documents' && <FileText className="w-4 h-4 text-green-500" />}
                          <span className="font-medium">{config.description}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Máx: {Math.round(config.maxSize / (1024 * 1024))}MB
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Gallery */}
            <div className="lg:col-span-2">
              <MediaGallery
                bucket={activeBucket}
                selectable={mode === 'selector'}
                multiple={multiple}
                onSelect={onSelect}
                selectedFiles={selectedFiles}
                compact={mode === 'selector'}
              />
            </div>
          </div>
        </TabsContent>

        {/* Generic Upload Tab */}
        <TabsContent value="upload">
          <FileUploader
            bucket={activeBucket}
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>

        {/* Image Upload Tab */}
        <TabsContent value="images">
          <ImageUploader
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>

        {/* Video Upload Tab */}
        <TabsContent value="videos">
          <VideoUploader
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Selector Actions */}
      {mode === 'selector' && selectedFiles.length > 0 && (
        <Card className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                Arquivos Selecionados
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} pronto{selectedFiles.length > 1 ? 's' : ''} para uso
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onSelect?.([])}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Files are already selected in parent component
                  // This would typically close a modal or navigate away
                }}
              >
                Usar Selecionados
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}