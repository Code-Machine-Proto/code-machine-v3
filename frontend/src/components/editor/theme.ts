// frontend/src/components/editor/theme.ts
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const codemachineTheme = EditorView.theme({
  "&": {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#60a5fa",
    padding: "8px 0",
  },
  ".cm-cursor": {
    borderLeftColor: "#60a5fa",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "#1e40af33",
  },
  ".cm-gutters": {
    backgroundColor: "#0f172a",
    color: "#475569",
    border: "none",
    paddingRight: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#1e293b",
    color: "#94a3b8",
  },
  ".cm-activeLine": {
    backgroundColor: "#1e293b44",
  },
  ".cm-line": {
    padding: "0 8px",
  },
});

export const codemachineHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#f472b6" },
    { tag: tags.number, color: "#a78bfa" },
    { tag: tags.labelName, color: "#4ade80" },
    { tag: tags.comment, color: "#64748b", fontStyle: "italic" },
    { tag: tags.invalid, color: "#ef4444", textDecoration: "underline wavy #ef4444" },
    { tag: tags.string, color: "#a78bfa" },
    { tag: tags.operator, color: "#94a3b8" },
    { tag: tags.variableName, color: "#60a5fa" },
  ])
);
