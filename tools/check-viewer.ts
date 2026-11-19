// Visual check of the built viewer: server on 4318, scripted events, headless Chrome, screenshots and console errors.
// Usage: npm run build && npm run check-viewer -- <output folder>
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, sleep } from "./cdp.ts";

const out = process.argv[2];
if (!out) throw new Error("usage: check-viewer <output folder>");
mkdirSync(out, { recursive: true });
const PORT = 4318;
const server = fileURLToPath(new URL("../dist/runtime/server.mjs", import.meta.url));
const data = mkdtempSync(join(tmpdir(), "vibing-tv-ui-"));
mkdirSync(join(data, "sessions"));

const sid = "demo1";
let n = 0;
const ts = () => new Date(Date.now() + n).toISOString();
const add = (e: Record<string, unknown>) => {
  const ev = {
    v: 1,
    id: `e${String(++n)}`,
    ts: ts(),
    session_id: sid,
    cwd: "/work/todo",
    agent: null,
    explanation: null,
  };
  appendFileSync(join(data, "sessions", `${sid}.jsonl`), JSON.stringify({ ...ev, ...e }) + "\n");
};
const todos = (statuses: string[]) =>
  ["Style", "HTML page", "Script: add and render", "Delete"].map((content, i) => ({ content, status: statuses[i] }));

const css = "body { font-family: system-ui; }\n.done { text-decoration: line-through; }\n";
add({
  kind: "write",
  file: "/work/todo/style.css",
  before: null,
  after: css,
  explanation: { key: "k0", text: "A minimal stylesheet first." },
});

const srv = spawn(process.execPath, [server], {
  env: { ...process.env, VIBING_TV_PORT: String(PORT), VIBING_TV_DATA_DIR: data },
  stdio: "ignore",
});
await sleep(500);
const chrome = await launchChrome();
await chrome.navigate(`http://127.0.0.1:${String(PORT)}/`);
await sleep(4000);
await chrome.screenshot(join(out, "1-hydrated.png"));

const html = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Todo</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>My tasks</h1>\n  <form id="add"><input id="title" placeholder="New task"><button>Add</button></form>\n  <ul id="list"></ul>\n  <script src="app.js"></script>\n</body>\n</html>\n`;
const plan =
  "Creating the page and the todo script.\n\n- [x] Style\n- [ ] HTML page\n- [ ] Script: add and render\n- [ ] Delete";
add({
  kind: "write",
  file: "/work/todo/index.html",
  before: null,
  after: html,
  explanation: { key: "k1", text: plan },
  todos: todos(["completed", "in_progress", "pending", "pending"]),
});
await sleep(1500);
await chrome.screenshot(join(out, "2-typing-html.png"));

const app1 = `const list = document.getElementById("list");\nconst todos = [];\n\nfunction render() {\n  list.innerHTML = "";\n  for (const t of todos) {\n    const li = document.createElement("li");\n    li.textContent = t.title;\n    list.append(li);\n  }\n}\n\ndocument.getElementById("add").addEventListener("submit", (e) => {\n  e.preventDefault();\n  const input = document.getElementById("title");\n  todos.push({ title: input.value });\n  input.value = "";\n  render();\n});\n`;
add({ kind: "write", file: "/work/todo/app.js", before: null, after: app1, explanation: { key: "k1", text: plan } });
await sleep(9000);

const oldS = `    li.textContent = t.title;\n`;
const newS = `    li.textContent = t.title;\n    const del = document.createElement("button");\n    del.textContent = "×";\n    del.onclick = () => { todos.splice(todos.indexOf(t), 1); render(); };\n    li.append(del);\n`;
const app2 = app1.replace(oldS, newS);
add({
  kind: "edit",
  file: "/work/todo/app.js",
  before: app1,
  after: app2,
  edit: { old_string: oldS, new_string: newS, replace_all: false },
  explanation: {
    key: "k2",
    text: "Adding a × button per task: a click removes the task from the array and renders again.\n\n- [x] Style\n- [x] HTML page\n- [x] Script: add and render\n- [ ] Delete",
  },
  todos: todos(["completed", "completed", "completed", "in_progress"]),
});
await sleep(1200);
await chrome.screenshot(join(out, "3-editing.png"));
await sleep(5000);
await chrome.screenshot(join(out, "4-done.png"));

const counter = await chrome.evaluate<string>("document.getElementById('counter').textContent");
const contents = await chrome.evaluate<Record<string, number>>("window.__vibingTvDebug.contents()");
await chrome.cdp("Page.reload");
await sleep(4000);
await chrome.screenshot(join(out, "5-reloaded.png"));
const counter2 = await chrome.evaluate<string>("document.getElementById('counter').textContent");

console.log(JSON.stringify({ counter, counter2, contents, expectedApp: app2.length, logs: chrome.logs }, null, 2));
chrome.close();
srv.kill();
process.exit(0);
