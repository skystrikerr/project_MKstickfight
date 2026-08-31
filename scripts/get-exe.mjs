/**
 * Puts the newest Windows build in ./release, without building it yourself.
 *
 *   npm run get:exe            # the dev build - rebuilt on every push to main
 *   npm run get:exe v0.2.0     # a specific tagged release
 *
 * Every push to main rebuilds the game on a real Windows runner and replaces
 * the files on the `dev` release, so this always fetches whatever is currently
 * on main. No token needed; the repository is public.
 */

import { createWriteStream } from "node:fs";
import { mkdir, rename, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const REPO = "skystrikerr/project_MKstickfight";
const OUT = "release";
const tag = process.argv[2] ?? "dev";

if (typeof fetch !== "function") {
  console.error("This needs Node 18 or newer (it uses fetch). Yours: " + process.version);
  process.exit(1);
}

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

async function api(url) {
  const res = await fetch(url, {
    headers: { accept: "application/vnd.github+json", "user-agent": "stickfighter-get-exe" },
  });
  if (res.status === 404) {
    console.error(`No release tagged "${tag}" on ${REPO}.`);
    console.error(tag === "dev" ? "Push to main once and the dev build appears." : "Check the tag name.");
    process.exit(1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

const release = await api(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`);
// GitHub replaces spaces in an asset's `name` with dots; the `label` keeps the
// filename the build actually produced. Use that, so what lands in ./release
// matches what `npm run dist:win` writes there.
const named = (a) => a.label || a.name;
const exes = release.assets.filter((a) => named(a).endsWith(".exe"));

if (exes.length === 0) {
  console.error(`Release "${tag}" has no .exe attached.`);
  process.exit(1);
}

console.log(`${release.name || tag} - built ${new Date(release.published_at).toLocaleString()}`);
// The body carries the commit the build came from, so you can tell at a glance
// whether you are testing what you think you are testing.
const sha = /([0-9a-f]{40})/.exec(release.body ?? "")?.[1];
if (sha) console.log(`commit ${sha.slice(0, 8)}`);
console.log("");

await mkdir(OUT, { recursive: true });

for (const asset of exes) {
  const dest = path.join(OUT, named(asset));
  const existing = await stat(dest).catch(() => null);
  if (existing?.size === asset.size) {
    console.log(`= ${named(asset)} (${mb(asset.size)}) already current`);
    continue;
  }

  process.stdout.write(`↓ ${named(asset)} (${mb(asset.size)}) `);
  const res = await fetch(asset.browser_download_url, {
    headers: { accept: "application/octet-stream", "user-agent": "stickfighter-get-exe" },
  });
  if (!res.ok || !res.body) throw new Error(`${res.status} downloading ${named(asset)}`);

  // Download beside the target and move it into place, so an interrupted run
  // cannot leave a half-written .exe that looks like a real one.
  const partial = `${dest}.part`;
  let done = 0;
  let dots = 0;
  const body = Readable.fromWeb(res.body);
  body.on("data", (chunk) => {
    done += chunk.length;
    const want = Math.floor((done / asset.size) * 20);
    while (dots < want) {
      process.stdout.write(".");
      dots++;
    }
  });
  await pipeline(body, createWriteStream(partial));
  await rename(partial, dest);
  console.log(" done");
}

console.log(`\nIn ${path.resolve(OUT)}. Run the -portable one to play.`);
