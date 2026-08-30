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
const PROTOCOL = 'alms';

// Google requires OAuth to complete in a real browser, not this embedded
// window, so it won't sign in here at all. The custom alms:// protocol is
// how the system browser hands a completed sign-in back to this app —
// see the auth-handoff flow in controllers/authController.js.
app.setAsDefaultProtocolClient(PROTOCOL);

function handleDeepLink(win, url) {
  if (!url || !url.startsWith(PROTOCOL + '://')) return;
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code && win) {
      win.loadURL(APP_URL + '/auth/complete-handoff?code=' + encodeURIComponent(code));
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  } catch (e) {}
}

// Only one window should ever exist. If the OS launches the protocol
// handler while the app is already running, forward the URL to the
// existing window instead of starting a second instance.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    const win = BrowserWindow.getAllWindows()[0];
    const url = argv.find(arg => arg.startsWith(PROTOCOL + '://'));
    if (url) handleDeepLink(win, url);
    else if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}

// macOS delivers the protocol URL through this event instead of argv.
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(BrowserWindow.getAllWindows()[0], url);
});

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

  // Google Sign-In refuses to complete inside an embedded webview like this
  // one, so send that specific navigation out to the system browser instead
  // of letting it happen here. The browser hands the finished sign-in back
  // via the alms:// deep link (see handleDeepLink above).
  win.webContents.on('will-navigate', (event, navUrl) => {
    try {
      const parsed = new URL(navUrl);
      if (parsed.pathname === '/auth/google') {
        event.preventDefault();
        parsed.searchParams.set('client', 'desktop');
        shell.openExternal(parsed.toString());
      }
    } catch (e) {}
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

  // Windows/Linux: if the app wasn't already running, the OS launches it
  // fresh with the alms:// URL as a command-line argument instead of firing
  // second-instance.
  const launchUrl = process.argv.find(arg => arg.startsWith(PROTOCOL + '://'));
  if (launchUrl) handleDeepLink(win, launchUrl);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
