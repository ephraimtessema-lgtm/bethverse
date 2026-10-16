# Install BethVerse on your phone

## Can't install Android Studio?

**You cannot fix the Android SDK/NDK in a web browser.** Google does not offer a browser-only SDK installer.

You still have these options:

| Option | Android Studio? | Standalone app on phone? |
|--------|-----------------|---------------------------|
| **Expo Go** (below) | No | No (runs inside Expo Go) |
| **EAS cloud build** (below) | No | Yes — download APK from a link |
| **Local `npm run build:apk`** | Yes (or manual SDK zips) | Yes |

---

## Option A — No Android Studio: Expo Go (easiest)

1. On your phone: install **[Expo Go](https://expo.dev/go)** from the Play Store.
2. On your PC (Node.js only — no Android Studio):

```powershell
cd "C:\Users\Eph Tess\All projects\BethVerse\expo-app"
npm install
npm start
```

3. Scan the QR code with Expo Go. Phone and PC must use the **same Wi‑Fi**.

**SDK mismatch?** If Expo Go says “Project is incompatible” (e.g. phone has SDK 54, project was SDK 52), this project is now **SDK 54**. Run `npm install` in `expo-app`, then `npm start` again and rescan.

### If `expo-asset cannot be found`

```powershell
cd "C:\Users\Eph Tess\All projects\BethVerse\expo-app"
npx expo install expo-asset expo-font expo-linking
npm start
```

### If `ENOTFOUND registry.npmjs.org` (network error)

Your PC cannot reach the npm download server. Fix connectivity first:

1. Confirm the internet works in a browser (open https://www.npmjs.com).
2. Turn off VPN/proxy temporarily, or set npm proxy if you use one:
   ```powershell
   npm config delete proxy
   npm config delete https-proxy
   ```
3. Try another network (phone hotspot).
4. Change DNS to **8.8.8.8** (Google) in Windows network settings.
5. Then run `npm install` again in `expo-app`.

Until npm works, neither `npm start` nor `eas-cli` can download packages.

---

## Option B — No Android Studio: Cloud APK (EAS Build)

Build runs on Expo’s servers. You download the APK from your **browser** at [expo.dev](https://expo.dev).

1. Create a free account at **https://expo.dev/signup**
2. On your PC:

```powershell
cd "C:\Users\Eph Tess\All projects\BethVerse\expo-app"
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build -p android --profile preview
```

3. When the build finishes, open the **build URL** in Chrome/Edge and tap **Download** for the `.apk`.
4. Copy the APK to your phone and install it.

Free tier has limits; first build may take ~10–20 minutes.

**Flutter (`mobile/`)** has no built-in cloud config in this repo. Without Android Studio you’d need a service like [Codemagic](https://codemagic.io) or GitHub Actions — or use the **Expo** app above.

---

## Option C — Local APK (needs Android SDK on PC)

Requires Android Studio **or** command-line SDK tools (not a browser).

## Paths

| Item | Path |
|------|------|
| Expo app source | `C:\Users\Eph Tess\All projects\BethVerse\expo-app` |
| **APK after build** | `C:\Users\Eph Tess\All projects\BethVerse\expo-app\dist\bethverse.apk` |

The APK file is created only after a successful build (see below).

---

### 1. Fix Android NDK (one-time)

If `npm run build:apk` fails with **NDK … did not have a source.properties file**:

1. Open **Android Studio** → **Settings** → **Languages & Frameworks** → **Android SDK** → **SDK Tools**
2. Check **NDK (Side by side)** → **Apply** (let it finish downloading)
3. Or delete the broken folder and reinstall:
   - Delete: `%LOCALAPPDATA%\Android\Sdk\ndk\26.1.10909125`
   - In SDK Tools, install NDK again

### 2. Build the APK

```powershell
cd "C:\Users\Eph Tess\All projects\BethVerse\expo-app"
npm install
npm run build:apk
```

Debug build (faster, for testing only):

```powershell
npm run build:apk:debug
```

Output: **`expo-app\dist\bethverse.apk`**

### 3. Copy to your phone

- USB: copy `bethverse.apk` to **Downloads**
- Or send via Google Drive / email / WhatsApp

### 4. Install on Android

1. Open the APK file on the phone
2. Allow **Install unknown apps** if prompted
3. Tap **Install**

---

## Flutter app (alternative)

Path: `C:\Users\Eph Tess\All projects\BethVerse\mobile`

Requires [Flutter SDK](https://docs.flutter.dev/get-started/install). APK output:

`mobile\build\app\outputs\flutter-apk\app-release.apk`
