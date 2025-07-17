import React, { useState, useRef, useEffect } from 'react';
import { TextElement as TextElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react';

interface TextElementProps {
  element: TextElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<TextElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

const variantStyles = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',
  h6: 'text-base font-medium',
  p: 'text-base',
  span: 'text-sm',
};

const variantTags = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
  span: 'span',
};

export const TextElement: React.FC<TextElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const [localContent, setLocalContent] = useState(element.content);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = () => {
    if (!isInlineEditing) {
      setIsInlineEditing(true);
    }
  };

  const handleBlur = () => {
    if (isInlineEditing) {
      setIsInlineEditing(false);
      onUpdate({ content: localContent });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsInlineEditing(false);
      setLocalContent(element.content);
    }
  };

  const handleVariantChange = (variant: TextElementType['variant']) => {
    onUpdate({ variant });
  };

  const handleAlignmentChange = (textAlign: 'left' | 'center' | 'right') => {
    onUpdate({
      style: {
        ...element.style,
        textAlign,
      },
    });
  };

  const handleStyleChange = (styleKey: string, value: any) => {
    onUpdate({
      style: {
        ...element.style,
        [styleKey]: value,
      },
    });
  };

  useEffect(() => {
    if (isInlineEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isInlineEditing]);

  const textStyle = {
    textAlign: element.style.textAlign || 'left',
    fontWeight: element.style.fontWeight,
    fontSize: element.style.fontSize,
    color: element.style.color,
    fontFamily: element.style.fontFamily || quizSettings.fontFamily,
  };

  if (isInlineEditing) {
    return (
      <div className="relative">
        <textarea
          ref={inputRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full resize-none border-2 border-blue-500 rounded-md bg-white',
            variantStyles[element.variant]
          )}
          style={textStyle}
          rows={Math.max(1, localContent.split('\n').length)}
        />
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Inline Edit Toolbar */}
      {isEditing && (
        <div className="absolute -top-10 left-0 right-0 z-20">
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-lg">
            <div className="flex items-center gap-1">
              {/* Variant Selector */}
              <select
                value={element.variant}
                onChange={(e) => handleVariantChange(e.target.value as TextElementType['variant'])}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="h1">Título 1</option>
                <option value="h2">Título 2</option>
                <option value="h3">Título 3</option>
                <option value="h4">Título 4</option>
                <option value="h5">Título 5</option>
                <option value="h6">Título 6</option>
                <option value="p">Parágrafo</option>
                <option value="span">Texto</option>
              </select>

              {/* Alignment */}
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => handleAlignmentChange('left')}
                  className={cn(
                    'p-1 text-xs hover:bg-gray-100',
                    element.style.textAlign === 'left' && 'bg-blue-100 text-blue-600'
                  )}
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleAlignmentChange('center')}
                  className={cn(
                    'p-1 text-xs hover:bg-gray-100',
                    element.style.textAlign === 'center' && 'bg-blue-100 text-blue-600'
                  )}
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleAlignmentChange('right')}
                  className={cn(
                    'p-1 text-xs hover:bg-gray-100',
                    element.style.textAlign === 'right' && 'bg-blue-100 text-blue-600'
                  )}
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </div>

              {/* Font Weight */}
              <button
                onClick={() => handleStyleChange('fontWeight', 
                  element.style.fontWeight === 'bold' ? 'normal' : 'bold'
                )}
                className={cn(
                  'p-1 text-xs hover:bg-gray-100 rounded',
                  element.style.fontWeight === 'bold' && 'bg-blue-100 text-blue-600'
                )}
              >
                <Bold className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Font Size */}
              <input
                type="range"
                min="12"
                max="72"
                value={element.style.fontSize || 16}
                onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                className="w-16"
              />
              <span className="text-xs text-gray-500 min-w-[2rem]">
                {element.style.fontSize || 16}px
              </span>

              {/* Color */}
              <input
                type="color"
                value={element.style.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Text Content */}
      {React.createElement(
        variantTags[element.variant],
        {
          className: cn(
            variantStyles[element.variant],
            'cursor-text transition-all duration-200',
            isEditing && 'ring-2 ring-blue-500 ring-opacity-30 rounded-md',
            element.content.trim() === '' && 'text-gray-400'
          ),
          style: textStyle,
          onDoubleClick: handleDoubleClick,
          contentEditable: false,
          suppressContentEditableWarning: true,
        },
        element.content || 'Clique duas vezes para editar'
      )}

      {/* Placeholder for empty text */}
      {element.content.trim() === '' && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <span className="text-sm">Clique duas vezes para editar</span>
          </div>
        </div>
      )}
    </div>
  );
};