import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useEditor } from '../../hooks/useEditor';
import { ElementType, QuizElement } from '../../types/editor';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { DraggableElement } from './DraggableElement';
import { Preview } from './Preview';
import { cn } from '../../lib/utils';

interface VisualEditorProps {
  quizId?: string;
  className?: string;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ 
  quizId, 
  className 
}) => {
  const { editorState, actions } = useEditor();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<QuizElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    actions.setDragging(true);

    // Check if dragging from sidebar (new element) or canvas (existing element)
    const elementType = active.data.current?.type as ElementType;
    if (elementType) {
      // New element from sidebar
      setDraggedElement(null);
    } else {
      // Existing element from canvas
      const element = editorState.quiz.elements.find(el => el.id === active.id);
      setDraggedElement(element || null);
    }
  }, [actions, editorState.quiz.elements]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle dropping new element from sidebar
    if (active.data.current?.type && overId === 'canvas') {
      const elementType = active.data.current.type as ElementType;
      const dropIndex = active.data.current?.sortable?.index || editorState.quiz.elements.length;
      
      // We'll handle this in dragEnd
      return;
    }

    // Handle reordering existing elements
    if (activeId !== overId) {
      const activeIndex = editorState.quiz.elements.findIndex(el => el.id === activeId);
      const overIndex = editorState.quiz.elements.findIndex(el => el.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // This will be handled in dragEnd
      }
    }
  }, [editorState.quiz.elements]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedElement(null);
    actions.setDragging(false);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle dropping new element from sidebar
    if (active.data.current?.type) {
      const elementType = active.data.current.type as ElementType;
      
      if (overId === 'canvas') {
        // Add new element to canvas
        const dropIndex = over.data.current?.sortable?.index || editorState.quiz.elements.length;
        actions.addElement(elementType, dropIndex);
      }
      return;
    }

    // Handle reordering existing elements
    const activeIndex = editorState.quiz.elements.findIndex(el => el.id === activeId);
    const overIndex = editorState.quiz.elements.findIndex(el => el.id === overId);
    
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      actions.moveElement(activeIndex, overIndex);
    }
  }, [actions, editorState.quiz.elements]);

  const handleElementSelect = useCallback((elementId: string) => {
    actions.selectElement(elementId);
  }, [actions]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<QuizElement>) => {
    actions.updateElement(elementId, updates);
  }, [actions]);

  const handleElementDelete = useCallback((elementId: string) => {
    actions.removeElement(elementId);
  }, [actions]);

  const handleElementDuplicate = useCallback((elementId: string) => {
    actions.duplicateElement(elementId);
  }, [actions]);

  // Load quiz if quizId is provided
  React.useEffect(() => {
    if (quizId) {
      actions.loadQuiz(quizId);
    }
  }, [quizId, actions]);

  if (editorState.previewMode) {
    return (
      <div className={cn('h-screen bg-gray-50', className)}>
        <Preview
          quiz={editorState.quiz}
          onExitPreview={() => actions.togglePreview()}
        />
      </div>
    );
  }

  return (
    <div className={cn('h-screen bg-gray-50 flex flex-col', className)}>
      <Toolbar
        quiz={editorState.quiz}
        canUndo={editorState.history.past.length > 0}
        canRedo={editorState.history.future.length > 0}
        onUndo={actions.undo}
        onRedo={actions.redo}
        onSave={actions.saveQuiz}
        onPreview={actions.togglePreview}
        onSettingsUpdate={actions.updateQuizSettings}
      />

      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Sidebar
            elements={editorState.quiz.elements}
            onElementAdd={actions.addElement}
          />

          <div className="flex-1 flex flex-col">
            <SortableContext 
              items={editorState.quiz.elements.map(el => el.id)}
              strategy={verticalListSortingStrategy}
            >
              <Canvas
                elements={editorState.quiz.elements}
                selectedElement={editorState.selectedElement}
                onElementSelect={handleElementSelect}
                onElementUpdate={handleElementUpdate}
                onElementDelete={handleElementDelete}
                onElementDuplicate={handleElementDuplicate}
                isDragging={editorState.isDragging}
                quizSettings={editorState.quiz.settings}
              />
            </SortableContext>
          </div>

          <PropertiesPanel
            selectedElement={editorState.selectedElement}
            elements={editorState.quiz.elements}
            quizSettings={editorState.quiz.settings}
            onElementUpdate={handleElementUpdate}
            onSettingsUpdate={actions.updateQuizSettings}
          />

          <DragOverlay>
            {activeId && draggedElement ? (
              <DraggableElement
                element={draggedElement}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
                onDuplicate={() => {}}
                isDragging={true}
                quizSettings={editorState.quiz.settings}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};