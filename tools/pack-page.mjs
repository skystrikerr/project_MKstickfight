/**
 * Folds the built game into one self-contained HTML file.
 *
 *   npm run build && npm run pack:page          -> dist/stickfighter.html
 *   npm run pack:page -- --music                 -> include public/music/*
 *
 * Everything is inlined, so the result runs from anywhere that can serve a
 * single page - no assets directory, no server routes. That is what makes it
 * publishable as a link for play-testing, and it doubles as a build you can
 * hand someone whole.
 *
 * Music is left out by default. This file gets distributed, and a track needs
 * its licence settled before it travels; the player treats a missing track as
 * silence, so nothing breaks. See public/music/README.md.
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const withMusic = process.argv.includes("--music");
const out = process.argv.find((a) => a.endsWith(".html")) ?? path.join(DIST, "stickfighter.html");

let assets;
try {
  assets = await readdir(path.join(DIST, "assets"));
} catch {
  console.error("No dist/assets - run `npm run build` first.");
  process.exit(1);
}

// Packing a stale bundle is silent and looks exactly like success: the file
// is the right size, it opens, it plays - it is just the previous build. That
// shipped an old version of the dodge to a play-tester once, so refuse to do
// it rather than warn about it.
{
  const newest = async (dir) => {
    let latest = 0;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      latest = Math.max(latest, entry.isDirectory() ? await newest(full) : (await stat(full)).mtimeMs);
    }
    return latest;
  };
  const built = (await stat(path.join(DIST, "assets", assets.find((f) => f.endsWith(".js")) ?? ""))).mtimeMs;
  const edited = Math.max(await newest(path.join(ROOT, "src")), await newest(path.join(ROOT, "tools")));
  if (edited > built) {
    const age = Math.round((edited - built) / 1000);
    console.error(`dist/assets is ${age}s older than the sources - run \`npm run build\` first.`);
    process.exit(1);
  }
}

const js = assets.find((f) => f.endsWith(".js"));
const css = assets.find((f) => f.endsWith(".css"));
if (!js || !css) {
  console.error("dist/assets is missing the bundle or the stylesheet.");
  process.exit(1);
}

const [jsSrc, cssSrc] = await Promise.all([
  readFile(path.join(DIST, "assets", js), "utf8"),
  readFile(path.join(DIST, "assets", css), "utf8"),
]);
// A literal </script> inside the bundle would close the inline tag early and
// leave the rest of the game as page text.
if (jsSrc.includes("</script")) {
  console.error("The bundle contains a literal </script; it cannot be inlined as-is.");
  process.exit(1);
}

// Music, when asked for, rides along as data URIs and the track table is
// rewritten to point at them.
let musicPatch = "";
if (withMusic) {
  const dir = path.join(ROOT, "public", "music");
  const files = (await readdir(dir).catch(() => [])).filter((f) => /\.(mp3|ogg|m4a)$/i.test(f));
  const types = { mp3: "audio/mpeg", ogg: "audio/ogg", m4a: "audio/mp4" };
  const entries = await Promise.all(
    files.map(async (f) => {
      const b64 = (await readFile(path.join(dir, f))).toString("base64");
      return `  ${JSON.stringify(f)}: "data:${types[f.split(".").pop().toLowerCase()]};base64,${b64}"`;
    }),
  );
  if (entries.length) {
    musicPatch =
      `<script>window.__INLINE_MUSIC__ = {\n${entries.join(",\n")}\n};<\/script>\n`;
    console.log(`  + ${entries.length} music file(s) inlined`);
  }
}

// Without the charset the roster's own names come out as mojibake: a browser
// opening this off disk has no HTTP header to go on, and "Hattori Hanzo" is
// spelled with a macron.
const page = `<meta charset="utf-8">
<title>Plank Fighter World</title>
<style>
/* The game paints its own full-bleed world; this only clears the way for it. */
html, body { margin: 0; padding: 0; height: 100%; background: #0c0d0c; }
body { overflow: hidden; color: #e6e1d3; }
#root { height: 100%; }
${cssSrc}
</style>
<div id="root"></div>
${musicPatch}<script type="module">
${jsSrc}
</script>
`;

await writeFile(out, page);
const mb = (Buffer.byteLength(page) / 1048576).toFixed(2);
console.log(`${path.relative(ROOT, out)}  ${mb} MB`);
