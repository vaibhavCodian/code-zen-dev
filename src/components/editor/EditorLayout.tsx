// src/components/editor/EditorLayout.tsx (DEBUGGING VERSION)
import React, { RefObject, useMemo, useState, useEffect } from 'react';
import CodeMirror, { EditorView, ViewUpdate, Decoration, DecorationSet } from '@uiw/react-codemirror';
import { EditorState, Extension, StateField, StateEffect } from '@codemirror/state';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { Expand, Minimize } from 'lucide-react';
import { languageMap, SupportedLanguage } from '../../constants/editor';
import { EditorMode } from '../../types';
import { indentUnit } from '@codemirror/language'; // For potential future use

// --- Decoration Setup ---
const dimMark = Decoration.mark({ class: 'guided-dim-text' });
const incorrectMark = Decoration.mark({ class: 'guided-incorrect-text' });

// --- State Effects ---
const applyDimMark = StateEffect.define<{ from: number; to: number }>();
const applyIncorrectMark = StateEffect.define<{ from: number; to: number }>();
const clearGuidedMarks = StateEffect.define<{ from: number; to: number }>(); // Removes dim/incorrect
const resetGuidedDecorations = StateEffect.define<EditorState>();


// --- State Field for Decorations (WITH DEBUG LOGGING) ---
const guidedDecorationState = StateField.define<DecorationSet>({
    create(state) {
        console.log("[StateField.create] Initializing decorations (dim all)");
        return Decoration.set(state.doc.length > 0 ? [dimMark.range(0, state.doc.length)] : []);
    },
    update(decoSet, tr) {
        console.log("[StateField.update] Transaction:", tr);
        if (!tr.docChanged && !tr.effects.length) {
             console.log("[StateField.update] No changes or effects, returning old decoSet.");
             return decoSet;
        }

        console.log("[StateField.update] Mapping decoSet through changes...");
        let mappedDecoSet = decoSet.map(tr.changes);
        console.log("[StateField.update] DecoSet BEFORE effects:", mappedDecoSet.size);


        for (let e of tr.effects) {
             console.log("[StateField.update] Processing Effect:", e);
             if (e.is(clearGuidedMarks)) {
                 console.log(`[StateField.update] > Clearing marks in range ${e.value.from}-${e.value.to}`);
                 mappedDecoSet = mappedDecoSet.update({
                    filterFrom: e.value.from,
                    filterTo: e.value.to,
                    // Precise filter: ONLY remove dim or incorrect marks WITHIN the range
                    filter: (from, to, deco) => {
                         const shouldKeep = !(
                            (deco.spec.class === 'guided-dim-text' || deco.spec.class === 'guided-incorrect-text') &&
                             from >= e.value.from && to <= e.value.to // Strict containment check
                        );
                         // console.log(`    Filtering deco ${deco.spec.class} [${from}-${to}]: ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
                         return shouldKeep;
                    }
                 });
             } else if (e.is(applyDimMark)) {
                 console.log(`[StateField.update] > Applying DIM mark in range ${e.value.from}-${e.value.to}`);
                 // First, clear any *incorrect* mark in the specific target range
                 mappedDecoSet = mappedDecoSet.update({
                     filterFrom: e.value.from, filterTo: e.value.to,
                     filter: (f, t, deco) => !(deco.spec.class === 'guided-incorrect-text' && f>=e.value.from && t<=e.value.to)
                 });
                 // Then add the dim mark (will overwrite if needed, update handles this)
                 if (e.value.from < e.value.to) {
                     mappedDecoSet = mappedDecoSet.update({ add: [dimMark.range(e.value.from, e.value.to)], sort: true });
                 }
            } else if (e.is(applyIncorrectMark)) {
                 console.log(`[StateField.update] > Applying INCORRECT mark in range ${e.value.from}-${e.value.to}`);
                 // First, clear any *dim* mark in the specific target range
                mappedDecoSet = mappedDecoSet.update({
                    filterFrom: e.value.from, filterTo: e.value.to,
                    filter: (f, t, deco) => !(deco.spec.class === 'guided-dim-text' && f>=e.value.from && t<=e.value.to)
                });
                 // Then add the incorrect mark
                 if (e.value.from < e.value.to) {
                     mappedDecoSet = mappedDecoSet.update({ add: [incorrectMark.range(e.value.from, e.value.to)], sort: true });
                 }
            } else if (e.is(resetGuidedDecorations)) {
                 console.log("[StateField.update] > Resetting all decorations (dim all)");
                 const docLen = e.value.doc.length;
                 mappedDecoSet = Decoration.set(docLen > 0 ? [dimMark.range(0, docLen)] : []);
            }
        }
        console.log("[StateField.update] DecoSet AFTER effects:", mappedDecoSet.size);
        // Log the final decorations for inspection
        // let finalDecos = [];
        // mappedDecoSet.between(0, tr.state.doc.length, (from, to, deco) => {finalDecos.push({from, to, class: deco.spec.class})});
        // console.log("[StateField.update] Final Decorations:", finalDecos);
        return mappedDecoSet;
    },
    provide: f => EditorView.decorations.from(f)
});


