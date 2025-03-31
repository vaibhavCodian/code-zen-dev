// src/components/snippets/SnippetTree.tsx (New File)

import { CustomSnippet, SnippetFolder } from '../../types';
import { SnippetFolderItem } from './SnippetFolderItem';
import { SnippetFileItem } from './SnippetFileItem';

interface SnippetTreeProps {
  folders: SnippetFolder[];
  customSnippets: CustomSnippet[];
  onToggleFolder: (folderId: string) => void;
  onSelectSnippet: (snippetId: string, language: string) => void;
  onDeleteSnippet: (snippetId: string) => void;
}

export function SnippetTree({
  folders,
  customSnippets,
  onToggleFolder,
  onSelectSnippet,
  onDeleteSnippet,
}: SnippetTreeProps) {
  const rootSnippets = customSnippets.filter(snippet => !snippet.folderId);

  return (
    <div className="mb-6">
      <div className="snippet-tree custom-scrollbar overflow-auto max-h-60">
        {folders.map(folder => (
          <SnippetFolderItem
            key={folder.id}
            folder={folder}
            snippets={customSnippets}
            onToggleFolder={onToggleFolder}
            onSelectSnippet={onSelectSnippet}
            onDeleteSnippet={onDeleteSnippet}
          />
        ))}
        {rootSnippets.map(snippet => (
          <SnippetFileItem
            key={snippet.id}
            snippet={snippet}
            onSelectSnippet={onSelectSnippet}
            onDeleteSnippet={onDeleteSnippet}
          />
        ))}
         {folders.length === 0 && rootSnippets.length === 0 && (
            <div className="text-sm text-gray-500 italic p-2">No snippets or folders added yet.</div>
         )}
      </div>
    </div>
  );
}