// Monaco, bundled locally (no CDN), and one model per file holding the content already played.
// Only the core editor and syntax highlighting: the viewer is read-only, so language services (and their
// multi-megabyte workers) would only add size and red squiggles on half-typed code.
import * as monaco from "monaco-editor/editor/editor.api";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import "monaco-editor/languages/definitions/register.all";
import { $, basename } from "./dom.ts";

declare global {
  interface Window {
    // Read by tools/check-viewer.ts and tools/record-demo.ts.
    __vibingTvDebug?: { contents(): Record<string, number> };
  }
}

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

const LANGUAGES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  // no JSON tokenizer without the JSON language service; JavaScript highlighting reads well enough
  json: "javascript",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  rb: "ruby",
  php: "php",
  c: "cpp",
  h: "cpp",
  cpp: "cpp",
  cs: "csharp",
  swift: "swift",
  sh: "shell",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  graphql: "graphql",
};

// Matches the page's palette (style.css): the editor sits on the main background, syntax colors are muted so
// that the green and red edit marks stay the loudest thing on screen.
const THEME = "vibing-tv";
monaco.editor.defineTheme(THEME, {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "c9cbcf" },
    { token: "comment", foreground: "5c6067", fontStyle: "italic" },
    { token: "keyword", foreground: "9aa2f0" },
    { token: "string", foreground: "8fc9a8" },
    { token: "number", foreground: "e9b872" },
    { token: "regexp", foreground: "e9b872" },
    { token: "type", foreground: "7fc1d9" },
    { token: "type.identifier", foreground: "7fc1d9" },
    { token: "delimiter", foreground: "8a8f98" },
    { token: "tag", foreground: "9aa2f0" },
    { token: "attribute.name", foreground: "e9b872" },
    { token: "attribute.value", foreground: "8fc9a8" },
  ],
  colors: {
    "editor.background": "#0f1012",
    "editor.foreground": "#c9cbcf",
    "editorGutter.background": "#0f1012",
    "editorLineNumber.foreground": "#3a3c41",
    "editorLineNumber.activeForeground": "#8a8f98",
    "editorCursor.foreground": "#5e6ad2",
    "editor.selectionBackground": "#5e6ad240",
    "editor.inactiveSelectionBackground": "#5e6ad226",
    "editorIndentGuide.background1": "#1b1c1f",
    "editorIndentGuide.activeBackground1": "#2c2d32",
    "editorWidget.background": "#18191c",
    "editorWidget.border": "#2c2d32",
    // brackets in the delimiter grey, not rainbow-colored by nesting depth
    ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`editorBracketHighlight.foreground${String(n)}`, "#8a8f98"])),
    "minimap.background": "#0f1012",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#ffffff12",
    "scrollbarSlider.hoverBackground": "#ffffff1f",
    "scrollbarSlider.activeBackground": "#ffffff29",
  },
});

const models = new Map<string, monaco.editor.ITextModel>();
let instance: monaco.editor.IStandaloneCodeEditor | null = null;

export { monaco };

export function editor(): monaco.editor.IStandaloneCodeEditor {
  instance ??= monaco.editor.create($("editor"), {
    model: null,
    theme: THEME,
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: true, renderCharacters: false },
    fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
    fontSize: 13,
    lineHeight: 21,
    padding: { top: 12 },
    scrollBeyondLastLine: false,
    renderLineHighlight: "none",
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
  });
  return instance;
}

export function modelFor(file: string): monaco.editor.ITextModel {
  let m = models.get(file);
  if (!m) {
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    // A synthetic URI per model: Uri.file() would merge Windows spellings of one path (C:\a vs c:/a) and throw.
    const uri = monaco.Uri.from({ scheme: "vibing-tv", path: `/${String(models.size)}/${basename(file)}` });
    m = monaco.editor.createModel("", LANGUAGES[ext] ?? "plaintext", uri);
    models.set(file, m);
  }
  return m;
}

export function resetModels(): void {
  for (const m of models.values()) m.dispose();
  models.clear();
  editor().setModel(null);
}

window.__vibingTvDebug = {
  contents: () => Object.fromEntries([...models].map(([file, m]) => [file, m.getValue().length])),
};
