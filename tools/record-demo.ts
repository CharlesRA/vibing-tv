// Records docs/demo/demo.gif: replays docs/demo/session.jsonl into the built viewer in headless Chrome,
// captures the screen and assembles a GIF with ffmpeg.
// Usage: npm run build && npm run demo
import { execFileSync, spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StreamEvent } from "../src/core/protocol.ts";
import { dayjs } from "../src/core/time.ts";
import { launchChrome, sleep } from "./cdp.ts";

const PORT = 4319;
const WIDTH = 1280;
const HEIGHT = 720;
const SPEED = "8";
const MIN_GAP = dayjs.duration(0.5, "seconds");
const MAX_GAP = dayjs.duration(2.5, "seconds");
const MAX_LENGTH = dayjs.duration(40, "seconds");
const MAX_GIF_BYTES = 5 * 1024 * 1024;

const root = fileURLToPath(new URL("..", import.meta.url));
const events = readFileSync(join(root, "docs/demo/session.jsonl"), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l) as StreamEvent);
const fileEvents = events.filter((e) => e.file).length;

const data = mkdtempSync(join(tmpdir(), "vibing-tv-demo-"));
const frames = mkdtempSync(join(tmpdir(), "vibing-tv-frames-"));
mkdirSync(join(data, "sessions"));
const log = join(data, "sessions", "demo.jsonl");

const server = spawn(process.execPath, [join(root, "dist/runtime/server.mjs")], {
  env: { ...process.env, VIBING_TV_PORT: String(PORT), VIBING_TV_DATA_DIR: data },
  stdio: "ignore",
});
await sleep(500);
const chrome = await launchChrome({ width: WIDTH, height: HEIGHT });
await chrome.cdp("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: false,
});
await chrome.navigate(`http://127.0.0.1:${String(PORT)}/`);
await sleep(2500);
await chrome.evaluate(`document.getElementById("speed").value = "${SPEED}"`);

const shots: { file: string; at: number }[] = [];
chrome.on("Page.screencastFrame", (p) => {
  const { data: jpeg, sessionId, metadata } = p as { data: string; sessionId: number; metadata: { timestamp: number } };
  const file = join(frames, `${String(shots.length).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(jpeg, "base64"));
  shots.push({ file, at: metadata.timestamp });
  void chrome.cdp("Page.screencastFrameAck", { sessionId });
});
await chrome.cdp("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: WIDTH, maxHeight: HEIGHT });
await sleep(1000);

// Replay at a watchable pace: real gaps between events, clamped.
const started = dayjs();
let previous: StreamEvent | undefined;
for (const ev of events) {
  if (previous) {
    const gap = dayjs(ev.ts).diff(dayjs(previous.ts));
    await sleep(Math.min(Math.max(gap, MIN_GAP.asMilliseconds()), MAX_GAP.asMilliseconds()));
  }
  appendFileSync(log, JSON.stringify(ev) + "\n");
  previous = ev;
}
const done = `${String(fileEvents)}/${String(fileEvents)} edits`;
while (dayjs().isBefore(started.add(MAX_LENGTH))) {
  if ((await chrome.evaluate<string>("document.getElementById('counter').textContent")) === done) break;
  await sleep(250);
}
await sleep(2500);
await chrome.cdp("Page.stopScreencast");
chrome.close();
server.kill();

// ffmpeg concat list: each frame lasts until the next one.
const list = shots
  .map((s, i) => `file '${s.file}'\nduration ${String(Math.max((shots[i + 1]?.at ?? s.at + 1) - s.at, 0.02))}`)
  .join("\n");
writeFileSync(join(frames, "list.txt"), `${list}\nfile '${shots.at(-1)?.file ?? ""}'\n`);
const gif = join(root, "docs/demo/demo.gif");
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  join(frames, "list.txt"),
  "-vf",
  "fps=10,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
  "-loop",
  "0",
  gif,
]);
const size = statSync(gif).size;
const seconds = (shots.at(-1)?.at ?? 0) - (shots[0]?.at ?? 0);
console.log(
  `docs/demo/demo.gif: ${(size / 1024 / 1024).toFixed(2)} MB, ${seconds.toFixed(1)} s, ${String(shots.length)} frames`,
);
if (size > MAX_GIF_BYTES) throw new Error("GIF over 5 MB: lower SPEED, fps or width");
process.exit(0);
