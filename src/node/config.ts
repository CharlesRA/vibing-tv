// Every setting comes from the environment; invalid values fall back to the default instead of failing a hook.
import { dayjs } from "../core/time.ts";
import { dataDir } from "./paths.ts";

export interface Config {
  port: number;
  dataDir: string;
  idleMs: number;
  coach: boolean;
  link: boolean;
}

const DEFAULT_PORT = 4317;
const DEFAULT_IDLE_MS = dayjs.duration(30, "minutes").asMilliseconds();

function positiveInt(value: string | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= max ? n : fallback;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: positiveInt(env.VIBING_TV_PORT, DEFAULT_PORT, 65_535),
    dataDir: dataDir(env),
    idleMs: positiveInt(env.VIBING_TV_IDLE_MS, DEFAULT_IDLE_MS),
    coach: env.VIBING_TV_NO_COACH !== "1",
    link: env.VIBING_TV_NO_LINK !== "1",
  };
}
