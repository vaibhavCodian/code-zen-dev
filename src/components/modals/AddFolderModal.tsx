// src/components/modals/AddFolderModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface AddFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFolder: (folderName: string) => void;
}

export function AddFolderModal({ isOpen, onClose, onAddFolder }: AddFolderModalProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Timeout needed to allow modal transition/rendering
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setNewFolderName(''); // Reset on close
    }
  }, [isOpen]);


  const handleAddClick = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      // No need to call onClose here, parent should handle it after adding
    }
  };

   const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
     if (event.key === 'Enter') {
       handleAddClick();
     } else if (event.key === 'Escape') {
        onClose();
     }
   };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="add-folder-title">
      {/* Prevent modal close when clicking inside the content */}
      <div className="bg-[var(--secondary-bg)] p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 id="add-folder-title" className="text-xl font-bold mb-4">New Folder</h2>
        <input
          ref={inputRef}
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Folder name"
          className="w-full px-3 py-2 bg-[var(--primary-bg)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent)] mb-4"
          aria-label="New folder name"
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded hover:bg-[var(--border-color)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddClick}
            disabled={!newFolderName.trim()}
            className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}