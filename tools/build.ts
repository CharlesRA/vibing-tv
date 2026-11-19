// Builds the self-contained plugin into dist/: bundled hooks and server, the Vite-built viewer, the plugin manifests.
// dist/ must never hold a package.json (Claude Code would run npm install) nor a bin/ folder (put on Bash's PATH).
import { context, type BuildOptions } from "esbuild";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build as viteBuild } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };

const runtime: BuildOptions = {
  absWorkingDir: root,
  entryPoints: {
    capture: "src/hooks/capture.ts",
    "session-start": "src/hooks/session-start.ts",
    server: "src/server/main.ts",
  },
  outdir: join(dist, "runtime"),
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  define: { __VIBING_TV_VERSION__: JSON.stringify(version) },
  logLevel: "warning",
};

function copyPluginFiles() {
  cpSync(join(root, "plugin"), dist, { recursive: true });
  const manifest = join(dist, ".claude-plugin", "plugin.json");
  const plugin = JSON.parse(readFileSync(manifest, "utf8")) as Record<string, unknown>;
  writeFileSync(manifest, JSON.stringify({ ...plugin, version }, null, 2) + "\n");
  for (const file of ["README.md", "LICENSE"]) {
    if (existsSync(join(root, file))) copyFileSync(join(root, file), join(dist, file));
  }
}

function assertInstallable() {
  for (const forbidden of ["package.json", "bin"]) {
    if (existsSync(join(dist, forbidden))) throw new Error(`dist/${forbidden} must not exist`);
  }
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
const esbuild = await context(runtime);
await esbuild.rebuild();
await viteBuild({ configFile: join(root, "vite.config.ts"), build: watch ? { watch: {} } : {} });
copyPluginFiles();
assertInstallable();

if (watch) {
  await esbuild.watch();
  console.log("watching src/ → dist/ (load it with: claude --plugin-dir ./dist)");
} else {
  await esbuild.dispose();
  console.log(`built vibing-tv ${version} into dist/`);
}
