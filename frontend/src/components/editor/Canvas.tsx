import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { QuizElement, Quiz } from '../../types/editor';
import { DraggableElement } from './DraggableElement';
import { cn } from '../../lib/utils';
import { Plus, Smartphone, Tablet, Monitor } from 'lucide-react';

interface CanvasProps {
  elements: QuizElement[];
  selectedElement: string | null;
  onElementSelect: (id: string) => void;
  onElementUpdate: (id: string, updates: Partial<QuizElement>) => void;
  onElementDelete: (id: string) => void;
  onElementDuplicate: (id: string) => void;
  isDragging: boolean;
  quizSettings: Quiz['settings'];
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const viewportSizes: Record<ViewportSize, { width: number; height: number; label: string; icon: React.ReactNode }> = {
  mobile: { width: 375, height: 667, label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: <Tablet className="w-4 h-4" /> },
  desktop: { width: 1200, height: 800, label: 'Desktop', icon: <Monitor className="w-4 h-4" /> },
};

const EmptyCanvasMessage: React.FC<{ isDragging: boolean }> = ({ isDragging }) => (
  <div className={cn(
    'flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg transition-all duration-300',
    isDragging 
      ? 'border-blue-400 bg-blue-50' 
      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
  )}>
    <div className="text-center">
      <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isDragging ? 'Solte o elemento aqui' : 'Comece criando seu quiz'}
      </h3>
      <p className="text-gray-500 max-w-md">
        {isDragging 
          ? 'Solte o elemento para adicioná-lo ao seu quiz'
          : 'Arraste elementos da biblioteca na lateral ou clique no botão "+" para começar'
        }
      </p>
    </div>
  </div>
);

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElement,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  isDragging,
  quizSettings,
}) => {
  const [viewport, setViewport] = React.useState<ViewportSize>('desktop');
  const [zoom, setZoom] = React.useState(100);
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: {
      type: 'canvas',
      accepts: ['element'],
    },
  });

  const canvasStyle = React.useMemo(() => {
    const size = viewportSizes[viewport];
    const scale = zoom / 100;
    
    return {
      width: size.width,
      minHeight: size.height,
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
    };
  }, [viewport, zoom]);

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(25, Math.min(200, newZoom)));
  };

  const backgroundStyle = React.useMemo(() => {
    const { theme, primaryColor, secondaryColor } = quizSettings;
    
    if (theme === 'dark') {
      return {
        backgroundColor: '#1f2937',
        color: '#f9fafb',
      };
    }
    
    if (theme === 'custom') {
      return {
        backgroundColor: secondaryColor || '#f9fafb',
        color: primaryColor || '#111827',
      };
    }
    
    return {
      backgroundColor: '#ffffff',
      color: '#111827',
    };
  }, [quizSettings]);

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Canvas Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Viewport Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {Object.entries(viewportSizes).map(([key, size]) => (
                <button
                  key={key}
                  onClick={() => setViewport(key as ViewportSize)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    viewport === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                  title={`${size.label} (${size.width}x${size.height})`}
                >
                  {size.icon}
                  <span className="hidden sm:inline">{size.label}</span>
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoomChange(zoom - 25)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                disabled={zoom <= 25}
              >
                <span className="text-sm">-</span>
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => handleZoomChange(zoom + 25)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                disabled={zoom >= 200}
              >
                <span className="text-sm">+</span>
              </button>
            </div>
          </div>

          {/* Canvas Info */}
          <div className="text-sm text-gray-500">
            {elements.length} elementos
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-center">
          <div
            ref={setNodeRef}
            style={canvasStyle}
            className={cn(
              'bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200',
              isOver && 'ring-2 ring-blue-500 ring-opacity-50',
              isDragging && 'ring-2 ring-blue-400 ring-opacity-30'
            )}
          >
            <div 
              className="min-h-full p-6"
              style={backgroundStyle}
            >
              {elements.length === 0 ? (
                <EmptyCanvasMessage isDragging={isDragging} />
              ) : (
                <SortableContext
                  items={elements.map(el => el.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {elements.map((element) => (
                      <DraggableElement
                        key={element.id}
                        element={element}
                        isSelected={selectedElement === element.id}
                        onSelect={onElementSelect}
                        onUpdate={onElementUpdate}
                        onDelete={onElementDelete}
                        onDuplicate={onElementDuplicate}
                        isDragging={isDragging}
                        quizSettings={quizSettings}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Visualização: {viewportSizes[viewport].label} ({viewportSizes[viewport].width}x{viewportSizes[viewport].height})
          </div>
          <div>
            Zoom: {zoom}%
          </div>
        </div>
      </div>
    </div>
  );
};