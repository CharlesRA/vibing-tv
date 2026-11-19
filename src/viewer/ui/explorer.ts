// The session's files (explorer), the editor tabs and the active file's path above them.
import { FileStatuses } from "../model.ts";
import { ctx } from "./context.ts";
import { $, basename, escapeHtml, relativeTo } from "./dom.ts";
import { fileStatusIcon } from "./icons.ts";
import { editor, modelFor } from "./monaco.ts";

const STATUS_LABELS = { [FileStatuses.New]: "New file", [FileStatuses.Modified]: "Modified" } as const;

const cwd = () => ctx.state.events.values().next().value?.cwd;

export function show(file: string): void {
  ctx.activeFile = file;
  editor().setModel(modelFor(file));
  $("empty").hidden = true;
  renderFiles();
  renderTabs();
}

export function renderFiles(): void {
  $("files").replaceChildren(
    ...ctx.state.order.map((file) => {
      const status = ctx.state.files.get(file)?.status ?? FileStatuses.Modified;
      const li = document.createElement("li");
      li.className = file === ctx.activeFile ? "active" : "";
      li.title = file;
      li.innerHTML = `<span class="name">${escapeHtml(relativeTo(cwd(), file))}</span><span class="st st-${status}" title="${STATUS_LABELS[status]}">${fileStatusIcon(status)}</span>`;
      li.onclick = () => {
        show(file);
      };
      return li;
    }),
  );
}

function renderCrumb(): void {
  const file = ctx.activeFile;
  if (!file) {
    $("crumb").textContent = "No file yet";
    return;
  }
  const parts = relativeTo(cwd(), file).split(/[/\\]/);
  const leaf = parts.pop() ?? file;
  // the last two folders are enough to place a file; the full path is in the tooltip
  const shown = parts.length > 2 ? ["…", ...parts.slice(-2)] : parts;
  $("crumb").title = file;
  $("crumb").innerHTML = [
    ...shown.map((p) => `<span>${escapeHtml(p)}</span><span class="sep">/</span>`),
    `<span class="leaf">${escapeHtml(leaf)}</span>`,
  ].join("");
}

export function renderTabs(): void {
  renderCrumb();
  $("tabs").replaceChildren(
    ...ctx.state.order.map((file) => {
      const tab = document.createElement("div");
      tab.className = `tab${file === ctx.activeFile ? " active" : ""}`;
      tab.textContent = basename(file);
      tab.title = file;
      tab.onclick = () => {
        show(file);
      };
      return tab;
    }),
  );
}
