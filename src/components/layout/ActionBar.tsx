// src/components/layout/ActionBar.tsx (New File)

import { Folder, Plus } from 'lucide-react';

interface ActionBarProps {
  onAddFolderClick: () => void;
  onAddSnippetClick: () => void;
}

export function ActionBar({ onAddFolderClick, onAddSnippetClick }: ActionBarProps) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={onAddFolderClick}
        className="px-4 py-2 rounded bg-[var(--secondary-bg)] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors flex items-center space-x-2"
      >
        <Folder className="w-4 h-4" />
        <span>New Folder</span>
      </button>
      <button
        onClick={onAddSnippetClick}
        className="px-4 py-2 rounded bg-[var(--secondary-bg)] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add Snippet</span>
      </button>
    </div>
  );
}