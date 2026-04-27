# Finance Orbit

Finance Orbit is a Firebase-backed personal finance app with a dashboard, charts, tables, reminders, exports, and a mobile-friendly interface.

## How users get it from GitHub

1. Open the GitHub Pages URL for the repo.
2. On mobile, tap the browser install prompt to add it to the home screen.
3. On desktop, use the browser install option to run it like an app.

## What makes it dynamic

- Data is stored in Firebase Realtime Database
- No browser local storage is used for app data
- Users can sign up, log in, add entries, and see the data update live

## GitHub Pages support

This repo now includes:
- `manifest.webmanifest`
- `sw.js`
- `.github/workflows/pages.yml`

That lets GitHub publish the app as an installable PWA.

## Local development

```bash
node server.js
```

Then open `http://localhost:4173/`.
