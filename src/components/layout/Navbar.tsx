// src/components/layout/Navbar.tsx (Updated with Mode Switch)
import React from 'react';
import { Terminal, Code2, Timer, Trophy, BarChart2, PanelLeft, SquareStack } from 'lucide-react';
import { BinauralBeatPlayer } from '../audio/BinauralBeatPlayer';
import { EditorMode } from '../../types'; // Import EditorMode

interface NavbarProps {
    editMode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
}

/**
 * Renders the top navigation bar for Code-Zen.
 * Displays logo, mode switcher, and other icons.
 */
export function Navbar({ editMode, onModeChange }: NavbarProps) {
    const buttonBaseClasses = "p-2 rounded hover:bg-[var(--border-color)] transition-colors flex items-center space-x-1 text-sm";
    const buttonActiveClasses = "bg-[var(--accent)] text-white hover:bg-[var(--accent)]";
    const buttonInactiveClasses = "bg-[var(--secondary-bg)] text-[var(--text-primary)]";

    return (
        <nav className="bg-[var(--secondary-bg)] p-4 border-b border-[var(--border-color)]">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center space-x-2">
                    <Terminal className="w-6 h-6 text-[var(--accent)]" />
                    <span className="text-xl font-bold text-[var(--text-secondary)]">
                        CoDe-ZeN {' {'}
                    </span>
                    <Code2 className="w-5 h-5 text-[var(--accent)]" />
                    <span className="text-xl font-bold text-[var(--text-secondary)]">
                        {' }'}
                    </span>
                </div>

                {/* Right-side Icons & Controls */}
                <div className="flex items-center space-x-4 text-[var(--text-primary)]">

                    {/* Editor Mode Switch */}
                    <div className="flex items-center space-x-1 bg-[var(--primary-bg)] p-1 rounded">
                        <button
                            onClick={() => onModeChange('sideBySide')}
                            className={`${buttonBaseClasses} ${editMode === 'sideBySide' ? buttonActiveClasses : buttonInactiveClasses}`}
                            aria-pressed={editMode === 'sideBySide'}
                            title="Side-by-Side Mode"
                        >
                            <PanelLeft size={16} />
                            {/* <span>Side-by-Side</span> */}
                        </button>
                        <button
                            onClick={() => onModeChange('guided')}
                            className={`${buttonBaseClasses} ${editMode === 'guided' ? buttonActiveClasses : buttonInactiveClasses}`}
                            aria-pressed={editMode === 'guided'}
                            title="Guided Mode"
                        >
                            <SquareStack size={16} />
                            {/* <span>Guided</span> */}
                        </button>
                    </div>

                    {/* Other Controls/Icons */}
                    <BinauralBeatPlayer />
                    <Timer className="w-5 h-5" title="Timer (Future)" />
                    <Trophy className="w-5 h-5" title="Achievements (Future)" />
                    <BarChart2 className="w-5 h-5" title="Stats (Future)" />
                </div>
            </div>
        </nav>
    );
}