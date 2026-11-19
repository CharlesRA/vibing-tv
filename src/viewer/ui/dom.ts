export function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const escapeHtml = (s: string): string => s.replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);

// Paths may come from Windows (backslashes) or POSIX.
export const basename = (file: string): string => file.split(/[/\\]/).pop() ?? file;

export function relativeTo(cwd: string | null | undefined, file: string): string {
  if (!cwd) return file;
  for (const sep of ["/", "\\"]) if (file.startsWith(cwd + sep)) return file.slice(cwd.length + 1);
  return file;
}
