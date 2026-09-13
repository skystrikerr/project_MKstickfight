import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths. The desktop build serves dist/ through a privileged
  // app:// handler rather than file:// (see electron/main.cjs), so "./assets/x"
  // resolves against the page URL and lands back inside dist either way.
  base: "./",
  plugins: [react()],
  build: {
    // Fonts, and only fonts, travel inside the stylesheet. A woff2 is reached
    // from inside CSS rather than from a module, so it has no import for the
    // packer to rewrite; at ~135 KB total, inlining them is cheaper than
    // teaching the packer about url() in two syntaxes.
    //
    // Everything else under src/assets is emitted as a real file. It used to
    // be inlined here as well, back when the desktop build opened dist off
    // file:// and a loose asset was a 404. That has not been true since the
    // app:// handler landed, and inlining costs more the bigger the game gets:
    // every image ends up base64 inside one JS chunk that the browser must
    // parse in full before a frame renders, and a JS string cannot exceed
    // about half a gigabyte no matter how much disk the game is allowed.
    // `pack:page` folds these back into data URIs for the single-file web
    // build, which is the one target that actually needs them inline.
    assetsInlineLimit: (file: string) => (file.endsWith(".woff2") ? true : undefined),
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
