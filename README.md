# BethVerse

Your personal **offline** poetry vault — write, organize, scan text from images, and back up locally.

## Web app (this folder)

- **React + Vite** — runs in the browser with no login or cloud backend
- **IndexedDB** — poems and collections stored on your device
- **Tesseract.js** — on-device OCR (first scan may download language data; then works offline)

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Mobile apps

| Folder | Stack | Notes |
|--------|--------|--------|
| [expo-app/](expo-app/README.md) | **Expo / React Native** | Same React ecosystem as the web UI; run with Expo Go |
| [mobile/](mobile/README.md) | **Flutter** | Separate native app; includes on-device OCR |

Both are offline-only and do not use Base44. JSON backups from **Settings → Export** work across web, Expo, and Flutter.

## Data

| App | Storage | Backup |
|-----|---------|--------|
| Web | IndexedDB (`bethverse`) | Settings → Export JSON |
| Expo | SQLite on device | Settings → Export JSON |
| Flutter | SQLite on device | Settings → Export JSON |

Clearing browser site data removes web poems unless you have a backup.

## Paths (Windows)

| What | Path |
|------|------|
| Project | `C:\Users\Eph Tess\All projects\BethVerse` |
| Web app | `...\BethVerse\` (run `npm run dev`) |
| Expo mobile | `...\BethVerse\expo-app\` |
| Android APK (after `cd expo-app` → `npm run build:apk`) | `...\BethVerse\expo-app\dist\bethverse.apk` |
| Flutter mobile | `...\BethVerse\mobile\` |
| Flutter APK (after `flutter build apk`) | `...\BethVerse\mobile\build\app\outputs\flutter-apk\app-release.apk` |
