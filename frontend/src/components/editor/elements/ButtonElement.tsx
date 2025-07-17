import React from 'react';
import { ButtonElement as ButtonElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { MousePointer, ArrowRight, ExternalLink } from 'lucide-react';

interface ButtonElementProps {
  element: ButtonElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<ButtonElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const ButtonElement: React.FC<ButtonElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    ghost: 'text-blue-600 hover:bg-blue-50',
    link: 'text-blue-600 hover:text-blue-800 underline',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const iconComponents = {
    arrow: <ArrowRight className="w-4 h-4" />,
    external: <ExternalLink className="w-4 h-4" />,
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações do Botão</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Texto</label>
              <input
                type="text"
                value={element.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Variante</label>
              <select
                value={element.variant}
                onChange={(e) => onUpdate({ variant: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="primary">Primário</option>
                <option value="secondary">Secundário</option>
                <option value="outline">Contorno</option>
                <option value="ghost">Fantasma</option>
                <option value="link">Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tamanho</label>
              <select
                value={element.size}
                onChange={(e) => onUpdate({ size: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="sm">Pequeno</option>
                <option value="md">Médio</option>
                <option value="lg">Grande</option>
                <option value="xl">Extra Grande</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Ícone</label>
              <select
                value={element.icon || ''}
                onChange={(e) => onUpdate({ icon: e.target.value || undefined })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="">Nenhum</option>
                <option value="arrow">Seta</option>
                <option value="external">Link Externo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Ação</label>
              <select
                value={element.action.type}
                onChange={(e) => onUpdate({ 
                  action: { ...element.action, type: e.target.value as any } 
                })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="navigate">Navegar</option>
                <option value="submit">Enviar</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Valor</label>
              <input
                type="text"
                value={element.action.value}
                onChange={(e) => onUpdate({ 
                  action: { ...element.action, value: e.target.value } 
                })}
                placeholder={element.action.type === 'navigate' ? 'URL ou #' : 'Valor'}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {element.icon && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Posição do Ícone</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ iconPosition: 'left' })}
                  className={cn(
                    'px-3 py-1 text-xs rounded',
                    element.iconPosition === 'left'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Esquerda
                </button>
                <button
                  onClick={() => onUpdate({ iconPosition: 'right' })}
                  className={cn(
                    'px-3 py-1 text-xs rounded',
                    element.iconPosition === 'right'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Direita
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <button
          className={cn(
            'inline-flex items-center gap-2 rounded-lg font-medium transition-colors',
            variantClasses[element.variant],
            sizeClasses[element.size]
          )}
          onClick={() => {
            if (element.action.type === 'navigate' && element.action.value) {
              window.open(element.action.value, '_blank');
            }
          }}
        >
          {element.icon && element.iconPosition === 'left' && iconComponents[element.icon as keyof typeof iconComponents]}
          {element.text}
          {element.icon && element.iconPosition === 'right' && iconComponents[element.icon as keyof typeof iconComponents]}
        </button>
      </div>
    </div>
  );
};