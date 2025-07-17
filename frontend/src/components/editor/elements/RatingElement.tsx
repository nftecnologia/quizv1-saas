import React, { useState } from 'react';
import { RatingElement as RatingElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { Star, Heart, ThumbsUp } from 'lucide-react';

interface RatingElementProps {
  element: RatingElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<RatingElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const RatingElement: React.FC<RatingElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const renderStars = () => {
    return Array.from({ length: element.scale }, (_, i) => {
      const ratingValue = i + 1;
      return (
        <button
          key={i}
          className={cn(
            'text-2xl transition-colors',
            ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
          )}
          onClick={() => setRating(ratingValue)}
          onMouseEnter={() => setHover(ratingValue)}
          onMouseLeave={() => setHover(0)}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      );
    });
  };

  const renderNumbers = () => {
    return Array.from({ length: element.scale }, (_, i) => {
      const ratingValue = i + 1;
      return (
        <button
          key={i}
          className={cn(
            'w-10 h-10 rounded-full border-2 font-medium transition-colors',
            ratingValue <= rating
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          )}
          onClick={() => setRating(ratingValue)}
        >
          {ratingValue}
        </button>
      );
    });
  };

  const renderEmojis = () => {
    const emojis = ['😞', '😟', '😐', '😊', '😍'];
    return Array.from({ length: element.scale }, (_, i) => {
      const ratingValue = i + 1;
      return (
        <button
          key={i}
          className={cn(
            'text-3xl transition-transform hover:scale-110',
            ratingValue <= rating && 'scale-110'
          )}
          onClick={() => setRating(ratingValue)}
        >
          {emojis[i] || '😊'}
        </button>
      );
    });
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações da Avaliação</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Pergunta</label>
              <input
                type="text"
                value={element.question}
                onChange={(e) => onUpdate({ question: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Escala</label>
              <select
                value={element.scale}
                onChange={(e) => onUpdate({ scale: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value={3}>3 pontos</option>
                <option value={5}>5 pontos</option>
                <option value={7}>7 pontos</option>
                <option value={10}>10 pontos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={element.scaleType}
                onChange={(e) => onUpdate({ scaleType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="stars">Estrelas</option>
                <option value="numbers">Números</option>
                <option value="emoji">Emojis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Rótulo Mínimo</label>
              <input
                type="text"
                value={element.labels?.min || ''}
                onChange={(e) => onUpdate({ 
                  labels: { ...element.labels, min: e.target.value } 
                })}
                placeholder="Ex: Péssimo"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Rótulo Máximo</label>
              <input
                type="text"
                value={element.labels?.max || ''}
                onChange={(e) => onUpdate({ 
                  labels: { ...element.labels, max: e.target.value } 
                })}
                placeholder="Ex: Excelente"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium text-gray-900">{element.question}</h3>
        
        <div className="flex justify-center items-center gap-2">
          {element.labels?.min && (
            <span className="text-sm text-gray-500">{element.labels.min}</span>
          )}
          
          <div className="flex gap-1">
            {element.scaleType === 'stars' && renderStars()}
            {element.scaleType === 'numbers' && renderNumbers()}
            {element.scaleType === 'emoji' && renderEmojis()}
          </div>
          
          {element.labels?.max && (
            <span className="text-sm text-gray-500">{element.labels.max}</span>
          )}
        </div>

        {rating > 0 && (
          <div className="text-sm text-gray-600">
            Sua avaliação: {rating}/{element.scale}
          </div>
        )}
      </div>
    </div>
  );
};