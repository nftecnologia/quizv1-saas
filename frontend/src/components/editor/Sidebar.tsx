import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  Type, 
  Image, 
  Video, 
  MousePointer, 
  TextCursor, 
  Star, 
  BarChart3, 
  ChevronDown,
  ChevronRight,
  MessageCircle,
  ImageIcon,
  DollarSign,
  Layers,
  Users,
  TrendingUp,
  Zap,
  Settings,
  Palette,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import { ElementType, QuizElement } from '../../types/editor';
import { cn } from '../../lib/utils';

interface SidebarProps {
  elements: QuizElement[];
  onElementAdd: (type: ElementType, position?: number) => void;
}

interface ElementDefinition {
  type: ElementType;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

const elementDefinitions: ElementDefinition[] = [
  {
    type: 'text',
    name: 'Texto',
    icon: <Type className="w-4 h-4" />,
    description: 'Títulos, subtítulos e parágrafos',
    category: 'Básico'
  },
  {
    type: 'image',
    name: 'Imagem',
    icon: <Image className="w-4 h-4" />,
    description: 'Fotos, ilustrações e gráficos',
    category: 'Básico'
  },
  {
    type: 'video',
    name: 'Vídeo',
    icon: <Video className="w-4 h-4" />,
    description: 'YouTube, Vimeo ou upload',
    category: 'Básico'
  },
  {
    type: 'button',
    name: 'Botão',
    icon: <MousePointer className="w-4 h-4" />,
    description: 'Botões de ação customizáveis',
    category: 'Básico'
  },
  {
    type: 'multiple_choice',
    name: 'Múltipla Escolha',
    icon: <Layers className="w-4 h-4" />,
    description: 'Questões com opções',
    category: 'Interativo'
  },
  {
    type: 'input',
    name: 'Campo de Texto',
    icon: <TextCursor className="w-4 h-4" />,
    description: 'Inputs de texto, email, telefone',
    category: 'Interativo'
  },
  {
    type: 'rating',
    name: 'Avaliação',
    icon: <Star className="w-4 h-4" />,
    description: 'Estrelas, números ou emojis',
    category: 'Interativo'
  },
  {
    type: 'comparison',
    name: 'Comparação',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Compare produtos ou serviços',
    category: 'Avançado'
  },
  {
    type: 'carousel',
    name: 'Carrossel',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Galeria de imagens deslizante',
    category: 'Avançado'
  },
  {
    type: 'testimonial',
    name: 'Depoimento',
    icon: <MessageCircle className="w-4 h-4" />,
    description: 'Avaliações e comentários',
    category: 'Avançado'
  },
  {
    type: 'chart',
    name: 'Gráfico',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Barras, pizza, linhas',
    category: 'Avançado'
  },
  {
    type: 'price',
    name: 'Preço',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Tabelas de preços',
    category: 'Avançado'
  },
];

const categories = [
  { name: 'Básico', icon: <Zap className="w-4 h-4" /> },
  { name: 'Interativo', icon: <Users className="w-4 h-4" /> },
  { name: 'Avançado', icon: <Settings className="w-4 h-4" /> },
];

const DraggableElementItem: React.FC<{
  element: ElementDefinition;
  onAdd: (type: ElementType) => void;
}> = ({ element, onAdd }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${element.type}`,
    data: {
      type: element.type,
      isFromSidebar: true,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging && 'opacity-50 rotate-3 scale-105'
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100">
        {element.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{element.name}</div>
        <div className="text-xs text-gray-500 truncate">{element.description}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd(element.type);
        }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all duration-200"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  elements, 
  onElementAdd 
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([
    'Básico',
    'Interativo',
    'Avançado'
  ]);
  const [showLayers, setShowLayers] = React.useState(true);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleElementAdd = (type: ElementType) => {
    onElementAdd(type);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Elementos</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              {showLayers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700 rounded">
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Element Library */}
        <div className="p-4 space-y-4">
          {categories.map((category) => {
            const categoryElements = elementDefinitions.filter(
              el => el.category === category.name
            );
            const isExpanded = expandedCategories.includes(category.name);

            return (
              <div key={category.name} className="space-y-2">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <span className="text-sm font-medium text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({categoryElements.length})
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-2 space-y-2">
                    {categoryElements.map((element) => (
                      <DraggableElementItem
                        key={element.type}
                        element={element}
                        onAdd={handleElementAdd}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Layers Panel */}
        {showLayers && (
          <div className="border-t border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Camadas</h3>
                <span className="text-xs text-gray-500">
                  {elements.length} elementos
                </span>
              </div>
              
              <div className="space-y-1">
                {elements.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-8">
                    Arraste elementos aqui para começar
                  </div>
                ) : (
                  elements.map((element, index) => {
                    const definition = elementDefinitions.find(def => def.type === element.type);
                    return (
                      <div
                        key={element.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm"
                      >
                        <div className="w-4 h-4 text-gray-400">
                          {definition?.icon}
                        </div>
                        <span className="flex-1 truncate text-gray-700">
                          {definition?.name} {index + 1}
                        </span>
                        <button className="w-4 h-4 text-gray-400 hover:text-gray-600">
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};