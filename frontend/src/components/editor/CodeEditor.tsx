// frontend/src/components/editor/CodeEditor.tsx
import { onMount, onCleanup, createEffect } from "solid-js";
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  Decoration, type DecorationSet,
} from "@codemirror/view";
import { EditorState, StateField, StateEffect } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { setDiagnostics as setEditorDiagnostics } from "@codemirror/lint";
import type { Diagnostic } from "@/wasm/types";
import { ProcessorId } from "@/wasm/types";
import {
  themeCompartment, highlightCompartment,
  getThemeExtension, getHighlightExtension,
} from "./theme";
import { getLanguage } from "./languages";
import { useTheme } from "@/stores/theme";

interface Props {
  processorId: ProcessorId;
  initialCode: string;
  onChange: (code: string) => void;
  onCompile: () => void;
  diagnostics: Diagnostic[];
  /** 0-indexed source line of the instruction under the program counter, or null. */
  activeLine?: () => number | null;
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
      if (lineNumber === null || lineNumber < 0 || lineNumber >= tr.state.doc.lines) {
        decorations = Decoration.none;
      } else {
        const line = tr.state.doc.line(lineNumber + 1);
        decorations = Decoration.set([
          Decoration.line({ class: "cm-active-exec-line" }).range(line.from),
        ]);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export default function CodeEditor(props: Props) {
  let containerRef!: HTMLDivElement;
  let view: EditorView;
  const { isDark } = useTheme();

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
        keymap.of([{
          key: "Ctrl-Enter",
          run: () => { props.onCompile(); return true; },
        }]),
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
      effects.push(EditorView.scrollIntoView(lineInfo.from, { y: "center" }));
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
      severity: d.severity === "Error" ? "error" as const : "warning" as const,
      message: d.message,
    }));
    view.dispatch(setEditorDiagnostics(view.state, cmDiags));
  });

  onCleanup(() => view?.destroy());

  return (
    <div class="flex flex-col h-full">
      <div class="panel-header gap-2">
        <span class="panel-label shrink-0">Editeur</span>
        <button
          onClick={() => props.onCompile()}
          class="px-2.5 py-1 text-[10px] font-medium bg-accent/90 hover:bg-accent text-white rounded-md transition-all shrink-0 glow-accent"
          title="Ctrl+Enter"
        >
          Compiler
        </button>
      </div>
      <div ref={containerRef} class="flex-1 overflow-auto" />
    </div>
  );
}
