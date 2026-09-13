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

let [jsSrc, cssSrc] = await Promise.all([
  readFile(path.join(DIST, "assets", js), "utf8"),
  readFile(path.join(DIST, "assets", css), "utf8"),
]);
// The build emits images, audio and any other asset as real files, because
// inlining every one of them into the bundle is what put a ceiling on how big
// the game is allowed to get. This target is the exception that still needs
// them inline - it is one HTML file with no assets directory beside it - so
// fold them back in here, at the only point where that is actually required.
//
// Both bundles are rewritten: the JS reaches assets through import URLs, the
// CSS through url(). Anything left pointing at ./assets after this is a file
// the build emitted and this pass failed to find, which would be a silently
// broken image in a build meant for play-testers, so it is a hard error.
const MEDIA_TYPES = {
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".avif": "image/avif", ".woff2": "font/woff2", ".woff": "font/woff",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".m4a": "audio/mp4",
  ".wav": "audio/wav", ".json": "application/json",
};

const inlined = new Map();
async function assetDataUri(file) {
  if (inlined.has(file)) return inlined.get(file);
  const type = MEDIA_TYPES[path.extname(file).toLowerCase()];
  if (!type) return null;
  const bytes = await readFile(path.join(DIST, "assets", file));
  const uri = `data:${type};base64,${bytes.toString("base64")}`;
  inlined.set(file, uri);
  return uri;
}

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Vite emits an asset reference as `new URL("<name>", import.meta.url).href`,
 * with the name relative to the bundle inside dist/assets - no "assets/" in
 * the string at all. In a single HTML file `import.meta.url` is the page, so
 * that expression resolves somewhere else entirely and would break even if the
 * file were beside it. So the whole expression is replaced, not just the path.
 *
 * The stylesheet reaches its own assets through url(), relative the same way.
 */
function inlineAssets(source, isCss) {
  let out = source;
  let bytes = 0;
  for (const [file, uri] of inlined) {
    const name = escapeRe(file);
    const patterns = isCss
      ? [new RegExp(`url\\(\\s*(['"]?)(?:\\.\\/)?${name}\\1\\s*\\)`, "g")]
      : [new RegExp(`new URL\\(\\s*(['"])(?:\\.\\/)?${name}\\1\\s*,\\s*import\\.meta\\.url\\s*\\)\\.href`, "g"),
         new RegExp(`(['"])(?:\\.\\/)?assets\\/${name}\\1`, "g")];
    for (const re of patterns) {
      out = out.replace(re, () => {
        bytes += uri.length;
        return isCss ? `url("${uri}")` : JSON.stringify(uri);
      });
    }
  }
  return { out, bytes };
}

{
  for (const file of assets) {
    if (file === js || file === css) continue;
    await assetDataUri(file);
  }
  const before = jsSrc.length + cssSrc.length;
  jsSrc = inlineAssets(jsSrc, false).out;
  cssSrc = inlineAssets(cssSrc, true).out;

  // The check is for the emitted filename anywhere at all, not for a path
  // shape. A leftover means the build referenced a file in a form this pass
  // does not know about, and a single HTML file cannot reach it - which is a
  // silently missing image in the build handed to play-testers, so it fails.
  const stillReferenced = assets.filter(
    (f) => f !== js && f !== css && (jsSrc.includes(f) || cssSrc.includes(f)),
  );
  if (stillReferenced.length) {
    console.error(`Could not inline ${stillReferenced.length} asset(s) the build emitted:`);
    for (const f of stillReferenced.slice(0, 10)) console.error(`  ${f}`);
    console.error("The build references these in a form pack-page does not rewrite.");
    process.exit(1);
  }
  const mb = ((jsSrc.length + cssSrc.length - before) / 1048576).toFixed(2);
  console.log(`  + ${inlined.size} asset(s) inlined (+${mb} MB as base64)`);
}

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
