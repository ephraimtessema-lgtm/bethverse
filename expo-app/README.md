# BethVerse (Expo / React Native)

Native **Android & iOS** app using **Expo** and **React Native** — same offline BethVerse features as the web app. Stored locally in SQLite on the device.

The **Flutter** app in `../mobile` is unchanged and remains available as an alternative native build.

## Features

- Home, editor, collections, favorites, insights, settings
- Offline SQLite storage (no login, no cloud)
- PIN lock + biometric unlock
- JSON backup export / import (compatible with web & Flutter backups)
- Scan screen: camera/gallery + manual text entry

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/go) on your phone (quick testing), or Android Studio for a dev build

## Setup

```powershell
cd expo-app
npm install
```

### App icons (first time)

Expo needs image assets. Generate defaults:

```powershell
npx expo customize
# Select: icon, splash, adaptive-icon — or copy assets from a new Expo template:
npx create-expo-app@latest _assets --template blank
Copy-Item _assets\assets\* .\assets\ -Recurse
Remove-Item _assets -Recurse -Force
```

Or place any 1024×1024 PNG at `assets/icon.png` and matching splash/adaptive icons.

## Run

```powershell
npm start
```

Scan the QR code with **Expo Go** (Android/iOS), or press `a` for Android emulator.

### Android APK

Development build (requires Android Studio / SDK):

```powershell
npm run android
```

Release APK (local Gradle build → `dist/bethverse.apk`):

```powershell
npm run build:apk
```

## Project layout

```
expo-app/
  app/           # Expo Router screens (tabs + editor + OCR)
  lib/db.ts      # SQLite — same data model as web IndexedDB
  components/
```

## Web vs Expo vs Flutter

| | Web (`/`) | Expo (`/expo-app`) | Flutter (`/mobile`) |
|---|-----------|-------------------|---------------------|
| Stack | React + Vite | React Native + Expo | Flutter |
| Storage | IndexedDB | SQLite | SQLite |
| OCR | Tesseract.js | Manual + image (see Flutter for ML Kit) | ML Kit on-device |

Backup JSON can be moved between all three via Settings → Export / Import.

## Install on your phone

See **[INSTALL.md](INSTALL.md)** for APK path, Expo Go, and fixing Android NDK if the build fails.

**APK output (after build):** `expo-app\dist\bethverse.apk`
