# ALMS Mobile (Android)

A thin Capacitor wrapper around the live ALMS web app, the same pattern
as `desktop-app/` — a native WebView pointed at `capacitor.config.json`'s
`server.url`, not a bundled copy of the site. Every Vercel deploy updates
what users see immediately.

## Before building

Edit `capacitor.config.json` and set `server.url` to your actual deployed
URL. (If you're building through the repo's GitHub Actions workflow
instead of locally, set the `ALMS_APP_URL` repository variable once and
it does this automatically for every release — see
`.github/workflows/build-apps.yml`.)

## Build

This needs the Android SDK + a JDK, which this repo does **not** assume
you have locally — the intended way to build is via the GitHub Actions
workflow (push a `v*` tag, or trigger it manually from the Actions tab),
which builds on a runner with those preinstalled and attaches the APK to
a GitHub Release automatically.

To build locally instead (requires Android Studio / the Android SDK + a
JDK installed):

```
npm install
npx cap sync android
cd android
./gradlew assembleDebug   # -> app/build/outputs/apk/debug/app-debug.apk
```

The APK is unsigned (debug build, no Play Store distribution), so Android
will warn about installing from an unknown source — that's expected; enable
"Install unknown apps" for whichever app you use to open the file.

## Regenerating icons/splash screen

Source images live in `assets/`. After changing them:

```
npx capacitor-assets generate --android
```
