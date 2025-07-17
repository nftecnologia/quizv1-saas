import React, { useState } from 'react';
import { Quiz } from '../../types/editor';
import { cn } from '../../lib/utils';
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Settings, 
  Smartphone, 
  Tablet, 
  Monitor,
  Palette,
  Play,
  Download,
  Upload,
  Share2
} from 'lucide-react';

interface ToolbarProps {
  quiz: Quiz;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  onSettingsUpdate: (updates: Partial<Quiz['settings']>) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  quiz,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onSettingsUpdate,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(quiz, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${quiz.title || 'quiz'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedQuiz = JSON.parse(e.target?.result as string);
          // Here you would typically load the imported quiz
          console.log('Imported quiz:', importedQuiz);
        } catch (error) {
          console.error('Error importing quiz:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: quiz.title,
          text: quiz.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => onSettingsUpdate({ 
                primaryColor: quiz.settings.primaryColor,
                secondaryColor: quiz.settings.secondaryColor,
                fontFamily: quiz.settings.fontFamily,
                theme: quiz.settings.theme,
                showProgressBar: quiz.settings.showProgressBar,
                allowBackNavigation: quiz.settings.allowBackNavigation,
                autoSave: quiz.settings.autoSave,
                responsive: quiz.settings.responsive,
                customCSS: quiz.settings.customCSS,
              })}
              className="text-lg font-medium bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
              placeholder="Título do Quiz"
            />
            <div className="text-sm text-gray-500">
              {quiz.elements.length} elementos
            </div>
          </div>
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'p-2 rounded-md transition-colors',
              canUndo
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            )}
            title="Desfazer"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              'p-2 rounded-md transition-colors',
              canRedo
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            )}
            title="Refazer"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300" />

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            title="Exportar"
          >
            <Download className="w-4 h-4" />
          </button>

          <label className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer" title="Importar">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleShare}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
              isSaving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>

          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Configurações do Quiz</h3>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Tema
              </label>
              <select
                value={quiz.settings.theme}
                onChange={(e) => onSettingsUpdate({ theme: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Cor Primária
              </label>
              <input
                type="color"
                value={quiz.settings.primaryColor}
                onChange={(e) => onSettingsUpdate({ primaryColor: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Cor Secundária
              </label>
              <input
                type="color"
                value={quiz.settings.secondaryColor}
                onChange={(e) => onSettingsUpdate({ secondaryColor: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Fonte
              </label>
              <select
                value={quiz.settings.fontFamily}
                onChange={(e) => onSettingsUpdate({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quiz.settings.showProgressBar}
                onChange={(e) => onSettingsUpdate({ showProgressBar: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Barra de Progresso</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quiz.settings.allowBackNavigation}
                onChange={(e) => onSettingsUpdate({ allowBackNavigation: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Navegação Anterior</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quiz.settings.autoSave}
                onChange={(e) => onSettingsUpdate({ autoSave: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Auto-salvar</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quiz.settings.responsive}
                onChange={(e) => onSettingsUpdate({ responsive: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-700">Responsivo</span>
            </label>
          </div>

          {quiz.settings.customCSS !== undefined && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                CSS Personalizado
              </label>
              <textarea
                value={quiz.settings.customCSS}
                onChange={(e) => onSettingsUpdate({ customCSS: e.target.value })}
                placeholder="/* CSS personalizado aqui */"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
                rows={3}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};