import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The server serves index.html at "/" and every other viewer file under "/viewer/".
export default defineConfig({
  root: fileURLToPath(new URL("./src/viewer", import.meta.url)),
  base: "/viewer/",
  logLevel: "warn",
  build: {
    outDir: fileURLToPath(new URL("./dist/viewer", import.meta.url)),
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 8000,
  },
});
