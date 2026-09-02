import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths: the desktop build loads dist/index.html straight off
  // disk over file://, where Vite's default absolute "/assets/..." would 404.
  base: "./",
  plugins: [react()],
  build: {
    // The fonts have to travel inside the stylesheet: `pack:page` folds the
    // build into one HTML file, and a woff2 sitting in assets/ would be left
    // behind. They are ~135 KB in total, so inlining all of them is cheap.
    //
    // Painted stage backdrops ride along for the same reason, plus one more:
    // the desktop build opens dist/index.html off disk with no server behind
    // it, so a texture left sitting in assets/ is a missing backdrop rather
    // than a slow one.
    assetsInlineLimit: (file: string) =>
      file.endsWith(".woff2") || /src[\\/]assets[\\/]/.test(file) ? true : undefined,
    rollupOptions: {
      output: {
        // One chunk, always. The stage backdrop is behind a dynamic import so
        // that the Node self-tests can still load stage.ts (Node cannot parse
        // a .jpg import, and it never builds a Stage) - but left to itself
        // Rollup answers that by splitting the image into its own chunk, and
        // `pack:page` only folds the entry bundle into the single-file build.
        // The result was a page that ran fine on a server and had no backdrop
        // off disk. This keeps the split from happening in the first place.
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
