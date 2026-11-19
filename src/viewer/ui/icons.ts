// Inline SVG icons, drawn on a 14px grid in currentColor so that CSS sets their color.
import { TodoStatuses, type TodoStatus } from "../../core/protocol.ts";
import { FileStatuses, type FileStatus } from "../model.ts";

const svg = (body: string) =>
  `<svg class="icon" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">${body}</svg>`;

export const icons = {
  pause: svg(`<rect x="3.5" y="3" width="2.25" height="8" rx=".75" fill="currentColor"/>
    <rect x="8.25" y="3" width="2.25" height="8" rx=".75" fill="currentColor"/>`),
  play: svg(
    `<path d="M4.5 3.2v7.6a.6.6 0 0 0 .9.5l6-3.8a.6.6 0 0 0 0-1L5.4 2.7a.6.6 0 0 0-.9.5Z" fill="currentColor"/>`,
  ),
  skip: svg(`<path d="M3 3.6v6.8a.5.5 0 0 0 .8.4l4.9-3.4a.5.5 0 0 0 0-.8L3.8 3.2a.5.5 0 0 0-.8.4Z" fill="currentColor"/>
    <rect x="9.5" y="3" width="1.75" height="8" rx=".6" fill="currentColor"/>`),
  file: svg(`<path d="M4 1.75h4L10.75 4.5v7a.75.75 0 0 1-.75.75H4a.75.75 0 0 1-.75-.75v-9A.75.75 0 0 1 4 1.75Z"
    fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7.75 1.75V4.75h3" fill="none" stroke="currentColor" stroke-width="1.2"/>`),
} as const;

// Linear-style issue states: an empty ring, a half-filled ring, a filled disc with a check.
const STEP_ICONS: Record<TodoStatus, string> = {
  [TodoStatuses.Pending]: svg(`<circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" stroke-width="1.5"/>`),
  [TodoStatuses.InProgress]: svg(`<circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M7 3.5a3.5 3.5 0 0 1 0 7Z" fill="currentColor"/>`),
  [TodoStatuses.Completed]: svg(`<circle cx="7" cy="7" r="6.5" fill="currentColor"/>
    <path d="M4.4 7.1 6.2 8.9 9.7 5.3" fill="none" stroke="var(--on-accent)" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round"/>`),
};

export const stepIcon = (status: TodoStatus): string => STEP_ICONS[status];

// A ring filled clockwise from the top, `ratio` between 0 and 1.
export const progressRing = (ratio: number): string =>
  svg(`<circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--border-strong)" stroke-width="2"/>
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" stroke-width="2" pathLength="100"
    stroke-dasharray="${String(Math.round(ratio * 100))} 100" transform="rotate(-90 7 7)"/>`);

const FILE_STATUS_ICONS: Record<FileStatus, string> = {
  [FileStatuses.New]: svg(
    `<path d="M7 3.5v7M3.5 7h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  ),
  [FileStatuses.Modified]: svg(`<circle cx="7" cy="7" r="3" fill="currentColor"/>`),
};

export const fileStatusIcon = (status: FileStatus): string => FILE_STATUS_ICONS[status];
