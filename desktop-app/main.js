// ============================================================
// ALMS Desktop — a thin Electron wrapper around the live ALMS web app.
//
// This is intentionally NOT a bundled copy of the app. It's a native
// window pointed at the deployed URL in config.json, the same pattern
// Slack/WhatsApp Desktop/the ChatGPT desktop app use. That means every
// Vercel deploy updates what users see immediately, with nothing to
// rebuild or redistribute — only wrapper-level changes (this file) need
// a new installer.
// ============================================================

const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
const APP_URL = process.env.ALMS_APP_URL || config.appUrl;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 360,
    minHeight: 500,
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#ffffff',
    title: 'ALMS — Adaptive Life Management System',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Tag requests so the page itself can tell it's already running inside
  // the installed desktop shell and hide its own "Install App" button
  // (which would otherwise offer to install an app the user is already in).
  win.webContents.setUserAgent(win.webContents.getUserAgent() + ' ALMSDesktop/1.0');
  win.loadURL(APP_URL);

  // Links that open in a "new tab" (target=_blank, e.g. an external site)
  // should open in the user's real browser, not a second app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // If the app can't be reached (offline, DNS failure, etc.), show a
  // minimal retry page instead of Chromium's raw error screen.
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL !== APP_URL) return;
    const offlineHtml = `
      <html><body style="font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f1f5f9;text-align:center;">
        <h2>Can't reach ALMS</h2>
        <p style="color:#94a3b8;max-width:360px;">Check your internet connection, then try again.</p>
        <button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:#FF5A5F;color:white;border:none;border-radius:8px;font-size:15px;cursor:pointer;">Retry</button>
      </body></html>`;
    win.loadURL('data:text/html,' + encodeURIComponent(offlineHtml));
  });

  return win;
}

function buildMenu(win) {
  const template = [
    {
      label: 'ALMS',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win.reload() },
        { label: 'Toggle Developer Tools', accelerator: 'F12', click: () => win.webContents.toggleDevTools() },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  const win = createWindow();
  buildMenu(win);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
