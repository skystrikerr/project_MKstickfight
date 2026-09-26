// Builds each vehicle in headless Chromium, writes assets/vehicles/<car>.glb
// and a set of turntable previews to assets/vehicles/previews/.
//
//   node tools/vehicles/export-vehicles.mjs [car ...]
//
// Needs Playwright (npx playwright, or the global install) and a Chromium.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch {
  const { execSync } = await import("node:child_process");
  ({ chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright")));
}

const cars = process.argv.slice(2).length ? process.argv.slice(2) : ["blue-murder"];
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };
const server = createServer(async (req, res) => {
  try {
    const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(root)) throw new Error("outside root");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const views = {
  hero: [[5.0, 1.55, 4.3], [0, 0.55, 0.2], 30], // front 3/4, like the select card
  side: [[8.5, 0.9, 0], [0, 0.65, 0], 34],
  rear: [[-4.6, 2.0, -4.8], [0, 0.6, -0.2], 32],
  front: [[0.9, 1.1, 7.2], [0, 0.6, 0], 30],
  top: [[0.01, 9.5, 0.5], [0, 0, 0], 38],
  left: [[-5.0, 1.55, 4.3], [0, 0.55, 0.2], 30],
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (m) => m.type() === "error" && console.error("page:", m.text()));
page.on("pageerror", (e) => console.error("page error:", e.message));
await mkdir(path.join(root, "assets/vehicles/previews"), { recursive: true });

for (const car of cars) {
  await page.goto(`http://localhost:${port}/tools/vehicles/vehicle-lab.html?car=${car}`);
  await page.waitForFunction(() => window.labReady, null, { timeout: 60000 });
  console.log(car, await page.evaluate(() => window.lab.stats()));
  for (const [name, [pos, target, fov]] of Object.entries(views)) {
    await page.evaluate(([p, t, f]) => window.lab.view(p, t, f), [pos, target, fov]);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(root, `assets/vehicles/previews/${car}-${name}.png`) });
  }
  const b64 = await page.evaluate(() => window.lab.exportGLB());
  const out = path.join(root, `assets/vehicles/${car}.glb`);
  await writeFile(out, Buffer.from(b64, "base64"));
  console.log("wrote", path.relative(root, out), (Buffer.byteLength(b64, "base64") / 1024).toFixed(0), "KB");
}
await browser.close();
server.close();
