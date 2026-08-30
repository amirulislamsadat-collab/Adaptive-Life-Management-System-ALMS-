# ALMS Desktop

A thin Electron wrapper around the live ALMS web app — the same pattern
Slack, WhatsApp Desktop, and the ChatGPT desktop app use. It doesn't bundle
a copy of the site; it just opens a native window pointed at the URL in
`config.json`. That means every Vercel deploy updates what users see
immediately — this only needs rebuilding for wrapper-level changes (window
size, icon, menu), not for anything that changes inside the app itself.

## Before building

Edit `config.json` and set `appUrl` to your actual deployed URL:

```json
{ "appUrl": "https://your-app.vercel.app" }
```

## Build

```
npm install
npm run build:win     # -> dist/ALMS Setup <version>.exe (NSIS installer)
npm run build:linux    # -> dist/*.AppImage
npm run build:mac      # -> dist/*.dmg (must run on an actual Mac)
```

The Windows/Linux builds work from any machine with Node installed — no
extra SDKs required. The output is **unsigned** (no paid code-signing
certificate), so Windows SmartScreen will show an "Unknown Publisher"
warning on first run — click "More info" → "Run anyway". This doesn't
affect functionality, only that first-run prompt.

## Distributing

Attach the built installer to a GitHub Release so users can download it
directly (see `.github/workflows/build-apps.yml` at the repo root, which
does this automatically on tagged releases).
