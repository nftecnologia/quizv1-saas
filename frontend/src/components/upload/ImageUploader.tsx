import { useState } from 'react';
import { Image, Crop, Palette, RotateCw } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { MediaFile } from '../../types/upload';
import { cn } from '../../lib/utils';

interface ImageUploaderProps {
  folder?: string;
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  multiple?: boolean;
  maxImages?: number;
  enableCrop?: boolean;
  enableFilters?: boolean;
  aspectRatio?: 'free' | '1:1' | '16:9' | '4:3' | '3:2';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function ImageUploader({
  folder = 'images',
  onUploadComplete,
  onUploadError,
  className,
  multiple = true,
  maxImages = 10,
  enableCrop = false,
  enableFilters = false,
  aspectRatio = 'free',
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
}: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<MediaFile[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customWidth, setCustomWidth] = useState(maxWidth);
  const [customHeight, setCustomHeight] = useState(maxHeight);
  const [customQuality, setCustomQuality] = useState(quality);

  const handleUploadComplete = (files: MediaFile[]) => {
    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...imageFiles]);
    onUploadComplete?.(imageFiles);
  };

  const handleRemoveImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '3:2': return 'aspect-[3/2]';
      default: return '';
    }
  };

  const remainingSlots = maxImages - selectedImages.length;

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Upload de Imagens</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Envie imagens otimizadas para seus quizzes
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Palette className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="width">Largura Máxima (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    min={100}
                    max={4000}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura Máxima (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    min={100}
                    max={4000}
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Qualidade (0.1-1.0)</Label>
                  <Input
                    id="quality"
                    type="number"
                    step="0.1"
                    value={customQuality}
                    onChange={(e) => setCustomQuality(Number(e.target.value))}
                    min={0.1}
                    max={1.0}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Upload Area */}
          {remainingSlots > 0 && (
            <FileUploader
              bucket="images"
              folder={folder}
              multiple={multiple && remainingSlots > 1}
              accept="image/*"
              maxSize={10 * 1024 * 1024} // 10MB
              compress={true}
              quality={customQuality}
              maxWidth={customWidth}
              maxHeight={customHeight}
              onUploadComplete={handleUploadComplete}
              onUploadError={onUploadError}
              className="border-0 shadow-none p-0"
            />
          )}

          {/* Upload Limit Warning */}
          {remainingSlots === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Limite de {maxImages} imagens atingido. Remova algumas para adicionar mais.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Images Gallery */}
      {selectedImages.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Imagens Selecionadas ({selectedImages.length}/{maxImages})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImages([])}
              >
                Limpar Todas
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  <div className={cn('relative', getAspectRatioClass() || 'aspect-square')}>
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {enableCrop && (
                        <Button size="sm" variant="secondary">
                          <Crop className="w-4 h-4" />
                        </Button>
                      )}
                      {enableFilters && (
                        <Button size="sm" variant="secondary">
                          <Palette className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveImage(image.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{image.name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{Math.round(image.size / 1024)} KB</span>
                      {image.metadata && (
                        <span>{image.metadata.width}×{image.metadata.height}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Dicas para melhores resultados:
        </h5>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use imagens em alta resolução (mínimo 800px de largura)</li>
          <li>• Formatos recomendados: JPEG, PNG, WEBP</li>
          <li>• Evite imagens muito pesadas (&gt; 5MB)</li>
          <li>• Use proporções adequadas para o tipo de quiz</li>
        </ul>
      </Card>
    </div>
  );
}