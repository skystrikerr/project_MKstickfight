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
    assetsInlineLimit: (file: string) => (file.endsWith(".woff2") ? true : undefined),
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
