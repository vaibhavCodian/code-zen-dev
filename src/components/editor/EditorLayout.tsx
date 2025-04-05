// src/components/editor/EditorLayout.tsx
// --- START COMPLETE FILE ---
import React, { RefObject, useMemo, useState, useEffect, useCallback } from 'react';
import CodeMirror, { EditorView, ViewUpdate, Decoration, DecorationSet } from '@uiw/react-codemirror';
import { EditorState, Extension, StateField, StateEffect, Prec } from '@codemirror/state';
import { keymap, ViewPlugin } from '@codemirror/view';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
// Import language-related tools
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'; // Use defaultHighlightStyle
import { Expand, Minimize } from 'lucide-react';
import { languageMap, SupportedLanguage } from '../../constants/editor';
import { EditorMode } from '../../types';

// --- Decoration Setup --- (Unchanged)
const revealedMark = Decoration.mark({ class: 'guided-revealed-text' });
const incorrectMark = Decoration.mark({ class: 'guided-incorrect-text' });

// --- State Effects --- (Unchanged)
const revealCharacter = StateEffect.define<{ from: number; to: number }>();
const addIncorrectMark = StateEffect.define<{ from: number; to: number }>();
const clearMark = StateEffect.define<{ from: number; to: number }>();
const resetAllGuidedDecorations = StateEffect.define<null>();

// --- State Field for Guided Mode Decorations --- (Unchanged)
const guidedDecorationState = StateField.define<DecorationSet>({
    create() { return Decoration.none; },
    update(decoSet, tr) {
        let newDecoSet = decoSet.map(tr.changes);
        for (const e of tr.effects) {
            if (e.is(revealCharacter)) {
                newDecoSet = newDecoSet.update({ filterFrom: e.value.from, filterTo: e.value.to, filter: (f, t, deco) => deco.spec.class !== 'guided-incorrect-text' });
                if (e.value.from < e.value.to) { newDecoSet = newDecoSet.update({ add: [revealedMark.range(e.value.from, e.value.to)], sort: true }); }
            } else if (e.is(addIncorrectMark)) {
                newDecoSet = newDecoSet.update({ filterFrom: e.value.from, filterTo: e.value.to, filter: (f, t, deco) => deco.spec.class !== 'guided-revealed-text' });
                if (e.value.from < e.value.to) { newDecoSet = newDecoSet.update({ add: [incorrectMark.range(e.value.from, e.value.to)], sort: true }); }
            } else if (e.is(clearMark)) {
                 newDecoSet = newDecoSet.update({ filterFrom: e.value.from, filterTo: e.value.to, filter: (f, t, deco) => !(f >= e.value.from && t <= e.value.to && (deco.spec.class === 'guided-revealed-text' || deco.spec.class === 'guided-incorrect-text')) });
            } else if (e.is(resetAllGuidedDecorations)) {
                newDecoSet = Decoration.none;
            }
        }
        return newDecoSet;
    },
    provide: f => EditorView.decorations.from(f)
});

// --- Plugin to force cursor position --- (Unchanged)
const forceCursorPosition = (getProgress: () => number) => ViewPlugin.fromClass(class {
    update(update: ViewUpdate) {
        if (update.view.hasFocus && (update.docChanged || update.selectionSet)) {
            const currentProgress = getProgress();
             if (update.state.selection.main.anchor !== currentProgress) {
                 // Use requestAnimationFrame to avoid conflicts with other state updates
                 requestAnimationFrame(() => {
                    if (update.view.hasFocus && !update.view.isDestroyed) {
                         try {
                             update.view.dispatch({ selection: { anchor: currentProgress }, scrollIntoView: true });
                         } catch (error) {
                            // Ignore errors that might occur if the view is destroyed mid-update
                             if (!(error instanceof RangeError) || !error.message.includes("Invalid position")) {
                                 console.error("Error dispatching cursor update:", error);
                             }
                         }
                     }
                 });
            } else if(update.selectionSet) {
                  requestAnimationFrame(() => {
                     if (update.view.hasFocus && !update.view.isDestroyed) {
                          try {
                              update.view.dispatch({ scrollIntoView: true });
                          } catch (error) {
                             // Ignore potential errors during rapid updates
                              if (!(error instanceof RangeError) || !error.message.includes("Invalid position")) {
                                  console.error("Error dispatching scrollIntoView:", error);
                              }
                          }
                      }
                 });
            }
        }
    }
});


