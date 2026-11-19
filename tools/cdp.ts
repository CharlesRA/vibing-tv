// Minimal Chrome DevTools Protocol driver for the dev tools (check-viewer, record-demo). Headless Chrome only.
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_CHROME: Partial<Record<NodeJS.Platform, string>> = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  linux: "google-chrome",
};

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export interface Chrome {
  cdp(method: string, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
  on(method: string, listener: (params: Record<string, unknown>) => void): void;
  navigate(url: string): Promise<void>;
  evaluate<T>(expression: string): Promise<T>;
  screenshot(path: string): Promise<void>;
  logs: string[];
  close(): void;
}

interface Message {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export async function launchChrome({
  port = 9333,
  chromePath = process.env.CHROME_PATH ?? DEFAULT_CHROME[process.platform] ?? "google-chrome",
  width = 1400,
  height = 820,
}: { port?: number; chromePath?: string; width?: number; height?: number } = {}): Promise<Chrome> {
  const proc: ChildProcess = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${String(port)}`,
      `--user-data-dir=${mkdtempSync(join(tmpdir(), "vibing-tv-chrome-"))}`,
      `--window-size=${String(width)},${String(height)}`,
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let ws: WebSocket | null = null;
  for (let i = 0; i < 50 && !ws; i++) {
    try {
      const targets = (await (await fetch(`http://127.0.0.1:${String(port)}/json`)).json()) as {
        type: string;
        webSocketDebuggerUrl: string;
      }[];
      const page = targets.find((t) => t.type === "page");
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {
      await sleep(200);
    }
  }
  if (!ws) throw new Error(`Chrome did not start (${chromePath}); set CHROME_PATH`);
  const socket = ws;
  await new Promise((r) => (socket.onopen = r));

  let nextId = 0;
  const pending = new Map<number, (result: Record<string, unknown>) => void>();
  const listeners = new Map<string, ((params: Record<string, unknown>) => void)[]>();
  const logs: string[] = [];
  socket.onmessage = (m: MessageEvent<string>) => {
    const d = JSON.parse(m.data) as Message;
    if (d.id !== undefined) {
      pending.get(d.id)?.(d.result ?? {});
      pending.delete(d.id);
    }
    if (d.method) for (const l of listeners.get(d.method) ?? []) l(d.params ?? {});
  };

  const cdp = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });
  const on = (method: string, listener: (params: Record<string, unknown>) => void) => {
    listeners.set(method, [...(listeners.get(method) ?? []), listener]);
  };

  on("Runtime.exceptionThrown", (p) => logs.push(`EXCEPTION ${JSON.stringify(p.exceptionDetails)}`));
  on("Runtime.consoleAPICalled", (p) => {
    if (p.type === "error" || p.type === "warning") logs.push(`${p.type} ${JSON.stringify(p.args)}`);
  });
  on("Log.entryAdded", (p) => {
    const entry = p.entry as { level: string; text: string; url?: string };
    if (entry.level === "error") logs.push(`LOG ${entry.text} ${entry.url ?? ""}`);
  });
  await cdp("Runtime.enable");
  await cdp("Log.enable");
  await cdp("Page.enable");

  return {
    cdp,
    on,
    logs,
    async navigate(url) {
      await cdp("Page.navigate", { url });
    },
    async evaluate<T>(expression: string) {
      const r = (await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })) as {
        result?: { value?: T };
      };
      return r.result?.value as T;
    },
    async screenshot(path) {
      const { data } = (await cdp("Page.captureScreenshot", { format: "png" })) as { data: string };
      writeFileSync(path, Buffer.from(data, "base64"));
    },
    close() {
      socket.close();
      proc.kill();
    },
  };
}
