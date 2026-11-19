// Claude's checklist, pinned above the feed.
import { TodoStatuses } from "../../core/protocol.ts";
import { ctx } from "./context.ts";
import { $ } from "./dom.ts";

export function renderSteps(): void {
  const todos = ctx.state.todos;
  $("steps").hidden = !todos;
  if (!todos) return;
  $("steps-count").textContent =
    `· ${String(todos.filter((t) => t.status === TodoStatuses.Completed).length)}/${String(todos.length)}`;
  $("steps-list").replaceChildren(
    ...todos.map((t) => {
      const li = document.createElement("li");
      li.className = t.status;
      li.textContent = ` ${t.content}`;
      return li;
    }),
  );
}
