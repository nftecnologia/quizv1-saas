import React from 'react';
import { QuizElement, Quiz } from '../../../types/editor';
import { TextElement } from './TextElement';
import { MultipleChoiceElement } from './MultipleChoiceElement';
import { ImageElement } from './ImageElement';
import { VideoElement } from './VideoElement';
import { ButtonElement } from './ButtonElement';
import { InputElement } from './InputElement';
import { RatingElement } from './RatingElement';
import { ComparisonElement } from './ComparisonElement';
import { CarouselElement } from './CarouselElement';
import { TestimonialElement } from './TestimonialElement';
import { ChartElement } from './ChartElement';
import { PriceElement } from './PriceElement';

interface ElementRendererProps {
  element: QuizElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<QuizElement>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const commonProps = {
    isEditing,
    onUpdate,
    onEndEdit,
    quizSettings,
  };

  switch (element.type) {
    case 'text':
      return <TextElement element={element} {...commonProps} />;
    
    case 'multiple_choice':
      return <MultipleChoiceElement element={element} {...commonProps} />;
    
    case 'image':
      return <ImageElement element={element} {...commonProps} />;
    
    case 'video':
      return <VideoElement element={element} {...commonProps} />;
    
    case 'button':
      return <ButtonElement element={element} {...commonProps} />;
    
    case 'input':
      return <InputElement element={element} {...commonProps} />;
    
    case 'rating':
      return <RatingElement element={element} {...commonProps} />;
    
    case 'comparison':
      return <ComparisonElement element={element} {...commonProps} />;
    
    case 'carousel':
      return <CarouselElement element={element} {...commonProps} />;
    
    case 'testimonial':
      return <TestimonialElement element={element} {...commonProps} />;
    
    case 'chart':
      return <ChartElement element={element} {...commonProps} />;
    
    case 'price':
      return <PriceElement element={element} {...commonProps} />;
    
    default:
      return (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center text-gray-600">
            Tipo de elemento não suportado: {(element as any).type}
          </div>
        </div>
      );
  }
};