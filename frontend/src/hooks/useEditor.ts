import { useState, useCallback, useEffect } from 'react';
import { Quiz, QuizElement, EditorState, ElementType } from '../types/editor';
import { generateId } from '../lib/utils';

const initialQuiz: Quiz = {
  id: '',
  title: 'Novo Quiz',
  description: '',
  elements: [],
  settings: {
    theme: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    fontFamily: 'Inter',
    showProgressBar: true,
    allowBackNavigation: true,
    autoSave: true,
    responsive: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useEditor = () => {
  const [editorState, setEditorState] = useState<EditorState>({
    quiz: initialQuiz,
    selectedElement: null,
    previewMode: false,
    isDragging: false,
    clipboard: null,
    history: {
      past: [],
      present: initialQuiz,
      future: [],
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (editorState.quiz.settings.autoSave) {
      const timer = setTimeout(() => {
        saveQuiz();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [editorState.quiz]);

  const saveQuiz = useCallback(async () => {
    try {
      const quizData = {
        ...editorState.quiz,
        updatedAt: new Date().toISOString(),
      };
      
      // Save to localStorage for now
      localStorage.setItem(`quiz_${editorState.quiz.id}`, JSON.stringify(quizData));
      
      // TODO: Implement API call to save quiz
      console.log('Quiz saved:', quizData);
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  }, [editorState.quiz]);

  const loadQuiz = useCallback(async (id: string) => {
    try {
      const savedQuiz = localStorage.getItem(`quiz_${id}`);
      if (savedQuiz) {
        const quiz = JSON.parse(savedQuiz);
        setEditorState(prev => ({
          ...prev,
          quiz,
          history: {
            past: [],
            present: quiz,
            future: [],
          },
        }));
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  }, []);

  const addElement = useCallback((type: ElementType, position?: number) => {
    const newElement = createElementByType(type);
    const insertPosition = position ?? editorState.quiz.elements.length;
    
    setEditorState(prev => {
      const newElements = [...prev.quiz.elements];
      newElements.splice(insertPosition, 0, newElement);
      
      // Update positions
      newElements.forEach((el, index) => {
        el.position = index;
      });

      const updatedQuiz = {
        ...prev.quiz,
        elements: newElements,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quiz: updatedQuiz,
        selectedElement: newElement.id,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: updatedQuiz,
          future: [],
        },
      };
    });
  }, [editorState.quiz.elements]);

  const updateElement = useCallback((id: string, updates: Record<string, any>) => {
    setEditorState(prev => {
      const elementIndex = prev.quiz.elements.findIndex(el => el.id === id);
      if (elementIndex === -1) return prev;

      const newElements = [...prev.quiz.elements];
      newElements[elementIndex] = { ...newElements[elementIndex], ...updates };

      const updatedQuiz = {
        ...prev.quiz,
        elements: newElements,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quiz: updatedQuiz,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: updatedQuiz,
          future: [],
        },
      };
    });
  }, []);

  const removeElement = useCallback((id: string) => {
    setEditorState(prev => {
      const newElements = prev.quiz.elements
        .filter(el => el.id !== id)
        .map((el, index) => ({ ...el, position: index }));

      const updatedQuiz = {
        ...prev.quiz,
        elements: newElements,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quiz: updatedQuiz,
        selectedElement: prev.selectedElement === id ? null : prev.selectedElement,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: updatedQuiz,
          future: [],
        },
      };
    });
  }, []);

  const duplicateElement = useCallback((id: string) => {
    const element = editorState.quiz.elements.find(el => el.id === id);
    if (!element) return;

    const duplicatedElement = {
      ...element,
      id: generateId(),
      position: element.position + 1,
    };

    setEditorState(prev => {
      const newElements = [...prev.quiz.elements];
      newElements.splice(element.position + 1, 0, duplicatedElement);
      
      // Update positions
      newElements.forEach((el, index) => {
        el.position = index;
      });

      const updatedQuiz = {
        ...prev.quiz,
        elements: newElements,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quiz: updatedQuiz,
        selectedElement: duplicatedElement.id,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: updatedQuiz,
          future: [],
        },
      };
    });
  }, [editorState.quiz.elements]);

  const moveElement = useCallback((fromIndex: number, toIndex: number) => {
    setEditorState(prev => {
      const newElements = [...prev.quiz.elements];
      const [movedElement] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, movedElement);
      
      // Update positions
      newElements.forEach((el, index) => {
        el.position = index;
      });

      const updatedQuiz = {
        ...prev.quiz,
        elements: newElements,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quiz: updatedQuiz,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: updatedQuiz,
          future: [],
        },
      };
    });
  }, []);

  const selectElement = useCallback((id: string | null) => {
    setEditorState(prev => ({ ...prev, selectedElement: id }));
  }, []);

  const togglePreview = useCallback(() => {
    setEditorState(prev => ({ ...prev, previewMode: !prev.previewMode }));
  }, []);

  const copyElement = useCallback((id: string) => {
    const element = editorState.quiz.elements.find(el => el.id === id);
    if (element) {
      setEditorState(prev => ({ ...prev, clipboard: element }));
    }
  }, [editorState.quiz.elements]);

  const pasteElement = useCallback((position?: number) => {
    if (!editorState.clipboard) return;

    const pastedElement = {
      ...editorState.clipboard,
      id: generateId(),
      position: position ?? editorState.quiz.elements.length,
    };

    addElement(pastedElement.type, position);
    // Update element after adding
    setTimeout(() => {
      updateElement(pastedElement.id, pastedElement);
    }, 0);
  }, [editorState.clipboard, addElement, updateElement]);

  const undo = useCallback(() => {
    setEditorState(prev => {
      if (prev.history.past.length === 0) return prev;

      const previous = prev.history.past[prev.history.past.length - 1];
      const newPast = prev.history.past.slice(0, prev.history.past.length - 1);

      return {
        ...prev,
        quiz: previous,
        history: {
          past: newPast,
          present: previous,
          future: [prev.history.present, ...prev.history.future],
        },
      };
    });
  }, []);

  const redo = useCallback(() => {
    setEditorState(prev => {
      if (prev.history.future.length === 0) return prev;

      const next = prev.history.future[0];
      const newFuture = prev.history.future.slice(1);

      return {
        ...prev,
        quiz: next,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: next,
          future: newFuture,
        },
      };
    });
  }, []);

  const updateQuizSettings = useCallback((updates: Partial<Quiz['settings']>) => {
    setEditorState(prev => {
      const updatedQuiz = {
        ...prev.quiz,
        settings: { ...prev.quiz.settings, ...updates },
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quiz: updatedQuiz,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: updatedQuiz,
          future: [],
        },
      };
    });
  }, []);

  const setDragging = useCallback((isDragging: boolean) => {
    setEditorState(prev => ({ ...prev, isDragging }));
  }, []);

  return {
    editorState,
    actions: {
      addElement,
      updateElement,
      removeElement,
      duplicateElement,
      moveElement,
      selectElement,
      togglePreview,
      copyElement,
      pasteElement,
      undo,
      redo,
      updateQuizSettings,
      setDragging,
      saveQuiz,
      loadQuiz,
    },
  };
};

const createElementByType = (type: ElementType): QuizElement => {
  const baseElement = {
    id: generateId(),
    type,
    position: 0,
    style: {
      margin: { top: 8, right: 8, bottom: 8, left: 8 },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    },
  };

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        content: 'Texto de exemplo',
        variant: 'p',
      };
    case 'multiple_choice':
      return {
        ...baseElement,
        type: 'multiple_choice',
        question: 'Qual é a sua preferência?',
        options: [
          { id: generateId(), label: 'Opção 1', value: 'option1' },
          { id: generateId(), label: 'Opção 2', value: 'option2' },
        ],
        allowMultiple: false,
        showImages: false,
        layout: 'vertical',
      };
    case 'image':
      return {
        ...baseElement,
        type: 'image',
        src: 'https://via.placeholder.com/400x300',
        alt: 'Imagem de exemplo',
        fit: 'cover',
      };
    case 'video':
      return {
        ...baseElement,
        type: 'video',
        src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        controls: true,
        autoplay: false,
        loop: false,
        muted: false,
        platform: 'youtube',
      };
    case 'button':
      return {
        ...baseElement,
        type: 'button',
        text: 'Clique aqui',
        variant: 'primary',
        size: 'md',
        action: { type: 'navigate', value: '#' },
      };
    case 'input':
      return {
        ...baseElement,
        type: 'input',
        inputType: 'text',
        placeholder: 'Digite aqui...',
        label: 'Campo de texto',
      };
    case 'rating':
      return {
        ...baseElement,
        type: 'rating',
        question: 'Como você avalia?',
        scale: 5,
        scaleType: 'stars',
      };
    case 'comparison':
      return {
        ...baseElement,
        type: 'comparison',
        items: [
          {
            id: generateId(),
            title: 'Opção A',
            description: 'Descrição da opção A',
            features: ['Recurso 1', 'Recurso 2'],
          },
          {
            id: generateId(),
            title: 'Opção B',
            description: 'Descrição da opção B',
            features: ['Recurso 1', 'Recurso 2'],
          },
        ],
        layout: 'side_by_side',
      };
    case 'carousel':
      return {
        ...baseElement,
        type: 'carousel',
        images: [
          {
            id: generateId(),
            src: 'https://via.placeholder.com/400x300',
            alt: 'Imagem 1',
          },
          {
            id: generateId(),
            src: 'https://via.placeholder.com/400x300',
            alt: 'Imagem 2',
          },
        ],
        autoplay: false,
        showDots: true,
        showArrows: true,
        interval: 5000,
      };
    case 'testimonial':
      return {
        ...baseElement,
        type: 'testimonial',
        testimonials: [
          {
            id: generateId(),
            name: 'João Silva',
            role: 'Cliente',
            content: 'Excelente produto! Recomendo a todos.',
            rating: 5,
          },
        ],
        layout: 'single',
      };
    case 'chart':
      return {
        ...baseElement,
        type: 'chart',
        chartType: 'bar',
        data: {
          labels: ['Jan', 'Fev', 'Mar', 'Abr'],
          datasets: [
            {
              label: 'Vendas',
              data: [12, 19, 3, 5],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            },
          ],
        },
        showLegend: true,
      };
    case 'price':
      return {
        ...baseElement,
        type: 'price',
        plans: [
          {
            id: generateId(),
            name: 'Básico',
            price: 29.99,
            currency: 'BRL',
            period: 'month',
            features: ['Recurso 1', 'Recurso 2'],
            buttonText: 'Assinar',
          },
          {
            id: generateId(),
            name: 'Premium',
            price: 59.99,
            currency: 'BRL',
            period: 'month',
            features: ['Recurso 1', 'Recurso 2', 'Recurso 3'],
            highlighted: true,
            buttonText: 'Assinar',
          },
        ],
        layout: 'horizontal',
      };
    default:
      throw new Error(`Unknown element type: ${type}`);
  }
};