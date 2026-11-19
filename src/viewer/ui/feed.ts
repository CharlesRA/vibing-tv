// What Claude said it was doing, one entry per explanation, with the edits it covers.
import type { FeedEntry } from "../model.ts";
import { ctx } from "./context.ts";
import { $, basename, escapeHtml } from "./dom.ts";

const ENRICH_WINDOW_MS = 120_000;

// The checklist is already pinned at the top: it is not repeated in the feed.
const withoutChecklist = (text: string) =>
  text
    .split("\n")
    .filter((l) => !/^\s*[-*]\s+\[[ xX]\]\s/.test(l))
    .join("\n")
    .trim();

// The server keeps looking for explanations for 2 minutes; after that there will be none.
const pending = (entry: FeedEntry) => {
  const first = entry.items[0];
  const ev = first && ctx.state.events.get(first.eventId);
  return !!ev?.transcript && Date.now() - Date.parse(ev.ts) < ENRICH_WINDOW_MS;
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
      const time = new Date(entry.ts).toLocaleTimeString();
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
