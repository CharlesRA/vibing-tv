// The session's files (explorer) and the editor tabs.
import { FileStatuses } from "../model.ts";
import { ctx } from "./context.ts";
import { $, basename, escapeHtml, relativeTo } from "./dom.ts";
import { editor, modelFor } from "./monaco.ts";

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
      li.innerHTML = `<span class="name">${escapeHtml(relativeTo(cwd(), file))}</span><span class="st st-${status}">${status}</span>`;
      li.onclick = () => {
        show(file);
      };
      return li;
    }),
  );
}

export function renderTabs(): void {
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
