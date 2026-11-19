// Claude's checklist, pinned above the feed, drawn like issue states with a progress ring.
import { TodoStatuses } from "../../core/protocol.ts";
import { ctx } from "./context.ts";
import { $ } from "./dom.ts";
import { progressRing, stepIcon } from "./icons.ts";

export function renderSteps(): void {
  const todos = ctx.state.todos;
  $("steps").hidden = !todos;
  if (!todos) return;
  const done = todos.filter((t) => t.status === TodoStatuses.Completed).length;
  $("steps-count").innerHTML =
    `${progressRing(todos.length ? done / todos.length : 0)}${String(done)}/${String(todos.length)}`;
  $("steps-count").title = `${String(done)} of ${String(todos.length)} steps done`;
  $("steps-list").replaceChildren(
    ...todos.map((t) => {
      const li = document.createElement("li");
      li.className = t.status;
      li.innerHTML = stepIcon(t.status);
      li.append(t.content);
      return li;
    }),
  );
}
