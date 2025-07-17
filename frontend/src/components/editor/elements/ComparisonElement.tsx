import React from 'react';
import { ComparisonElement as ComparisonElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { Check, X } from 'lucide-react';

interface ComparisonElementProps {
  element: ComparisonElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<ComparisonElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const ComparisonElement: React.FC<ComparisonElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  if (element.layout === 'side_by_side') {
    return (
      <div className="space-y-4">
        {isEditing && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Configurações da Comparação</h3>
              <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {element.items.map((item, index) => (
            <div key={item.id} className={cn(
              'bg-white border rounded-lg p-6',
              item.highlighted ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
            )}>
              {item.image && (
                <img src={item.image} alt={item.title} className="w-full h-32 object-cover rounded-lg mb-4" />
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <ul className="space-y-2">
                {item.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-left">Recurso</th>
              {element.items.map((item) => (
                <th key={item.id} className="border border-gray-200 p-3 text-center">
                  {item.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {element.items[0]?.features.map((feature, i) => (
              <tr key={i}>
                <td className="border border-gray-200 p-3 font-medium">{feature}</td>
                {element.items.map((item) => (
                  <td key={item.id} className="border border-gray-200 p-3 text-center">
                    <Check className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};