// What Claude said it was doing, one entry per explanation, with the edits it covers.
import { dayjs, ENRICH_WINDOW } from "../../core/time.ts";
import type { FeedEntry } from "../model.ts";
import { ctx } from "./context.ts";
import { $, basename, escapeHtml } from "./dom.ts";

// The checklist is already pinned at the top, and the viewer link Claude gives in its first reply is this very
// page: neither is repeated in the feed.
const withoutChecklist = (text: string) =>
  text
    .split("\n")
    .filter((l) => !/^\s*[-*]\s+\[[ xX]\]\s/.test(l) && !l.includes(`//${location.host}`))
    .join("\n")
    .trim();

// The server keeps looking for explanations for ENRICH_WINDOW; after that there will be none.
const pending = (entry: FeedEntry) => {
  const first = entry.items[0];
  const ev = first ? ctx.state.events.get(first.eventId) : undefined;
  return !!ev?.transcript && dayjs().isBefore(dayjs(ev.ts).add(ENRICH_WINDOW));
};

export function renderFeed(onReplay: (eventId: string) => void): void {
  const feed = $("feed");
  const scroller = feed.parentElement ?? feed;
  const stick = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 40;
  feed.replaceChildren(
    ...ctx.state.feed.map((entry) => {
      const div = document.createElement("div");
      const current = entry.items.some((i) => i.eventId === ctx.playingId);
      div.className = `entry${current ? " current" : ""}`;
      const time = dayjs(entry.ts).format("HH:mm:ss");
      const first = entry.items[0];
      const agent = first ? ctx.state.events.get(first.eventId)?.agent : null;
      const prose = entry.text ? withoutChecklist(entry.text) : "";
      const text = prose
        ? `<div class="text">${escapeHtml(prose).replace(/`([^`\n]+)`/g, "<code>$1</code>")}</div>`
        : `<div class="text none">${pending(entry) ? "(explanation pending…)" : "(no explanation)"}</div>`;
      div.innerHTML = `<div class="meta">${time}${agent ? `<span class="badge">${escapeHtml(agent)}</span>` : ""}</div>${text}<div class="items"></div>`;
      div.querySelector(".items")?.replaceChildren(
        ...entry.items.map((item) => {
          const b = document.createElement("button");
          b.className = "item";
          b.textContent = basename(item.file);
          b.title = `Replay this edit of ${item.file}`;
          b.onclick = () => {
            onReplay(item.eventId);
          };
          return b;
        }),
      );
      return div;
    }),
  );
  const currentEntry = feed.querySelector(".entry.current");
  if (currentEntry) currentEntry.scrollIntoView({ block: "nearest" });
  else if (stick) scroller.scrollTop = scroller.scrollHeight;
}
