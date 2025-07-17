import React, { useState } from 'react';
import { Quiz } from '../../types/editor';
import { ElementRenderer } from './elements/ElementRenderer';
import { cn } from '../../lib/utils';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Smartphone, 
  Tablet, 
  Monitor,
  Share2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface PreviewProps {
  quiz: Quiz;
  onExitPreview: () => void;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const viewportSizes: Record<ViewportSize, { width: number; height: number; label: string; icon: React.ReactNode }> = {
  mobile: { width: 375, height: 667, label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: <Tablet className="w-4 h-4" /> },
  desktop: { width: 1200, height: 800, label: 'Desktop', icon: <Monitor className="w-4 h-4" /> },
};

export const Preview: React.FC<PreviewProps> = ({ quiz, onExitPreview }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [showControls, setShowControls] = useState(true);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const handleNext = () => {
    if (currentIndex < quiz.elements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleResponse = (elementId: string, value: any) => {
    setResponses(prev => ({ ...prev, [elementId]: value }));
  };

  const getProgress = () => {
    return quiz.elements.length > 0 ? ((currentIndex + 1) / quiz.elements.length) * 100 : 0;
  };

  const canNavigateNext = () => {
    const currentElement = quiz.elements[currentIndex];
    if (!currentElement?.required) return true;
    
    const response = responses[currentElement.id];
    return response !== undefined && response !== null && response !== '';
  };

  const backgroundStyle = React.useMemo(() => {
    const { theme, primaryColor, secondaryColor } = quiz.settings;
    
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
  }, [quiz.settings]);

  const viewportStyle = React.useMemo(() => {
    const size = viewportSizes[viewport];
    return {
      width: size.width,
      height: size.height,
      maxWidth: '100%',
      maxHeight: '100%',
    };
  }, [viewport]);

  const currentElement = quiz.elements[currentIndex];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={onExitPreview}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{quiz.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {Object.entries(viewportSizes).map(([key, size]) => (
                <button
                  key={key}
                  onClick={() => setViewport(key as ViewportSize)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    viewport === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {size.icon}
                  <span className="hidden sm:inline">{size.label}</span>
                </button>
              ))}
            </div>

            {/* Controls Toggle */}
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              {showControls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Actions */}
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {quiz.settings.showProgressBar && (
          <div className="h-2 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex justify-center p-8 bg-gray-50">
          <div
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={viewportStyle}
          >
            <div className="h-full overflow-y-auto" style={backgroundStyle}>
              <div className="p-6">
                {currentElement ? (
                  <ElementRenderer
                    element={currentElement}
                    isEditing={false}
                    onUpdate={() => {}}
                    onEndEdit={() => {}}
                    quizSettings={quiz.settings}
                  />
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Quiz Finalizado!
                    </h3>
                    <p className="text-gray-600">
                      Obrigado por participar do nosso quiz.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {showControls && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0 || !quiz.settings.allowBackNavigation}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  currentIndex === 0 || !quiz.settings.allowBackNavigation
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentIndex + 1} de {quiz.elements.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNext}
                disabled={currentIndex === quiz.elements.length - 1 || !canNavigateNext()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  currentIndex === quiz.elements.length - 1 || !canNavigateNext()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {currentIndex === quiz.elements.length - 1 ? 'Finalizar' : 'Próximo'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};