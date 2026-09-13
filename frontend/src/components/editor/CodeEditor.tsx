// frontend/src/components/editor/CodeEditor.tsx
import { onMount, onCleanup, createEffect, Show } from 'solid-js';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  Decoration,
  type DecorationSet,
} from '@codemirror/view';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { setDiagnostics as setEditorDiagnostics } from '@codemirror/lint';
import type { Diagnostic } from '@/wasm/types';
import { ProcessorId } from '@/wasm/types';
import {
  themeCompartment,
  highlightCompartment,
  getThemeExtension,
  getHighlightExtension,
} from './theme';
import { getLanguage } from './languages';
import { useTheme } from '@/stores/theme';

interface Props {
  processorId: ProcessorId;
  initialCode: string;
  onChange: (code: string) => void;
  onCompile: () => void;
  diagnostics: Diagnostic[];
  isCompiled: () => boolean;
  isCompiling: () => boolean;
  isStale: () => boolean;
  /** 0-indexed source line of the instruction under the program counter, or null. */
  activeLine?: () => number | null;
}

const defaultFileNames: Record<ProcessorId, string> = {
  [ProcessorId.Accumulator]: 'accumulator.s',
  [ProcessorId.AccumulatorMa]: 'accumulator-ma.s',
  [ProcessorId.PolyRisc]: 'polyrisc.s',
};

// Chromium/Electron expose a native "Save As" dialog; other browsers fall back
// to a prompt + a triggered download.
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}
interface FileSystemWritableFileStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}
declare global {
  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>;
  }
}

function downloadTextFile(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function saveCodeToFile(code: string, suggestedName: string) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Fichier assembleur',
            accept: { 'text/plain': ['.s', '.asm', '.txt'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError')
        console.error('Save failed:', e);
    }
    return;
  }
  const name = window.prompt('Nom du fichier', suggestedName);
  if (name) downloadTextFile(name, code);
}

// Highlights the source line currently under the program counter during simulation.
const setActiveLineEffect = StateEffect.define<number | null>();

const activeLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(setActiveLineEffect)) continue;
      const lineNumber = effect.value;
      if (
        lineNumber === null ||
        lineNumber < 0 ||
        lineNumber >= tr.state.doc.lines
      ) {
        decorations = Decoration.none;
      } else {
        const line = tr.state.doc.line(lineNumber + 1);
        decorations = Decoration.set([
          Decoration.line({ class: 'cm-active-exec-line' }).range(line.from),
        ]);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export default function CodeEditor(props: Props) {
  let containerRef!: HTMLDivElement;
  let fileInputRef!: HTMLInputElement;
  let view: EditorView;
  const { isDark } = useTheme();

  const handleSave = () => {
    if (!view) return;
    void saveCodeToFile(
      view.state.doc.toString(),
      defaultFileNames[props.processorId],
    );
  };

  const handleLoadClick = () => fileInputRef.click();

  const errorCount = () =>
    props.diagnostics.filter((d) => d.severity === 'Error').length;

  const handleFileSelected = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file later
    if (!file || !view) return;
    if (
      view.state.doc.toString().trim().length > 0 &&
      !window.confirm(
        "Attention, vous etes sur le point d'ecraser le code actuel. Continuer ?",
      )
    ) {
      return;
    }
    const text = await file.text();
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
    });
  };

  onMount(() => {
    const state = EditorState.create({
      doc: props.initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        activeLineField,
        getLanguage(props.processorId),
        themeCompartment.of(getThemeExtension(isDark())),
        highlightCompartment.of(getHighlightExtension(isDark())),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            props.onChange(update.state.doc.toString());
          }
        }),
        keymap.of([
          {
            key: 'Ctrl-Enter',
            run: () => {
              props.onCompile();
              return true;
            },
          },
        ]),
      ],
    });

    view = new EditorView({
      state,
      parent: containerRef,
    });
  });

  // React to theme changes
  createEffect(() => {
    if (!view) return;
    const dark = isDark();
    view.dispatch({
      effects: [
        themeCompartment.reconfigure(getThemeExtension(dark)),
        highlightCompartment.reconfigure(getHighlightExtension(dark)),
      ],
    });
  });

  // Highlight (and scroll to) the instruction line under the program counter
  createEffect(() => {
    if (!view) return;
    const line = props.activeLine?.() ?? null;
    const effects: StateEffect<unknown>[] = [setActiveLineEffect.of(line)];
    if (line !== null && line >= 0 && line < view.state.doc.lines) {
      const lineInfo = view.state.doc.line(line + 1);
      effects.push(EditorView.scrollIntoView(lineInfo.from, { y: 'center' }));
    }
    view.dispatch({ effects });
  });

  // Push diagnostics to CodeMirror
  createEffect(() => {
    if (!view) return;
    const diags = props.diagnostics;
    const cmDiags = diags.map((d) => ({
      from: view.state.doc.line(d.line + 1).from + d.column,
      to: view.state.doc.line(d.line + 1).to,
      severity:
        d.severity === 'Error' ? ('error' as const) : ('warning' as const),
      message: d.message,
    }));
    view.dispatch(setEditorDiagnostics(view.state, cmDiags));
  });

  onCleanup(() => view?.destroy());

  return (
    <div class='flex flex-col h-full'>
      <div class='panel-header gap-2'>
        <span class='panel-label shrink-0'>Editeur</span>
        <input
          ref={fileInputRef}
          type='file'
          accept='.s,.asm,.txt,text/plain'
          class='hidden'
          onChange={handleFileSelected}
        />
        <div class='flex items-center rounded-md border border-main-700/50 divide-x divide-main-700/50 overflow-hidden shrink-0'>
          <button
            onClick={handleLoadClick}
            class='flex items-center justify-center w-6 h-6 bg-main-800 hover:bg-main-700 text-main-400 hover:text-main-300 transition-colors'
            title='Charger un fichier'
          >
            <svg
              class='w-3.5 h-3.5 shrink-0'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                fill-rule='evenodd'
                clip-rule='evenodd'
                d='M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V15a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z'
              />
            </svg>
          </button>
          <button
            onClick={handleSave}
            class='flex items-center justify-center w-6 h-6 bg-main-800 hover:bg-main-700 text-main-400 hover:text-main-300 transition-colors'
            title='Enregistrer dans un fichier'
          >
            <svg
              class='w-3.5 h-3.5 shrink-0'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                fill-rule='evenodd'
                clip-rule='evenodd'
                d='M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 15a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V18a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V18a.75.75 0 01.75-.75z'
              />
            </svg>
          </button>
        </div>
        <button
          onClick={() => props.onCompile()}
          class='flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium bg-accent/90 hover:bg-accent text-white rounded-md transition-all shrink-0 glow-accent'
          title='Ctrl+Enter'
        >
          <svg
            class='w-3.5 h-3.5 shrink-0'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z'
            />
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
          Compiler
        </button>
        <span
          class='flex items-center justify-center gap-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-semibold shrink-0 transition-colors'
          classList={{
            'bg-main-800 text-main-600':
              !props.isCompiling() &&
              !props.isStale() &&
              errorCount() === 0 &&
              !props.isCompiled(),
            'bg-accent/15 text-accent-light': props.isCompiling(),
            'bg-amber-500/15 text-amber-400':
              !props.isCompiling() && props.isStale(),
            'bg-red-500/15 text-red-400':
              !props.isCompiling() && !props.isStale() && errorCount() > 0,
            'bg-emerald-500/15 text-emerald-400':
              !props.isCompiling() &&
              !props.isStale() &&
              errorCount() === 0 &&
              props.isCompiled(),
          }}
          title={
            props.isCompiling()
              ? 'Compilation en cours...'
              : props.isStale()
                ? 'Le code a ete modifie, veuillez recompiler'
                : errorCount() > 0
                  ? `${errorCount()} erreur${errorCount() > 1 ? 's' : ''} de compilation`
                  : props.isCompiled()
                    ? 'Compilation reussie'
                    : 'SVP compiler pour commencer'
          }
        >
          <Show
            when={props.isCompiling()}
            fallback={
              <Show
                when={props.isStale()}
                fallback={
                  <Show
                    when={errorCount() > 0}
                    fallback={
                      <Show
                        when={props.isCompiled()}
                        fallback={
                          <svg
                            class='w-2 h-2 shrink-0'
                            fill='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <circle cx='12' cy='12' r='10' />
                          </svg>
                        }
                      >
                        <svg
                          class='w-3.5 h-3.5 shrink-0'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            fill-rule='evenodd'
                            clip-rule='evenodd'
                            d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z'
                          />
                        </svg>
                      </Show>
                    }
                  >
                    <svg
                      class='w-3 h-3 shrink-0'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        fill-rule='evenodd'
                        clip-rule='evenodd'
                        d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
                      />
                    </svg>
                    {errorCount()}
                  </Show>
                }
              >
                <svg
                  class='w-3 h-3 shrink-0'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z' />
                </svg>
              </Show>
            }
          >
            <svg
              class='w-3 h-3 shrink-0 animate-spin'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='2'
                d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z'
              />
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='2'
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
          </Show>
        </span>
      </div>
      <div ref={containerRef} class='flex-1 overflow-auto' />
    </div>
  );
}
