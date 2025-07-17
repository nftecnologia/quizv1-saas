import { useState } from 'react';
import { FileManager } from '../components/upload/FileManager';
import { MediaFile } from '../types/upload';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { Upload, Image, Video, FileText, Settings, BarChart3 } from 'lucide-react';

export function MediaPage() {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [mode, setMode] = useState<'full' | 'selector'>('full');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você precisa estar logado para acessar o gerenciador de mídia.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciador de Mídia</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas imagens, vídeos e documentos com upload otimizado e organização inteligente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={mode === 'full' ? 'default' : 'outline'}
              onClick={() => setMode('full')}
            >
              Modo Completo
            </Button>
            <Button
              variant={mode === 'selector' ? 'default' : 'outline'}
              onClick={() => setMode('selector')}
            >
              Modo Seletor
            </Button>
          </div>
        </div>

        {/* Demo Selector Results */}
        {mode === 'selector' && selectedFiles.length > 0 && (
          <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <h3 className="font-semibold mb-4 text-green-800 dark:text-green-200">
              Arquivos Selecionados para Demonstração
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
                >
                  {file.type.startsWith('image/') && (
                    <Image className="w-5 h-5 text-blue-500" />
                  )}
                  {file.type.startsWith('video/') && (
                    <Video className="w-5 h-5 text-purple-500" />
                  )}
                  {file.type.startsWith('application/') && (
                    <FileText className="w-5 h-5 text-green-500" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                  
                  <Badge variant="secondary">
                    {file.type.startsWith('image/') && 'IMG'}
                    {file.type.startsWith('video/') && 'VID'}
                    {file.type.startsWith('application/') && 'DOC'}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  // Simulate using files in editor
                  alert(`${selectedFiles.length} arquivos seriam integrados ao editor visual!`);
                }}
              >
                Usar no Editor
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFiles([])}
              >
                Limpar Seleção
              </Button>
            </div>
          </Card>
        )}

        {/* Features Overview */}
        {mode === 'full' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-2">Upload Inteligente</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag-and-drop com compressão automática e preview em tempo real.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Image className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">Otimização de Imagens</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redimensionamento automático e compressão inteligente.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Vídeos com Preview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Thumbnails automáticos e suporte a múltiplos formatos.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold mb-2">Analytics de Uso</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitoramento de storage e estatísticas de uploads.
              </p>
            </Card>
          </div>
        )}

        {/* Main File Manager */}
        <FileManager
          mode={mode}
          onSelect={setSelectedFiles}
          selectedFiles={selectedFiles}
          multiple={true}
          defaultTab="gallery"
        />

        {/* Integration Examples */}
        {mode === 'full' && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Integrações Disponíveis</h3>
            
            <Tabs defaultValue="editor" className="w-full">
              <TabsList>
                <TabsTrigger value="editor">Editor Visual</TabsTrigger>
                <TabsTrigger value="profile">Perfil do Usuário</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-semibold mb-2">🎨 Editor Visual de Quizzes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Arraste imagens e vídeos diretamente para os elementos do quiz. 
                    Suporte completo a drag-and-drop com preview instantâneo.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Drag & Drop</Badge>
                    <Badge variant="secondary">Preview Instantâneo</Badge>
                    <Badge variant="secondary">Múltiplos Formatos</Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-semibold mb-2">👤 Perfil do Usuário</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload de avatar com crop automático e redimensionamento. 
                    Suporte a formatos otimizados para web.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Crop Automático</Badge>
                    <Badge variant="secondary">Compressão Inteligente</Badge>
                    <Badge variant="secondary">Formato WebP</Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <h4 className="font-semibold mb-2">📋 Templates de Quiz</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Biblioteca de mídia para templates com categorização automática. 
                    Busca inteligente e organização por tags.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Busca IA</Badge>
                    <Badge variant="secondary">Tags Automáticas</Badge>
                    <Badge variant="secondary">Categorização</Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Analytics de Upload</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Tracking automático de uploads, performance de compressão e 
                    estatísticas de uso de storage.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Métricas em Tempo Real</Badge>
                    <Badge variant="secondary">Relatórios de Uso</Badge>
                    <Badge variant="secondary">Otimizações</Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        {/* Technical Specs */}
        {mode === 'full' && (
          <Card className="p-6 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-xl font-semibold mb-4">Especificações Técnicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                  🖼️ Imagens
                </h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Formatos: JPEG, PNG, WebP, GIF</li>
                  <li>• Tamanho máximo: 10MB</li>
                  <li>• Resolução máxima: 1920x1080</li>
                  <li>• Compressão automática (JPEG 80%)</li>
                  <li>• Redimensionamento inteligente</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">
                  🎬 Vídeos
                </h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Formatos: MP4, WebM, MOV</li>
                  <li>• Tamanho máximo: 50MB</li>
                  <li>• Thumbnail automático</li>
                  <li>• Preview no segundo 1</li>
                  <li>• Múltiplas resoluções</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                  📄 Documentos
                </h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Formatos: PDF, DOC, DOCX</li>
                  <li>• Tamanho máximo: 25MB</li>
                  <li>• Preview de primeira página</li>
                  <li>• Busca por conteúdo</li>
                  <li>• Metadados automáticos</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}