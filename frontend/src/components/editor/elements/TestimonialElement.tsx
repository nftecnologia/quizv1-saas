import React from 'react';
import { TestimonialElement as TestimonialElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { Quote, Star } from 'lucide-react';

interface TestimonialElementProps {
  element: TestimonialElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<TestimonialElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const TestimonialElement: React.FC<TestimonialElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'w-4 h-4',
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        )}
      />
    ));
  };

  const renderTestimonial = (testimonial: TestimonialElementType['testimonials'][0]) => (
    <div key={testimonial.id} className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <Quote className="w-6 h-6 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
            {testimonial.rating && (
              <div className="flex gap-1">
                {renderStars(testimonial.rating)}
              </div>
            )}
          </div>
          
          {(testimonial.role || testimonial.company) && (
            <p className="text-sm text-gray-600 mb-3">
              {testimonial.role}
              {testimonial.role && testimonial.company && ' • '}
              {testimonial.company}
            </p>
          )}
          
          <blockquote className="text-gray-700 italic">
            "{testimonial.content}"
          </blockquote>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações do Depoimento</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
        </div>
      )}

      {element.layout === 'single' && renderTestimonial(element.testimonials[0])}
      
      {element.layout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {element.testimonials.map(renderTestimonial)}
        </div>
      )}
      
      {element.layout === 'carousel' && (
        <div className="space-y-4">
          {renderTestimonial(element.testimonials[0])}
          <div className="flex justify-center gap-2">
            {element.testimonials.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full',
                  index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};