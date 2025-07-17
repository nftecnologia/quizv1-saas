import React, { useState } from 'react';
import { MultipleChoiceElement as MultipleChoiceElementType, Quiz } from '../../../types/editor';
import { cn, generateId } from '../../../lib/utils';
import { 
  Plus, 
  Trash2, 
  Image, 
  CheckSquare, 
  Square, 
  Circle, 
  CheckCircle,
  Grid3x3,
  Rows,
  Columns,
  Upload
} from 'lucide-react';

interface MultipleChoiceElementProps {
  element: MultipleChoiceElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<MultipleChoiceElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const MultipleChoiceElement: React.FC<MultipleChoiceElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  const handleQuestionChange = (question: string) => {
    onUpdate({ question });
  };

  const handleOptionChange = (optionId: string, field: string, value: string) => {
    const updatedOptions = element.options.map(option =>
      option.id === optionId ? { ...option, [field]: value } : option
    );
    onUpdate({ options: updatedOptions });
  };

  const handleAddOption = () => {
    const newOption = {
      id: generateId(),
      label: `Opção ${element.options.length + 1}`,
      value: `option_${element.options.length + 1}`,
    };
    onUpdate({ options: [...element.options, newOption] });
  };

  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = element.options.filter(option => option.id !== optionId);
    onUpdate({ options: updatedOptions });
  };

  const handleOptionSelect = (optionId: string) => {
    if (element.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleLayoutChange = (layout: 'vertical' | 'horizontal' | 'grid') => {
    onUpdate({ layout });
  };

  const handleToggleMultiple = () => {
    onUpdate({ allowMultiple: !element.allowMultiple });
  };

  const handleToggleImages = () => {
    onUpdate({ showImages: !element.showImages });
  };

  const handleImageUpload = (optionId: string, file: File) => {
    // Simulate image upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      handleOptionChange(optionId, 'image', imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const layoutClasses = {
    vertical: 'flex flex-col space-y-3',
    horizontal: 'flex flex-wrap gap-3',
    grid: 'grid grid-cols-2 gap-3',
  };

  const optionClasses = {
    vertical: 'w-full',
    horizontal: 'flex-1 min-w-[200px]',
    grid: 'w-full',
  };

  return (
    <div className="space-y-4">
      {/* Editing Controls */}
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações da Questão</h3>
            <button
              onClick={onEndEdit}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Layout */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Layout
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => handleLayoutChange('vertical')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded',
                    element.layout === 'vertical'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Rows className="w-3 h-3" />
                  Vertical
                </button>
                <button
                  onClick={() => handleLayoutChange('horizontal')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded',
                    element.layout === 'horizontal'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Columns className="w-3 h-3" />
                  Horizontal
                </button>
                <button
                  onClick={() => handleLayoutChange('grid')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded',
                    element.layout === 'grid'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Grid3x3 className="w-3 h-3" />
                  Grade
                </button>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Opções
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleMultiple}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded',
                    element.allowMultiple
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <CheckSquare className="w-3 h-3" />
                  Múltipla
                </button>
                <button
                  onClick={handleToggleImages}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded',
                    element.showImages
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Image className="w-3 h-3" />
                  Imagens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question */}
      <div>
        {isEditing ? (
          <input
            type="text"
            value={element.question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="w-full text-lg font-medium bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none"
            placeholder="Digite sua pergunta aqui..."
          />
        ) : (
          <h3 className="text-lg font-medium text-gray-900">
            {element.question}
          </h3>
        )}
      </div>

      {/* Options */}
      <div className={layoutClasses[element.layout]}>
        {element.options.map((option) => (
          <div
            key={option.id}
            className={cn(
              'relative group',
              optionClasses[element.layout]
            )}
          >
            <div
              className={cn(
                'flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200',
                selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
              onClick={() => handleOptionSelect(option.id)}
            >
              {/* Checkbox/Radio */}
              <div className="flex-shrink-0 mr-3">
                {element.allowMultiple ? (
                  selectedOptions.includes(option.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )
                ) : (
                  selectedOptions.includes(option.id) ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )
                )}
              </div>

              {/* Image */}
              {element.showImages && (
                <div className="flex-shrink-0 mr-3">
                  {option.image ? (
                    <img
                      src={option.image}
                      alt={option.label}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              {/* Label */}
              <div className="flex-1">
                {isEditing && editingOptionId === option.id ? (
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(option.id, 'label', e.target.value)}
                    onBlur={() => setEditingOptionId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingOptionId(null);
                      }
                    }}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-sm font-medium text-gray-900"
                    onDoubleClick={() => isEditing && setEditingOptionId(option.id)}
                  >
                    {option.label}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Controls */}
            {isEditing && (
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {element.showImages && (
                  <label className="p-1 bg-white border border-gray-300 rounded-full shadow-sm cursor-pointer hover:bg-gray-50">
                    <Upload className="w-3 h-3 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(option.id, file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                {element.options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Option Button */}
        {isEditing && (
          <button
            onClick={handleAddOption}
            className={cn(
              'flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors',
              optionClasses[element.layout]
            )}
          >
            <Plus className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Adicionar opção</span>
          </button>
        )}
      </div>

      {/* Required Indicator */}
      {element.required && (
        <div className="text-xs text-red-500">
          * Esta pergunta é obrigatória
        </div>
      )}
    </div>
  );
};