// src/App.tsx
// --- START COMPLETE FILE ---
import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { LanguageSelector } from './components/editor/LanguageSelector';
import { ActionBar } from './components/layout/ActionBar';
import { SnippetTree } from './components/snippets/SnippetTree';
import { EditorLayout } from './components/editor/EditorLayout';
import { AddFolderModal } from './components/modals/AddFolderModal';
import { AddSnippetModal } from './components/modals/AddSnippetModal';
import { useResizablePanels } from './hooks/useResizablePanels';
import { CustomSnippet, SnippetFolder, EditorMode } from './types';
import { sampleCode, languageMap, SupportedLanguage } from './constants/editor';

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        localStorage.removeItem(key);
        return defaultValue;
    }
};

const availableLanguages = Object.keys(languageMap) as SupportedLanguage[];

function App() {
    const [language, setLanguage] = useState<SupportedLanguage>('javascript');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [typedCode, setTypedCode] = useState(''); // Used only for sideBySide mode
    const [customSnippets, setCustomSnippets] = useState<CustomSnippet[]>(() =>
        loadFromLocalStorage('customSnippets', [])
    );
    const [folders, setFolders] = useState<SnippetFolder[]>(() =>
        loadFromLocalStorage('snippetFolders', [])
    );
    const [isAddingSnippet, setIsAddingSnippet] = useState(false);
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<EditorMode>('sideBySide'); // Default to sideBySide

    const { leftWidth, containerRef, dividerRef } = useResizablePanels(50, 20, 80);

    useEffect(() => {
        localStorage.setItem('customSnippets', JSON.stringify(customSnippets));
    }, [customSnippets]);

    useEffect(() => {
        localStorage.setItem('snippetFolders', JSON.stringify(folders));
    }, [folders]);

    const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
        setLanguage(lang);
        setTypedCode(''); // Reset typed code when language changes
        setCurrentSnippetId(null); // Deselect custom snippet if language is manually changed
    }, []);

    const handleAddFolder = useCallback((folderName: string) => {
        const newFolder: SnippetFolder = {
            id: `folder-${Date.now()}-${Math.random()}`,
            name: folderName.trim(),
            isOpen: true
        };
        setFolders(prevFolders => [...prevFolders, newFolder]);
        setIsAddingFolder(false);
    }, []);

    const handleAddSnippet = useCallback((newSnippetData: Omit<CustomSnippet, 'id'>) => {
        const newSnippet: CustomSnippet = {
            id: `snippet-${Date.now()}-${Math.random()}`,
            ...newSnippetData,
            name: newSnippetData.name.trim(),
            folderId: newSnippetData.folderId || undefined
        };
        setCustomSnippets(prevSnippets => [...prevSnippets, newSnippet]);
        setIsAddingSnippet(false);
        // Optionally select the newly added snippet
        setCurrentSnippetId(newSnippet.id);
        setLanguage(newSnippet.language as SupportedLanguage);
        setTypedCode(''); // Reset for the new snippet
    }, []);

    const handleDeleteSnippet = useCallback((id: string) => {
        setCustomSnippets(prevSnippets => prevSnippets.filter(snippet => snippet.id !== id));
        if (currentSnippetId === id) {
            setCurrentSnippetId(null);
            setLanguage('javascript'); // Revert to default or last used language? Default for now.
            setTypedCode('');
        }
    }, [currentSnippetId]);

    const handleSelectSnippet = useCallback((snippetId: string, snippetLanguage: string) => {
        if (availableLanguages.includes(snippetLanguage as SupportedLanguage)) {
           setCurrentSnippetId(snippetId);
           setLanguage(snippetLanguage as SupportedLanguage);
           setTypedCode(''); // Reset typed code when selecting a snippet
        } else {
            console.error(`Attempted to select snippet with unsupported language: ${snippetLanguage}`);
            // Handle fallback - maybe show an error message?
            setCurrentSnippetId(null);
            setLanguage('javascript'); // Revert to default
            setTypedCode('');
        }
    }, []);

    const toggleFolder = useCallback((folderId: string) => {
        setFolders(prevFolders =>
            prevFolders.map(folder =>
                folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder
            )
        );
    }, []);

    const handleToggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    // Only updates side-by-side typed code
    const handleTypedCodeChange = useCallback((value: string) => {
        if (editMode === 'sideBySide') {
           setTypedCode(value);
        }
    }, [editMode]);

    // Handles mode switching
    const handleModeChange = useCallback((newMode: EditorMode) => {
        setEditMode(newMode);
        // Optionally reset typedCode when switching away from sideBySide
        // if (newMode !== 'sideBySide') {
        //     setTypedCode('');
        // }
    }, []);

    const getCurrentCode = (): string => {
        if (currentSnippetId) {
            const snippet = customSnippets.find(s => s.id === currentSnippetId);
            // Provide a default empty string if snippet not found, prevents crashes
            return snippet ? snippet.code : `// Error: Snippet ID ${currentSnippetId} not found.`;
        }
        // Provide a default empty string if language sample not found
        return sampleCode[language] || sampleCode.javascript || '';
    };

    // Add/remove fullscreen class from body for global styling hooks
     useEffect(() => {
         if (isFullscreen) {
             document.body.classList.add('app-fullscreen');
         } else {
             document.body.classList.remove('app-fullscreen');
         }
         // Cleanup function to remove the class if the component unmounts while fullscreen
         return () => {
             document.body.classList.remove('app-fullscreen');
         };
     }, [isFullscreen]);


    return (
        // Use template literal for conditional class on the main div as well
        <div className={`
            min-h-screen bg-[var(--primary-bg)] text-[var(--text-primary)]
            ${isFullscreen
                ? 'fixed inset-0 z-50 flex flex-col p-0 m-0 overflow-hidden'
                : 'flex flex-col'
            }
        `}>
            {/* Navbar: Always show unless fullscreen? Or maybe hide specific parts? For now, always show when not fullscreen. */}
            {!isFullscreen && (
                <Navbar
                    editMode={editMode}
                    onModeChange={handleModeChange}
                />
            )}

            <main className={`
                ${isFullscreen
                    ? 'flex-grow flex flex-col h-full' // Ensure main takes full height in fullscreen
                    : 'container mx-auto px-4 py-8 flex flex-col flex-grow' // Standard layout grows
                }
             `}>
                {/* Controls Area: Hide when fullscreen */}
                {!isFullscreen && (
                    <>
                        <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                            <LanguageSelector
                                currentLanguage={language}
                                currentSnippetId={currentSnippetId}
                                onLanguageChange={handleLanguageChange}
                            />
                            <ActionBar
                                onAddFolderClick={() => setIsAddingFolder(true)}
                                onAddSnippetClick={() => setIsAddingSnippet(true)}
                            />
                        </div>
                        <SnippetTree
                            folders={folders}
                            customSnippets={customSnippets}
                            onToggleFolder={toggleFolder}
                            onSelectSnippet={handleSelectSnippet}
                            onDeleteSnippet={handleDeleteSnippet}
                        />
                    </>
                )}

                {/* Editor Layout Area - Make it grow */}
                <div className="flex-grow relative flex flex-col min-h-0"> {/* Added min-h-0 for flex-grow fix */}
                    <EditorLayout
                        editMode={editMode}
                        typedCode={typedCode} // Only used by sideBySide
                        currentCode={getCurrentCode()} // Used by both modes
                        language={language}
                        leftWidth={leftWidth} // Only used by sideBySide
                        containerRef={containerRef} // Only used by sideBySide
                        dividerRef={dividerRef} // Only used by sideBySide
                        isFullscreen={isFullscreen}
                        onTypedCodeChange={handleTypedCodeChange} // Only relevant for sideBySide
                        onToggleFullscreen={handleToggleFullscreen}
                    />
                </div>
            </main>

            {/* Modals */}
            <AddFolderModal
                isOpen={isAddingFolder}
                onClose={() => setIsAddingFolder(false)}
                onAddFolder={handleAddFolder}
            />

            <AddSnippetModal
                isOpen={isAddingSnippet}
                onClose={() => setIsAddingSnippet(false)}
                onAddSnippet={handleAddSnippet}
                folders={folders}
                availableLanguages={availableLanguages}
            />
        </div>
    );
}

export default App;
// --- END COMPLETE FILE ---