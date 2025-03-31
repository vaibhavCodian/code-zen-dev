// src/components/snippets/SnippetFileItem.tsx (New File)

import { FileCode, X } from 'lucide-react';
import { CustomSnippet } from '../../types';

interface SnippetFileItemProps {
  snippet: CustomSnippet;
  onSelectSnippet: (snippetId: string, language: string) => void;
  onDeleteSnippet: (snippetId: string) => void;
}

export function SnippetFileItem({ snippet, onSelectSnippet, onDeleteSnippet }: SnippetFileItemProps) {
  return (
    <div
      key={snippet.id}
      className="flex items-center space-x-2 py-1"
    >
      <FileCode className="w-4 h-4 flex-shrink-0" />
      <button
        onClick={() => onSelectSnippet(snippet.id, snippet.language)}
        className="text-sm hover:text-[var(--accent)] text-left truncate flex-grow"
        title={snippet.name}
      >
        {snippet.name}
      </button>
      <button
        onClick={() => onDeleteSnippet(snippet.id)}
        className="hover:text-red-500 flex-shrink-0"
        aria-label={`Delete snippet ${snippet.name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}