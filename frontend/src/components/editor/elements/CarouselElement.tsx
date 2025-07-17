import React, { useState } from 'react';
import { CarouselElement as CarouselElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselElementProps {
  element: CarouselElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<CarouselElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const CarouselElement: React.FC<CarouselElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % element.images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + element.images.length) % element.images.length);
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações do Carrossel</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="overflow-hidden rounded-lg">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {element.images.map((image) => (
              <div key={image.id} className="w-full flex-shrink-0">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-64 object-cover"
                />
                {image.caption && (
                  <div className="bg-black bg-opacity-50 text-white p-3 text-center">
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {element.showArrows && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {element.showDots && (
          <div className="flex justify-center gap-2 mt-4">
            {element.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};