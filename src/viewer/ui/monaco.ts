// Monaco, bundled locally (no CDN), and one model per file holding the content already played.
// Only the core editor and syntax highlighting: the viewer is read-only, so language services (and their
// multi-megabyte workers) would only add size and red squiggles on half-typed code.
import * as monaco from "monaco-editor/editor/editor.api";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import "monaco-editor/languages/definitions/register.all";
import { $ } from "./dom.ts";

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

const models = new Map<string, monaco.editor.ITextModel>();
let instance: monaco.editor.IStandaloneCodeEditor | null = null;

export { monaco };

export function editor(): monaco.editor.IStandaloneCodeEditor {
  instance ??= monaco.editor.create($("editor"), {
    model: null,
    theme: "vs-dark",
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 13,
    scrollBeyondLastLine: false,
    renderLineHighlight: "none",
  });
  return instance;
}

export function modelFor(file: string): monaco.editor.ITextModel {
  let m = models.get(file);
  if (!m) {
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    m = monaco.editor.createModel("", LANGUAGES[ext] ?? "plaintext", monaco.Uri.file(file));
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
