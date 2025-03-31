// src/components/modals/AddSnippetModal.tsx (New File)
import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { SnippetFolder, CustomSnippet } from '../../types';
import { languageMap, SupportedLanguage } from '../../constants/editor';

interface AddSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSnippet: (snippet: Omit<CustomSnippet, 'id'>) => void;
  folders: SnippetFolder[];
  availableLanguages: SupportedLanguage[];
}

const initialState: Omit<CustomSnippet, 'id'> = {
    name: '',
    language: 'javascript',
    code: '',
    folderId: ''
};

export function AddSnippetModal({
  isOpen,
  onClose,
  onAddSnippet,
  folders,
  availableLanguages,
}: AddSnippetModalProps) {
  const [newSnippet, setNewSnippet] = useState(initialState);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     if (isOpen) {
       // Focus name input when modal opens
       setTimeout(() => nameInputRef.current?.focus(), 100);
     } else {
       setNewSnippet(initialState); // Reset on close
     }
  }, [isOpen]);

  const handleAddClick = () => {
    if (newSnippet.name.trim() && newSnippet.code.trim()) {
      onAddSnippet({
          ...newSnippet,
          name: newSnippet.name.trim(),
          // Ensure folderId is either a string or undefined, not ""
          folderId: newSnippet.folderId || undefined
      });
      // No need to call onClose here, parent handles it
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow modal interaction without closing on Escape inside CodeMirror
    if (event.key === 'Escape' && !(event.target instanceof HTMLTextAreaElement)) {
        onClose();
    }
  };

  if (!isOpen) return null;

  const currentLanguageExtension = languageMap[newSnippet.language as SupportedLanguage] || languageMap.javascript;

  return (
    <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-snippet-title"
    >
      {/* Prevent modal close when clicking inside the content */}
      <div className="bg-[var(--secondary-bg)] p-6 rounded-lg w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="add-snippet-title" className="text-xl font-bold mb-4">Add Custom Snippet</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="snippet-name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="snippet-name"
              ref={nameInputRef}
              type="text"
              value={newSnippet.name}
              onChange={(e) => setNewSnippet({ ...newSnippet, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--primary-bg)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="snippet-language" className="block text-sm font-medium mb-1">Language</label>
            <select
              id="snippet-language"
              value={newSnippet.language}
              onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value as SupportedLanguage })}
              className="w-full px-3 py-2 bg-[var(--primary-bg)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent)]"
            >
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="snippet-folder" className="block text-sm font-medium mb-1">Folder (Optional)</label>
            <select
              id="snippet-folder"
              value={newSnippet.folderId}
              onChange={(e) => setNewSnippet({ ...newSnippet, folderId: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--primary-bg)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">No Folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="snippet-code" className="block text-sm font-medium mb-1">Code</label>
            <CodeMirror
              id="snippet-code" // Use id for label association
              value={newSnippet.code}
              height="200px"
              theme={tokyoNight}
              extensions={[currentLanguageExtension]}
              onChange={(value) => setNewSnippet({ ...newSnippet, code: value })}
              className="border border-[var(--border-color)] rounded"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded hover:bg-[var(--border-color)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddClick}
              disabled={!newSnippet.name.trim() || !newSnippet.code.trim()}
              className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Snippet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}