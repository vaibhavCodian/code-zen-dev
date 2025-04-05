export interface CustomSnippet {
    id: string;
    name: string;
    language: string;
    code: string;
    folderId?: string;
}

export interface SnippetFolder {
    id: string;
    name: string;
    isOpen: boolean;
}

// EDITOR MODE
export type EditorMode = 'sideBySide' | 'guided';