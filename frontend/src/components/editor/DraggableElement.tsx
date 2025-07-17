import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuizElement, Quiz } from '../../types/editor';
import { ElementRenderer } from './elements/ElementRenderer';
import { cn } from '../../lib/utils';
import { 
  GripVertical, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface DraggableElementProps {
  element: QuizElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<QuizElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isDragging: boolean;
  quizSettings: Quiz['settings'];
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  isDragging: globalIsDragging,
  quizSettings,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: elementIsDragging,
  } = useSortable({
    id: element.id,
    data: {
      type: 'element',
      element,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(element.id);
  }, [element.id, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(element.id);
  }, [element.id, onDelete]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDuplicate(element.id);
  }, [element.id, onDuplicate]);

  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(!isVisible);
  }, [isVisible]);

  const handleUpdate = useCallback((updates: Partial<QuizElement>) => {
    onUpdate(element.id, updates);
  }, [element.id, onUpdate]);

  const elementStyle = React.useMemo(() => {
    const { style: elementStyleConfig } = element;
    
    return {
      margin: elementStyleConfig.margin 
        ? `${elementStyleConfig.margin.top}px ${elementStyleConfig.margin.right}px ${elementStyleConfig.margin.bottom}px ${elementStyleConfig.margin.left}px`
        : '8px',
      padding: elementStyleConfig.padding
        ? `${elementStyleConfig.padding.top}px ${elementStyleConfig.padding.right}px ${elementStyleConfig.padding.bottom}px ${elementStyleConfig.padding.left}px`
        : '16px',
      backgroundColor: elementStyleConfig.backgroundColor,
      color: elementStyleConfig.color,
      borderRadius: elementStyleConfig.borderRadius ? `${elementStyleConfig.borderRadius}px` : undefined,
      borderWidth: elementStyleConfig.borderWidth ? `${elementStyleConfig.borderWidth}px` : undefined,
      borderColor: elementStyleConfig.borderColor,
      borderStyle: elementStyleConfig.borderWidth ? 'solid' : undefined,
      opacity: isVisible ? (elementStyleConfig.opacity || 1) : 0.3,
      fontSize: elementStyleConfig.fontSize ? `${elementStyleConfig.fontSize}px` : undefined,
      fontWeight: elementStyleConfig.fontWeight,
      fontFamily: elementStyleConfig.fontFamily || quizSettings.fontFamily,
      textAlign: elementStyleConfig.textAlign,
      width: elementStyleConfig.width,
      height: elementStyleConfig.height,
    };
  }, [element.style, isVisible, quizSettings.fontFamily]);

  const animationClass = React.useMemo(() => {
    const animation = element.style.animation;
    
    switch (animation) {
      case 'fadeIn':
        return 'animate-fade-in';
      case 'slideIn':
        return 'animate-slide-in';
      case 'bounce':
        return 'animate-bounce';
      case 'pulse':
        return 'animate-pulse';
      default:
        return '';
    }
  }, [element.style.animation]);

  if (elementIsDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 bg-blue-100 border-2 border-blue-300 border-dashed rounded-lg p-4"
      >
        <div className="text-center text-blue-600">
          Movendo elemento...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'relative group transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500 ring-opacity-50',
        (isHovered || isSelected) && 'shadow-lg',
        elementIsDragging && 'opacity-50 rotate-2',
        animationClass
      )}
    >
      {/* Element Controls */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-8 left-0 right-0 z-10">
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-t-lg px-2 py-1 shadow-sm">
            <div className="flex items-center gap-1">
              <button
                {...attributes}
                {...listeners}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                title="Arrastar"
              >
                <GripVertical className="w-3 h-3" />
              </button>
              <button
                onClick={handleToggleVisibility}
                className="p-1 text-gray-400 hover:text-gray-600"
                title={isVisible ? 'Ocultar' : 'Mostrar'}
              >
                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Configurações"
              >
                <Settings className="w-3 h-3" />
              </button>
              <button
                onClick={handleDuplicate}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Duplicar"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-red-400 hover:text-red-600"
                title="Excluir"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Element Content */}
      <div 
        style={elementStyle}
        className={cn(
          'relative',
          isSelected && 'ring-1 ring-blue-500 ring-inset rounded',
          !isVisible && 'pointer-events-none'
        )}
      >
        <ElementRenderer
          element={element}
          isEditing={isEditing}
          onUpdate={handleUpdate}
          onEndEdit={() => setIsEditing(false)}
          quizSettings={quizSettings}
        />
      </div>

      {/* Quick Actions */}
      {isSelected && (
        <div className="absolute -right-8 top-0 flex flex-col gap-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Move element up
              const currentIndex = element.position;
              if (currentIndex > 0) {
                // This would need to be handled by the parent component
              }
            }}
            className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-400 hover:text-gray-600"
            title="Mover para cima"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Move element down
              const currentIndex = element.position;
              // This would need to be handled by the parent component
            }}
            className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-400 hover:text-gray-600"
            title="Mover para baixo"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Condition Indicator */}
      {element.conditions && element.conditions.length > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white" title="Tem condições" />
      )}
    </div>
  );
};