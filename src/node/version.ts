import { readFileSync } from "node:fs";

// Injected by the bundler (tools/build.ts) and by Vitest; read from package.json when running the sources directly.
declare const __VIBING_TV_VERSION__: string | undefined;

function packageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const VERSION: string = typeof __VIBING_TV_VERSION__ === "string" ? __VIBING_TV_VERSION__ : packageVersion();
