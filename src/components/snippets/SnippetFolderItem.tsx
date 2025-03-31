// src/components/snippets/SnippetFolderItem.tsx (New File)
import React from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { CustomSnippet, SnippetFolder } from '../../types';
import { SnippetFileItem } from './SnippetFileItem';

interface SnippetFolderItemProps {
  folder: SnippetFolder;
  snippets: CustomSnippet[];
  onToggleFolder: (folderId: string) => void;
  onSelectSnippet: (snippetId: string, language: string) => void;
  onDeleteSnippet: (snippetId: string) => void;
}

export function SnippetFolderItem({
  folder,
  snippets,
  onToggleFolder,
  onSelectSnippet,
  onDeleteSnippet,
}: SnippetFolderItemProps) {
  const snippetsInFolder = snippets.filter(snippet => snippet.folderId === folder.id);

  return (
    <div key={folder.id} className="snippet-folder">
      <div
        className="snippet-folder-header"
        onClick={() => onToggleFolder(folder.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleFolder(folder.id)}
        aria-expanded={folder.isOpen}
      >
        {folder.isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
        <Folder className="w-4 h-4 flex-shrink-0" />
        <span className="truncate" title={folder.name}>{folder.name}</span>
      </div>
      {folder.isOpen && (
        <div className="ml-6">
          {snippetsInFolder.length > 0 ? (
             snippetsInFolder.map(snippet => (
                <SnippetFileItem
                  key={snippet.id}
                  snippet={snippet}
                  onSelectSnippet={onSelectSnippet}
                  onDeleteSnippet={onDeleteSnippet}
                />
              ))
          ) : (
            <div className="text-xs text-gray-500 italic pl-6 py-1">Empty folder</div>
          )
        }
        </div>
      )}
    </div>
  );
}