import React, { useState } from 'react';
import { QuizElement, Quiz } from '../../types/editor';
import { cn } from '../../lib/utils';
import { 
  Settings, 
  Palette, 
  Layout, 
  Eye, 
  Code,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: string | null;
  elements: QuizElement[];
  quizSettings: Quiz['settings'];
  onElementUpdate: (elementId: string, updates: Partial<QuizElement>) => void;
  onSettingsUpdate: (updates: Partial<Quiz['settings']>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  elements,
  quizSettings,
  onElementUpdate,
  onSettingsUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'layout' | 'conditions' | 'settings'>('style');
  const [expandedSections, setExpandedSections] = useState<string[]>(['spacing', 'colors', 'typography']);

  const element = elements.find(el => el.id === selectedElement);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleStyleUpdate = (updates: Partial<QuizElement['style']>) => {
    if (!element) return;
    
    onElementUpdate(element.id, {
      style: { ...element.style, ...updates }
    });
  };

  const handleElementUpdate = (updates: Partial<QuizElement>) => {
    if (!element) return;
    onElementUpdate(element.id, updates);
  };

  const renderSpacingControls = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Margem</label>
          <div className="grid grid-cols-2 gap-1">
            <input
              type="number"
              value={element?.style.margin?.top || 8}
              onChange={(e) => handleStyleUpdate({
                margin: { 
                  ...element?.style.margin, 
                  top: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="T"
            />
            <input
              type="number"
              value={element?.style.margin?.right || 8}
              onChange={(e) => handleStyleUpdate({
                margin: { 
                  ...element?.style.margin, 
                  right: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="R"
            />
            <input
              type="number"
              value={element?.style.margin?.bottom || 8}
              onChange={(e) => handleStyleUpdate({
                margin: { 
                  ...element?.style.margin, 
                  bottom: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="B"
            />
            <input
              type="number"
              value={element?.style.margin?.left || 8}
              onChange={(e) => handleStyleUpdate({
                margin: { 
                  ...element?.style.margin, 
                  left: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="L"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
          <div className="grid grid-cols-2 gap-1">
            <input
              type="number"
              value={element?.style.padding?.top || 16}
              onChange={(e) => handleStyleUpdate({
                padding: { 
                  ...element?.style.padding, 
                  top: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="T"
            />
            <input
              type="number"
              value={element?.style.padding?.right || 16}
              onChange={(e) => handleStyleUpdate({
                padding: { 
                  ...element?.style.padding, 
                  right: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="R"
            />
            <input
              type="number"
              value={element?.style.padding?.bottom || 16}
              onChange={(e) => handleStyleUpdate({
                padding: { 
                  ...element?.style.padding, 
                  bottom: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="B"
            />
            <input
              type="number"
              value={element?.style.padding?.left || 16}
              onChange={(e) => handleStyleUpdate({
                padding: { 
                  ...element?.style.padding, 
                  left: parseInt(e.target.value) 
                }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="L"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderColorControls = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cor do Texto</label>
          <input
            type="color"
            value={element?.style.color || '#000000'}
            onChange={(e) => handleStyleUpdate({ color: e.target.value })}
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cor de Fundo</label>
          <input
            type="color"
            value={element?.style.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cor da Borda</label>
          <input
            type="color"
            value={element?.style.borderColor || '#d1d5db'}
            onChange={(e) => handleStyleUpdate({ borderColor: e.target.value })}
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Largura da Borda</label>
          <input
            type="number"
            value={element?.style.borderWidth || 0}
            onChange={(e) => handleStyleUpdate({ borderWidth: parseInt(e.target.value) })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            min="0"
            max="10"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Opacidade</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={element?.style.opacity || 1}
          onChange={(e) => handleStyleUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{((element?.style.opacity || 1) * 100).toFixed(0)}%</span>
      </div>
    </div>
  );

  const renderTypographyControls = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tamanho da Fonte</label>
        <input
          type="range"
          min="12"
          max="72"
          value={element?.style.fontSize || 16}
          onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{element?.style.fontSize || 16}px</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Peso da Fonte</label>
        <select
          value={element?.style.fontWeight || 'normal'}
          onChange={(e) => handleStyleUpdate({ fontWeight: e.target.value as any })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="100">Thin</option>
          <option value="200">Extra Light</option>
          <option value="300">Light</option>
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semi Bold</option>
          <option value="700">Bold</option>
          <option value="800">Extra Bold</option>
          <option value="900">Black</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Família da Fonte</label>
        <select
          value={element?.style.fontFamily || 'inherit'}
          onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="inherit">Padrão</option>
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {['left', 'center', 'right', 'justify'].map((align) => (
            <button
              key={align}
              onClick={() => handleStyleUpdate({ textAlign: align as any })}
              className={cn(
                'flex-1 px-2 py-1 text-xs border border-gray-300 rounded',
                element?.style.textAlign === align
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {align === 'left' && 'Esq'}
              {align === 'center' && 'Cent'}
              {align === 'right' && 'Dir'}
              {align === 'justify' && 'Just'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLayoutControls = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Largura</label>
          <input
            type="text"
            value={element?.style.width || 'auto'}
            onChange={(e) => handleStyleUpdate({ width: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="auto, 100px, 50%"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Altura</label>
          <input
            type="text"
            value={element?.style.height || 'auto'}
            onChange={(e) => handleStyleUpdate({ height: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="auto, 100px, 50%"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Borda Arredondada</label>
        <input
          type="range"
          min="0"
          max="50"
          value={element?.style.borderRadius || 0}
          onChange={(e) => handleStyleUpdate({ borderRadius: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{element?.style.borderRadius || 0}px</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Animação</label>
        <select
          value={element?.style.animation || 'none'}
          onChange={(e) => handleStyleUpdate({ animation: e.target.value as any })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="none">Nenhuma</option>
          <option value="fadeIn">Fade In</option>
          <option value="slideIn">Slide In</option>
          <option value="bounce">Bounce</option>
          <option value="pulse">Pulse</option>
        </select>
      </div>
    </div>
  );

  const renderConditionsControls = () => (
    <div className="space-y-3">
      <div className="text-center py-8 text-gray-500">
        <Code className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Lógica condicional</p>
        <p className="text-xs">Em breve...</p>
      </div>
    </div>
  );

  const renderSection = (title: string, key: string, content: React.ReactNode) => (
    <div key={key} className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(key)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        {expandedSections.includes(key) ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {expandedSections.includes(key) && (
        <div className="px-3 pb-3">
          {content}
        </div>
      )}
    </div>
  );

  if (!element) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Settings className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Selecione um elemento</p>
          <p className="text-xs">para ver as propriedades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Propriedades</h2>
          <button
            onClick={() => {/* Clear selection */}}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {element.type.charAt(0).toUpperCase() + element.type.slice(1).replace('_', ' ')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
          { id: 'layout', label: 'Layout', icon: <Layout className="w-4 h-4" /> },
          { id: 'conditions', label: 'Condições', icon: <Code className="w-4 h-4" /> },
          { id: 'settings', label: 'Config', icon: <Settings className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'style' && (
          <div>
            {renderSection('Espaçamento', 'spacing', renderSpacingControls())}
            {renderSection('Cores', 'colors', renderColorControls())}
            {renderSection('Tipografia', 'typography', renderTypographyControls())}
          </div>
        )}

        {activeTab === 'layout' && (
          <div>
            {renderSection('Dimensões', 'dimensions', renderLayoutControls())}
          </div>
        )}

        {activeTab === 'conditions' && (
          <div>
            {renderSection('Lógica Condicional', 'conditions', renderConditionsControls())}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={element.required || false}
                    onChange={(e) => handleElementUpdate({ required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Obrigatório</span>
                </label>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rótulo</label>
                <input
                  type="text"
                  value={element.label || ''}
                  onChange={(e) => handleElementUpdate({ label: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Rótulo do elemento"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};