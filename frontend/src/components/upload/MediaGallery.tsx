import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Download, Trash2, Eye, Image, Video, FileText } from 'lucide-react';
import { useMediaGallery } from '../../hooks/useFileUpload';
import { MediaFile, STORAGE_BUCKETS } from '../../types/upload';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface MediaGalleryProps {
  bucket?: keyof typeof STORAGE_BUCKETS;
  folder?: string;
  selectable?: boolean;
  multiple?: boolean;
  onSelect?: (files: MediaFile[]) => void;
  selectedFiles?: MediaFile[];
  className?: string;
  compact?: boolean;
}

export function MediaGallery({
  bucket,
  folder,
  selectable = false,
  multiple = false,
  onSelect,
  selectedFiles = [],
  className,
  compact = false
}: MediaGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedFiles.map(f => f.id))
  );

  const { files, loading, error, loadFiles, deleteFile, searchFiles, refresh } = useMediaGallery(bucket, folder);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    setSelectedIds(new Set(selectedFiles.map(f => f.id)));
  }, [selectedFiles]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchFiles(query);
    } else {
      await loadFiles();
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    if (!selectable) return;

    const newSelectedIds = new Set(selectedIds);
    const newSelectedFiles = [...selectedFiles];

    if (selectedIds.has(file.id)) {
      newSelectedIds.delete(file.id);
      const index = newSelectedFiles.findIndex(f => f.id === file.id);
      if (index > -1) newSelectedFiles.splice(index, 1);
    } else {
      if (!multiple) {
        newSelectedIds.clear();
        newSelectedFiles.length = 0;
      }
      newSelectedIds.add(file.id);
      newSelectedFiles.push(file);
    }

    setSelectedIds(newSelectedIds);
    onSelect?.(newSelectedFiles);
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Tem certeza que deseja deletar este arquivo?')) {
      await deleteFile(fileId);
    }
  };

  const filteredFiles = files.filter(file => {
    if (filterType === 'all') return true;
    if (filterType === 'images') return file.type.startsWith('image/');
    if (filterType === 'videos') return file.type.startsWith('video/');
    if (filterType === 'documents') return file.type.startsWith('application/');
    return true;
  });

  const getFileIcon = (file: MediaFile) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
  };

  if (loading && files.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando arquivos...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Erro ao carregar arquivos: {error}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        {!compact && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Galeria de Mídia</h3>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Pesquisar arquivos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'images', 'videos', 'documents'].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type as any)}
              >
                {type === 'all' && 'Todos'}
                {type === 'images' && 'Imagens'}
                {type === 'videos' && 'Vídeos'}
                {type === 'documents' && 'Docs'}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Files Info */}
        {selectable && selectedIds.size > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {selectedIds.size} arquivo{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Files Grid/List */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo ainda'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={cn(
            'grid gap-4',
            compact ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          )}>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer',
                  selectable && selectedIds.has(file.id) && 'ring-2 ring-blue-500 border-blue-500'
                )}
                onClick={() => handleFileSelect(file)}
              >
                {/* Preview */}
                <div className={cn('aspect-square bg-gray-50 dark:bg-gray-900 relative', compact && 'aspect-video')}>
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type.startsWith('video/') && file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={`Preview of ${file.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}

                  {/* Actions Overlay */}
                  {!selectable && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = file.url;
                          a.download = file.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Selection Indicator */}
                  {selectable && selectedIds.has(file.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                {!compact && (
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer',
                  selectable && selectedIds.has(file.id) && 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
                )}
                onClick={() => handleFileSelect(file)}
              >
                {/* Preview */}
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                {!selectable && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}