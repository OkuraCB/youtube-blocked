const { app, BrowserWindow } = require("electron");
const { ElectronBlocker, fullLists } = require("@cliqz/adblocker-electron");
const fetch = require("cross-fetch");
const { readFileSync, writeFileSync } = require("fs");

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL("https://youtube.com/tv", {
    userAgent:
      "Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/531.2+ (KHTML, Like Gecko) WebBrowser/1.0 SmartTV Safari/531.2+",
  });
  win.setFullScreen(true);

  // Set adblock
  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: "engine.bin",
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    }
  );

  blocker.enableBlockingInSession(win.webContents.session);

  blocker.on("request-blocked", (request) => {
    console.log("blocked", request.tabId, request.url);
  });

  blocker.on("request-redirected", (request) => {
    console.log("redirected", request.tabId, request.url);
  });

  blocker.on("request-whitelisted", (request) => {
    console.log("whitelisted", request.tabId, request.url);
  });

  blocker.on("csp-injected", (request, csps) => {
    console.log("csp", request.url, csps);
  });

  blocker.on("script-injected", (script, url) => {
    console.log("script", script.length, url);
  });

  blocker.on("style-injected", (style, url) => {
    console.log("style", style.length, url);
  });

  blocker.on("filter-matched", console.log.bind(console, "filter-matched"));

  // Open the DevTools.
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