// --- Component ---
interface EditorLayoutProps { /* ... props remain the same ... */
    editMode: EditorMode; typedCode: string; currentCode: string; language: SupportedLanguage; leftWidth: number; containerRef: RefObject<HTMLDivElement>; dividerRef: RefObject<HTMLDivElement>; isFullscreen: boolean; onTypedCodeChange: (value: string, viewUpdate?: ViewUpdate) => void; onToggleFullscreen: () => void;
}

export function EditorLayout({
    editMode, typedCode, currentCode, language, leftWidth, containerRef, dividerRef, isFullscreen, onTypedCodeChange, onToggleFullscreen,
}: EditorLayoutProps) {
    const [guidedView, setGuidedView] = useState<EditorView | null>(null);
    const [guidedProgress, setGuidedProgress] = useState(0);
    const getGuidedProgress = useCallback(() => guidedProgress, [guidedProgress]); // Use callback to ensure stable reference
    const currentLanguageExtension = useMemo(() => languageMap[language] || languageMap.javascript, [language]);

    // Base extensions used by both modes
    const baseExtensions = useMemo(() => [
        tokyoNight, // Base color theme
        EditorView.lineWrapping,
        EditorView.theme({ // Common layout styles
            '&': { height: '100%', },
            // Apply font family and size to both editor and gutters
            '&, .cm-gutters': { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem' },
            '.cm-scroller': { overflow: 'auto', height: '100%', fontFamily: 'inherit' }, // Scroller should inherit font
            '.cm-content': { caretColor: 'var(--accent)' },
        }),
        currentLanguageExtension, // Language support
        // Apply default syntax highlighting using the base theme's colors
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    ], [currentLanguageExtension]);

    // Side-by-Side Mode Extensions
    const sideBySideEditableExtensions: Extension[] = useMemo(() => [
        baseExtensions,
        EditorState.readOnly.of(false),
    ], [baseExtensions]);

    const sideBySideReadOnlyExtensions: Extension[] = useMemo(() => [
        baseExtensions,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false), // Explicitly make view non-editable
    ], [baseExtensions]);

    // Guided Mode Extensions
    const guidedSingleEditorExtensions: Extension[] = useMemo(() => [
        baseExtensions,          // Includes base theme, language, wrapping, default highlighting
        guidedDecorationState,   // Manages reveal/incorrect decoration marks
        EditorState.readOnly.of(true), // Document non-editable
        EditorView.editable.of(true),  // View receives input
        forceCursorPosition(getGuidedProgress), // Keep cursor fixed
        Prec.highest(keymap.of([ // Input handling
             // Backspace: Move progress back, clear marks at new position
             { key: 'Backspace', run: (view): boolean => {
                 if (editMode !== 'guided') return false;
                 const currentPos = guidedProgress;
                 if (currentPos > 0) {
                     const prevPos = currentPos - 1;
                     setGuidedProgress(prevPos);
                     // Clear marks in the range we are moving back TO
                     view.dispatch({
                         effects: clearMark.of({ from: prevPos, to: currentPos }),
                         selection: { anchor: prevPos }, // Move cursor first
                         scrollIntoView: true
                     });
                 }
                 return true; // We handled it
             }},
             // Prevent Delete, Arrows, Home, End, Page keys, Paste, Cut from doing anything
             // This enforces linear typing for the guided exercise
             { key: 'Delete', run: () => editMode === 'guided' },
             { key: 'ArrowLeft', run: () => editMode === 'guided' },
             { key: 'ArrowRight', run: () => editMode === 'guided' },
             { key: 'ArrowUp', run: () => editMode === 'guided' },
             { key: 'ArrowDown', run: () => editMode === 'guided' },
             { key: 'Home', run: () => editMode === 'guided' },
             { key: 'End', run: () => editMode === 'guided' },
             { key: 'PageUp', run: () => editMode === 'guided' },
             { key: 'PageDown', run: () => editMode === 'guided' },
             { key: 'Mod-v', run: () => editMode === 'guided' }, // Prevent Paste
             { key: 'Mod-x', run: () => editMode === 'guided' }, // Prevent Cut
             // Allow Select All (Cmd/Ctrl+A) for potential debugging/inspection? Maybe remove later.
             // { key: 'Mod-a', run: () => editMode === 'guided' },

             // Universal handler for printable characters and Enter
             { any: (view, event): boolean => {
                 // Only process in guided mode, ignore modifiers, allow Enter or single chars
                 if (editMode !== 'guided' || event.ctrlKey || event.metaKey || event.altKey || (event.key.length !== 1 && event.key !== 'Enter')) {
                     return false; // Let other keys (like Escape, F-keys) pass through or be ignored
                 }

                 event.preventDefault(); // We will handle the input

                 const currentPos = guidedProgress;
                 const docLength = view.state.doc.length;
                 if (currentPos >= docLength) return true; // Reached the end

                 const expectedChar = view.state.doc.sliceString(currentPos, currentPos + 1);
                 const typedChar = event.key === 'Enter' ? '\n' : event.key;
                 let effects: StateEffect<any>[] = [];
                 let progressIncrement = 0;

                 // Clear any previous incorrect mark at this position before evaluating
                 effects.push(clearMark.of({ from: currentPos, to: currentPos + 1 }));

                 if (typedChar === expectedChar) {
                     // Correct: reveal the character (which simply removes dim/incorrect via clearMark)
                     // No need to add a specific "revealed" mark if CSS handles opacity correctly
                     progressIncrement = 1;
                     // We already cleared, so no 'revealCharacter' effect is needed if CSS handles it
                     // If CSS doesn't work reliably, uncomment this:
                     // effects.push(revealCharacter.of({ from: currentPos, to: currentPos + 1 }));
                 } else {
                     // Incorrect: Add incorrect mark
                     if(currentPos + 1 <= docLength) {
                         effects.push(addIncorrectMark.of({ from: currentPos, to: currentPos + 1 }));
                     }
                     // Progress does NOT increment on incorrect input
                     progressIncrement = 0;
                 }

                 const nextProgress = currentPos + progressIncrement;
                 if(progressIncrement > 0) { // Only update progress if correct
                    setGuidedProgress(nextProgress);
                 }

                 // Dispatch transaction to update decorations and cursor
                 view.dispatch({
                     effects: effects,
                     selection: { anchor: nextProgress }, // Move cursor even if incorrect (or keep at currentPos if preferred)
                     scrollIntoView: true
                 });
                 return true; // We handled the event
             }}
        ]))
    ], [baseExtensions, currentLanguageExtension, editMode, guidedProgress, getGuidedProgress]);

     // Effect to reset guided mode state
    useEffect(() => {
        if (editMode === 'guided' && guidedView) {
            console.log("Resetting Guided Mode on mode/code change");
            setGuidedProgress(0);
            // Use the reset effect for the StateField
            guidedView.dispatch({
                effects: resetAllGuidedDecorations.of(null),
                selection: { anchor: 0 }, // Reset cursor
                scrollIntoView: true
            });
        } else if (editMode === 'sideBySide') {
            setGuidedProgress(0); // Reset progress if switching away
        }
    // Ensure reset happens if the underlying code changes while in guided mode
    }, [editMode, currentCode, language, guidedView]); // Added language dependency


    const containerModeClass = editMode === 'guided' ? 'editor-layout-guided' : 'editor-layout-sideBySide';
    const leftStyle = editMode === 'sideBySide' ? { width: `${leftWidth}%` } : {};
    const rightStyle = editMode === 'sideBySide' ? { width: `${100 - leftWidth}%` } : {};

    // --- Rendering ---
    return (
        <div className="relative h-full flex flex-col">
             <div className="absolute top-2 right-2 z-20">
                <button
                    onClick={onToggleFullscreen}
                    className="p-2 bg-[var(--secondary-bg)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--secondary-bg)] focus:ring-[var(--accent)] text-[var(--text-primary)]"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                 </button>
             </div>
             <div ref={containerRef} className={`editor-container flex-grow ${containerModeClass} border border-[var(--border-color)] rounded-md overflow-hidden`}>
                {editMode === 'sideBySide' ? (
                    <>
                        <div className="editor-pane editor-left h-full" style={leftStyle}>
                            <CodeMirror value={typedCode} extensions={sideBySideEditableExtensions} onChange={onTypedCodeChange} className="typing-area h-full" />
                        </div>
                        <div ref={dividerRef} className="editor-divider flex-shrink-0 w-[6px] bg-[var(--border-color)] cursor-col-resize hover:bg-[var(--accent)] transition-colors" role="separator" aria-orientation="vertical" />
                        <div className="editor-pane editor-right h-full" style={rightStyle}>
                            <CodeMirror value={currentCode} extensions={sideBySideReadOnlyExtensions} readOnly={true} className="reference-code h-full" />
                        </div>
                    </>
                ) : ( // Guided Mode
                    <div className="editor-pane editor-guided-single h-full w-full">
                        <CodeMirror
                            value={currentCode}
                            extensions={guidedSingleEditorExtensions}
                            onCreateEditor={setGuidedView}
                            className="guided-editor-area h-full"
                            // View is made editable via extension, state is read-only via extension
                            readOnly={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
// --- END COMPLETE FILE ---