// frontend/src/components/editor/CodeEditor.tsx
import { onMount, onCleanup, createEffect } from "solid-js";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { setDiagnostics as setEditorDiagnostics } from "@codemirror/lint";
import type { Diagnostic } from "@/wasm/types";
import { ProcessorId } from "@/wasm/types";
import { codemachineTheme, codemachineHighlighting } from "./theme";
import { getLanguage } from "./languages";

interface Props {
  processorId: ProcessorId;
  initialCode: string;
  onChange: (code: string) => void;
  onCompile: () => void;
  diagnostics: Diagnostic[];
}

export default function CodeEditor(props: Props) {
  let containerRef!: HTMLDivElement;
  let view: EditorView;

  onMount(() => {
    const state = EditorState.create({
      doc: props.initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        getLanguage(props.processorId),
        codemachineTheme,
        codemachineHighlighting,
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
      <div class="flex items-center justify-between px-3 py-2 bg-main-900 border-b border-main-800">
        <span class="text-xs text-main-500 uppercase font-semibold tracking-wider">Code Editor</span>
        <button
          onClick={() => props.onCompile()}
          class="px-3 py-1 text-xs bg-accent hover:bg-accent-light text-white rounded transition-colors"
        >
          Compile & Run (Ctrl+Enter)
        </button>
      </div>
      <div ref={containerRef} class="flex-1 overflow-auto" />
    </div>
  );
}
