import React from 'react';
import { InputElement as InputElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';

interface InputElementProps {
  element: InputElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<InputElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const InputElement: React.FC<InputElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const inputTypes = {
    text: 'text',
    email: 'email',
    tel: 'tel',
    number: 'number',
    password: 'password',
    textarea: 'textarea',
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações do Campo</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Rótulo</label>
              <input
                type="text"
                value={element.label || ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={element.inputType}
                onChange={(e) => onUpdate({ inputType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="text">Texto</option>
                <option value="email">Email</option>
                <option value="tel">Telefone</option>
                <option value="number">Número</option>
                <option value="password">Senha</option>
                <option value="textarea">Área de Texto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Placeholder</label>
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={element.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Obrigatório</span>
            </label>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {element.label && (
          <label className="block text-sm font-medium text-gray-700">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {element.inputType === 'textarea' ? (
          <textarea
            placeholder={element.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        ) : (
          <input
            type={inputTypes[element.inputType]}
            placeholder={element.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        )}
      </div>
    </div>
  );
};