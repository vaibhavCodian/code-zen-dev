// src/App.tsx (Verify Parent Layout - No changes needed if already correct)
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
    const [typedCode, setTypedCode] = useState('');
    const [customSnippets, setCustomSnippets] = useState<CustomSnippet[]>(() =>
        loadFromLocalStorage('customSnippets', [])
    );
    const [folders, setFolders] = useState<SnippetFolder[]>(() =>
        loadFromLocalStorage('snippetFolders', [])
    );
    const [isAddingSnippet, setIsAddingSnippet] = useState(false);
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<EditorMode>('sideBySide');

    const { leftWidth, containerRef, dividerRef } = useResizablePanels(50, 20, 80);

    useEffect(() => {
        localStorage.setItem('customSnippets', JSON.stringify(customSnippets));
    }, [customSnippets]);

    useEffect(() => {
        localStorage.setItem('snippetFolders', JSON.stringify(folders));
    }, [folders]);

    const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
        setLanguage(lang);
        setTypedCode('');
        setCurrentSnippetId(null);
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
    }, []);

    const handleDeleteSnippet = useCallback((id: string) => {
        setCustomSnippets(prevSnippets => prevSnippets.filter(snippet => snippet.id !== id));
        if (currentSnippetId === id) {
            setCurrentSnippetId(null);
            setLanguage('javascript');
            setTypedCode('');
        }
    }, [currentSnippetId]);

    const handleSelectSnippet = useCallback((snippetId: string, snippetLanguage: string) => {
        if (availableLanguages.includes(snippetLanguage as SupportedLanguage)) {
           setCurrentSnippetId(snippetId);
           setLanguage(snippetLanguage as SupportedLanguage);
           setTypedCode('');
        } else {
            console.error(`Attempted to select snippet with unsupported language: ${snippetLanguage}`);
            setCurrentSnippetId(null);
            setLanguage('javascript');
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

    const handleTypedCodeChange = useCallback((value: string) => {
        setTypedCode(value);
    }, []);

    const handleModeChange = useCallback((newMode: EditorMode) => {
        setEditMode(newMode);
    }, []);

    const getCurrentCode = (): string => {
        if (currentSnippetId) {
            const snippet = customSnippets.find(s => s.id === currentSnippetId);
            return snippet ? snippet.code : `// Error: Snippet ID ${currentSnippetId} not found.`;
        }
        return sampleCode[language] || sampleCode.javascript;
    };

    return (
        <div className={`
            min-h-screen bg-[var(--primary-bg)] text-[var(--text-primary)]
            ${isFullscreen
                ? 'fixed inset-0 z-50 flex flex-col p-0 m-0 overflow-hidden'
                : 'flex flex-col'
            }
        `}>
            {!isFullscreen && (
                <Navbar
                    editMode={editMode}
                    onModeChange={handleModeChange}
                />
            )}

            <main className={`
                ${isFullscreen
                    ? 'flex-grow flex flex-col' // Fullscreen takes all space
                    : 'container mx-auto px-4 py-8 flex flex-col flex-grow' // Standard layout grows
                }
             `}>
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

                {/* This div MUST allow EditorLayout to grow and provide relative context */}
                <div className="flex-grow relative"> {/* Ensures EditorLayout takes remaining space */}
                    <EditorLayout
                        editMode={editMode}
                        typedCode={typedCode}
                        currentCode={getCurrentCode()}
                        language={language}
                        leftWidth={leftWidth}
                        containerRef={containerRef}
                        dividerRef={dividerRef}
                        isFullscreen={isFullscreen}
                        onTypedCodeChange={handleTypedCodeChange}
                        onToggleFullscreen={handleToggleFullscreen}
                    />
                </div>
            </main>

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