// --- Component ---
interface EditorLayoutProps { /* ... props ... */
    editMode: EditorMode;
    typedCode: string;
    currentCode: string;
    language: SupportedLanguage;
    leftWidth: number;
    containerRef: RefObject<HTMLDivElement>;
    dividerRef: RefObject<HTMLDivElement>;
    isFullscreen: boolean;
    onTypedCodeChange: (value: string, viewUpdate?: ViewUpdate) => void;
    onToggleFullscreen: () => void;
 }

export function EditorLayout({
    editMode,
    typedCode,
    currentCode,
    language,
    leftWidth,
    containerRef,
    dividerRef,
    isFullscreen,
    onTypedCodeChange,
    onToggleFullscreen,
}: EditorLayoutProps) {

    const [guidedView, setGuidedView] = useState<EditorView | null>(null);
    const [userProgress, setUserProgress] = useState(0);

    const currentLanguageExtension = useMemo(() => languageMap[language] || languageMap.javascript, [language]);
    const baseThemeExtensions = useMemo(() => [ tokyoNight, EditorView.lineWrapping, EditorView.theme({ '&': { height: '100%' }, '.cm-scroller': { overflow: 'auto' } }) ], []);

    // --- Extensions ---
    const sideBySideEditableExtensions: Extension[] = useMemo(() => [ baseThemeExtensions, currentLanguageExtension, EditorState.readOnly.of(false)], [baseThemeExtensions, currentLanguageExtension]);
    const sideBySideReadOnlyExtensions: Extension[] = useMemo(() => [ baseThemeExtensions, currentLanguageExtension, EditorState.readOnly.of(true), EditorView.editable.of(false)], [baseThemeExtensions, currentLanguageExtension]);

    const guidedSingleEditorExtensions: Extension[] = useMemo(() => [
        baseThemeExtensions,
        currentLanguageExtension,
        guidedDecorationState,
        EditorState.readOnly.of(true),
        EditorView.editable.of(true),
        EditorView.domEventHandlers({
            keydown(event, view) {
                if (editMode !== 'guided') return false;
                console.log(`[keydown] Key: "${event.key}", Code: "${event.code}", Modifiers: ctrl=${event.ctrlKey},meta=${event.metaKey},alt=${event.altKey},shift=${event.shiftKey}`);


                const currentPos = userProgress;
                const docLength = view.state.doc.length;
                let handled = false;

                // 1. Handle Backspace
                if (event.key === 'Backspace') {
                    event.preventDefault();
                    if (currentPos > 0) {
                        const prevPos = currentPos - 1;
                        console.log(`[keydown] Backspace: Progress ${currentPos} -> ${prevPos}`);
                        setUserProgress(prevPos);
                        // Apply dim mark to the character we moved back to
                        console.log(`[keydown] Dispatching applyDimMark for ${prevPos}-${prevPos + 1}`);
                        view.dispatch({
                             effects: applyDimMark.of({ from: prevPos, to: prevPos + 1 }),
                             selection: { anchor: prevPos }
                         });
                    } else {
                        console.log("[keydown] Backspace at start, doing nothing.");
                    }
                    handled = true;
                }
                 // 2. Handle Delete (reset char under cursor to dim)
                 else if (event.key === 'Delete') {
                     event.preventDefault();
                     if (currentPos < docLength) {
                         console.log(`[keydown] Delete: Resetting char at ${currentPos}`);
                         // Apply dim mark to the character at current cursor pos
                         view.dispatch({
                            effects: applyDimMark.of({ from: currentPos, to: currentPos + 1}),
                             selection: { anchor: currentPos }
                        });
                     } else {
                         console.log("[keydown] Delete at end, doing nothing.");
                     }
                    handled = true;
                 }

                // 3. Handle Single Character Input (printable, allow Shift)
                else if ( event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey ) {
                    event.preventDefault();
                    if (currentPos < docLength) {
                        const expectedChar = view.state.doc.sliceString(currentPos, currentPos + 1);
                        const typedChar = event.key;
                        console.log(`[keydown] Char Input: Typed "${typedChar}", Expected "${expectedChar}" at pos ${currentPos}`);

                        let effects: StateEffect<any>[] = [];

                        if (typedChar === expectedChar) {
                            console.log("[keydown] Correct char: Dispatching clearGuidedMarks");
                            effects.push(clearGuidedMarks.of({ from: currentPos, to: currentPos + 1 }));
                        } else {
                            // --- DEBUG: Temporarily treat incorrect as correct to isolate dimming issue ---
                            // console.log("[keydown] Incorrect char: Dispatching applyIncorrectMark");
                            // effects.push(applyIncorrectMark.of({ from: currentPos, to: currentPos + 1 }));
                            // --- END DEBUG ---
                             console.log("[keydown] TEMP DEBUG: Incorrect char -> Treating as correct (Dispatching clearGuidedMarks)");
                             effects.push(clearGuidedMarks.of({ from: currentPos, to: currentPos + 1 }));
                        }

                        setUserProgress(currentPos + 1);
                         view.dispatch({
                             effects: effects,
                             selection: { anchor: currentPos + 1 },
                             scrollIntoView: true
                         });
                    } else {
                         console.log("[keydown] Char Input: At end of document.");
                    }
                    handled = true;
                }
                // 4. Handle Enter key for newlines
                 else if (event.key === 'Enter') {
                      event.preventDefault();
                       if (currentPos < docLength) {
                           const expectedChar = view.state.doc.sliceString(currentPos, currentPos + 1);
                           console.log(`[keydown] Enter: Expected "${expectedChar === '\n' ? '\\n' : expectedChar}" at pos ${currentPos}`);
                           let effects: StateEffect<any>[] = [];
                           if (expectedChar === '\n') {
                               console.log("[keydown] Correct Enter: Dispatching clearGuidedMarks");
                               effects.push(clearGuidedMarks.of({ from: currentPos, to: currentPos + 1 }));
                           } else {
                                // --- DEBUG: Temporarily treat incorrect as correct ---
                                // console.log("[keydown] Incorrect Enter: Dispatching applyIncorrectMark");
                                // effects.push(applyIncorrectMark.of({ from: currentPos, to: currentPos + 1 }));
                                // --- END DEBUG ---
                                console.log("[keydown] TEMP DEBUG: Incorrect Enter -> Treating as correct (Dispatching clearGuidedMarks)");
                                effects.push(clearGuidedMarks.of({ from: currentPos, to: currentPos + 1 }));
                           }
                           setUserProgress(currentPos + 1);
                            view.dispatch({
                                effects: effects,
                                selection: { anchor: currentPos + 1 },
                               scrollIntoView: true
                           });
                       } else {
                            console.log("[keydown] Enter: At end of document.");
                       }
                      handled = true;
                  }

                 // 5. Allow navigation/modifiers/escape (Let CM handle them)
                 const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'];
                 if (allowedKeys.includes(event.key)) {
                     console.log(`[keydown] Allowing navigation/modifier key: "${event.key}"`);
                      return false;
                 }

                 // 6. If not handled and not explicitly allowed, prevent default
                 if (!handled) {
                    console.log(`[keydown] Preventing unhandled key: "${event.key}"`);
                    event.preventDefault();
                    return true;
                 }
                 return handled;
            },
        }),

    ], [baseThemeExtensions, currentLanguageExtension, editMode, userProgress]);


    // Effect to reset guided mode state
     useEffect(() => {
        if (editMode === 'guided' && guidedView) {
            console.log("[useEffect reset] Resetting Guided Mode State.");
            setUserProgress(0);
             guidedView.dispatch({ effects: resetGuidedDecorations.of(guidedView.state) });
             guidedView.dispatch({ selection: { anchor: 0 }});
        } else if (editMode === 'sideBySide') {
             setUserProgress(0);
        }
    }, [editMode, currentCode, guidedView]);


    // --- Rendering ---
    const containerModeClass = `editor-layout-${editMode}`;
    const leftStyle = editMode === 'sideBySide' ? { width: `${leftWidth}%` } : {};
    const rightStyle = editMode === 'sideBySide' ? { width: `${100 - leftWidth}%` } : {};

    return (
         <div className="relative h-full flex flex-col">
            <div className="absolute top-4 right-4 z-20">
                <button onClick={onToggleFullscreen} className="p-2 bg-[var(--secondary-bg)] rounded-full hover:bg-[var(--accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
                </button>
            </div>
            <div ref={containerRef} className={`editor-container flex-grow ${containerModeClass}`}>
                {editMode === 'sideBySide' ? (
                    <>
                        <div className="editor-left h-full" style={leftStyle}> <CodeMirror value={typedCode} extensions={sideBySideEditableExtensions} onChange={onTypedCodeChange} className="typing-area h-full" /> </div>
                        <div ref={dividerRef} className="editor-divider" role="separator"/>
                        <div className="editor-right h-full" style={rightStyle}> <CodeMirror value={currentCode} extensions={sideBySideReadOnlyExtensions} readOnly={true} className="reference-code h-full" /> </div>
                    </>
                ) : (
                    <div className="editor-guided-single h-full">
                        <CodeMirror value={currentCode} extensions={guidedSingleEditorExtensions} className="guided-editor-area h-full" onCreateEditor={setGuidedView} readOnly={false} />
                    </div>
                )}
            </div>
        </div>
    );
}