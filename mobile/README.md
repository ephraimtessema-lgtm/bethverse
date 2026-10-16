# BethVerse Mobile (Flutter / Android)

**Fully offline** poetry vault. No login, no cloud, no Base44 — all poems and collections are stored locally on your device in SQLite.

## Features

- Works **without internet** (no network permissions required for core use)
- Poems, collections, favorites, archive, insights
- Auto-saving editor
- **On-device OCR** (Google ML Kit) to scan text from photos
- PIN lock + optional fingerprint / face unlock
- Export / import JSON backups (share to Files, Drive, etc.)
- Light / dark theme and font choices

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.16+
- Android SDK (device or emulator)

## Setup

```powershell
cd mobile
.\scripts\setup.ps1
# or: flutter create . --project-name bethverse && flutter pub get
```

## Run

If `flutter` is not recognized, use the full path (or add Flutter to PATH — see below):

```powershell
& "$env:USERPROFILE\Downloads\flutter_windows_3.44.1-stable\flutter\bin\flutter.bat" run
```

## Build release APK

**Easy (no PATH needed):**

```powershell
cd mobile
.\scripts\build-apk.ps1
```

Output: `mobile\dist\bethverse-flutter.apk`

**Or manually:**

```powershell
& "$env:USERPROFILE\Downloads\flutter_windows_3.44.1-stable\flutter\bin\flutter.bat" build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Add Flutter to PATH (optional)

Windows → search **Environment Variables** → **Path** → **New** → add:

`C:\Users\Eph Tess\Downloads\flutter_windows_3.44.1-stable\flutter\bin`

Close and reopen PowerShell, then `flutter` will work everywhere.

## Data storage

| Data | Location |
|------|----------|
| Poems & collections | SQLite `bethverse.db` in app documents |
| Theme, PIN, preferences | `shared_preferences` |

Uninstalling the app removes all data unless you exported a backup first.

## Tech stack

- **Flutter** + **Riverpod** + **go_router**
- **sqflite** — local database
- **google_mlkit_text_recognition** — offline OCR
- **shared_preferences** — settings
- **local_auth** — biometrics

## Web & Expo apps

The React web app (repo root) and Expo app (`../expo-app`) are also offline-only. This Flutter app does not auto-sync with them — use **Settings → Export / Import JSON** to move backups between apps.
