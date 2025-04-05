// src/components/layout/Navbar.tsx
// --- START COMPLETE FILE ---
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
    const buttonBaseClasses = "p-2 rounded hover:bg-[var(--border-color)] transition-colors flex items-center space-x-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--primary-bg)] focus:ring-[var(--accent)]";
    const buttonActiveClasses = "bg-[var(--accent)] text-white hover:bg-opacity-90"; // Use accent for active
    const buttonInactiveClasses = "bg-[var(--secondary-bg)] text-[var(--text-primary)] hover:bg-[var(--border-color)]"; // Standard inactive look

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
                    <div className="flex items-center space-x-1 bg-[var(--primary-bg)] p-1 rounded-md shadow-sm">
                        <button
                            onClick={() => onModeChange('sideBySide')}
                            className={`${buttonBaseClasses} ${editMode === 'sideBySide' ? buttonActiveClasses : buttonInactiveClasses}`}
                            aria-pressed={editMode === 'sideBySide'}
                            title="Side-by-Side Mode"
                        >
                            <PanelLeft size={16} />
                             <span className={`ml-1 hidden sm:inline ${editMode === 'sideBySide' ? 'font-semibold' : ''}`}>Split</span>
                        </button>
                        <button
                            onClick={() => onModeChange('guided')}
                            className={`${buttonBaseClasses} ${editMode === 'guided' ? buttonActiveClasses : buttonInactiveClasses}`}
                            aria-pressed={editMode === 'guided'}
                            title="Guided Mode"
                        >
                            <SquareStack size={16} />
                             <span className={`ml-1 hidden sm:inline ${editMode === 'guided' ? 'font-semibold' : ''}`}>Guided</span>
                        </button>
                    </div>

                    {/* Other Controls/Icons */}
                    <BinauralBeatPlayer />
                    {/* <Timer className="w-5 h-5 cursor-not-allowed opacity-50" title="Timer (Future)" /> */}
                    {/* <Trophy className="w-5 h-5 cursor-not-allowed opacity-50" title="Achievements (Future)" /> */}
                    {/* <BarChart2 className="w-5 h-5 cursor-not-allowed opacity-50" title="Stats (Future)" /> */}
                </div>
            </div>
        </nav>
    );
}
// --- END COMPLETE FILE ---

// ??// src/components/layout/Navbar.tsx (Updated with Mode Switch)
// import React from 'react';
// import { Terminal, Code2, Timer, Trophy, BarChart2, PanelLeft, SquareStack } from 'lucide-react';
// import { BinauralBeatPlayer } from '../audio/BinauralBeatPlayer';
// import { EditorMode } from '../../types'; // Import EditorMode

// interface NavbarProps {
//     editMode: EditorMode;
//     onModeChange: (mode: EditorMode) => void;
// }

// /**
//  * Renders the top navigation bar for Code-Zen.
//  * Displays logo, mode switcher, and other icons.
//  */
// export function Navbar({ editMode, onModeChange }: NavbarProps) {
//     const buttonBaseClasses = "p-2 rounded hover:bg-[var(--border-color)] transition-colors flex items-center space-x-1 text-sm";
//     const buttonActiveClasses = "bg-[var(--accent)] text-white hover:bg-[var(--accent)]";
//     const buttonInactiveClasses = "bg-[var(--secondary-bg)] text-[var(--text-primary)]";

//     return (
//         <nav className="bg-[var(--secondary-bg)] p-4 border-b border-[var(--border-color)]">
//             <div className="container mx-auto flex items-center justify-between">
//                 {/* Logo Section */}
//                 <div className="flex items-center space-x-2">
//                     <Terminal className="w-6 h-6 text-[var(--accent)]" />
//                     <span className="text-xl font-bold text-[var(--text-secondary)]">
//                         CoDe-ZeN {' {'}
//                     </span>
//                     <Code2 className="w-5 h-5 text-[var(--accent)]" />
//                     <span className="text-xl font-bold text-[var(--text-secondary)]">
//                         {' }'}
//                     </span>
//                 </div>

//                 {/* Right-side Icons & Controls */}
//                 <div className="flex items-center space-x-4 text-[var(--text-primary)]">

//                     {/* Editor Mode Switch */}
//                     <div className="flex items-center space-x-1 bg-[var(--primary-bg)] p-1 rounded">
//                         <button
//                             onClick={() => onModeChange('sideBySide')}
//                             className={`${buttonBaseClasses} ${editMode === 'sideBySide' ? buttonActiveClasses : buttonInactiveClasses}`}
//                             aria-pressed={editMode === 'sideBySide'}
//                             title="Side-by-Side Mode"
//                         >
//                             <PanelLeft size={16} />
//                             {/* <span>Side-by-Side</span> */}
//                         </button>
//                         <button
//                             onClick={() => onModeChange('guided')}
//                             className={`${buttonBaseClasses} ${editMode === 'guided' ? buttonActiveClasses : buttonInactiveClasses}`}
//                             aria-pressed={editMode === 'guided'}
//                             title="Guided Mode"
//                         >
//                             <SquareStack size={16} />
//                             {/* <span>Guided</span> */}
//                         </button>
//                     </div>

//                     {/* Other Controls/Icons */}
//                     <BinauralBeatPlayer />
//                     <Timer className="w-5 h-5" title="Timer (Future)" />
//                     <Trophy className="w-5 h-5" title="Achievements (Future)" />
//                     <BarChart2 className="w-5 h-5" title="Stats (Future)" />
//                 </div>
//             </div>
//         </nav>
//     );
// }