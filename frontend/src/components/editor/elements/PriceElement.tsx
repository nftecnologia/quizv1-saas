import React from 'react';
import { PriceElement as PriceElementType, Quiz } from '../../../types/editor';
import { cn, formatCurrency } from '../../../lib/utils';
import { Check, Star } from 'lucide-react';

interface PriceElementProps {
  element: PriceElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<PriceElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const PriceElement: React.FC<PriceElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const renderPlan = (plan: PriceElementType['plans'][0]) => (
    <div
      key={plan.id}
      className={cn(
        'bg-white border rounded-lg p-6 relative',
        plan.highlighted
          ? 'border-blue-500 ring-2 ring-blue-100 transform scale-105'
          : 'border-gray-200'
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Star className="w-3 h-3" />
            Mais Popular
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="text-3xl font-bold text-gray-900">
          {formatCurrency(plan.price, plan.currency)}
          <span className="text-sm font-normal text-gray-500">
            /{plan.period === 'month' ? 'mês' : plan.period === 'year' ? 'ano' : ''}
          </span>
        </div>
      </div>
      
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        className={cn(
          'w-full py-3 px-4 rounded-lg font-medium transition-colors',
          plan.highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        )}
        onClick={() => {
          if (plan.buttonAction) {
            window.open(plan.buttonAction, '_blank');
          }
        }}
      >
        {plan.buttonText || 'Escolher Plano'}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações de Preço</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className={cn(
        'gap-6',
        element.layout === 'horizontal' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col'
      )}>
        {element.plans.map(renderPlan)}
      </div>
    </div>
  );
};