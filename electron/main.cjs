/**
 * Desktop shell.
 *
 * The game is a static bundle with no server behind it, so the desktop build is
 * genuinely offline - the whole application is `dist/` on disk.
 *
 * It is served over a custom `app://` scheme rather than loaded with
 * `loadFile`. That is not ceremony: the bundle is an ES module, and a module
 * script fetched over `file://` comes from an opaque origin, so Chromium blocks
 * it by CORS and you get a black window with nothing in the console but
 * ERR_FAILED. A registered standard scheme gives the page a real origin and the
 * module and its stylesheet load normally.
 */

const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, protocol, net, BrowserWindow, shell, Menu } = require("electron");

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = !!DEV_URL;
const DIST = path.join(__dirname, "..", "dist");
const APP_ORIGIN = "app://bundle";

/** Only one copy of a fighting game should ever be running. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Must happen before the app is ready, hence up here rather than in whenReady.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

let mainWindow = null;

/** Serves the built bundle, refusing anything that climbs out of `dist`. */
function serveBundle(request) {
  const { pathname } = new URL(request.url);
  const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = path.join(DIST, rel);
  if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }
  return net.fetch(pathToFileURL(filePath).toString());
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 900,
    minHeight: 560,
    // The arena paints its own background; this stops a white flash on launch.
    backgroundColor: "#0b0b10",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      // The page is trusted local content and talks to nothing, so it needs no
      // bridge into Node at all. Keeping the renderer sandboxed costs nothing.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // A fighting game that drops to 30 Hz when it loses focus is a fighting
      // game that desyncs the moment you alt-tab back in.
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Nothing in the game opens a link, but if that ever changes it goes to the
  // real browser rather than spawning a chromeless Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  void mainWindow.loadURL(isDev ? DEV_URL : `${APP_ORIGIN}/index.html`);
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  if (!isDev) protocol.handle("app", serveBundle);
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
