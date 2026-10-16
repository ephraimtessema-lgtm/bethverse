# Flutter — get the app on your phone

## What was breaking

| Problem | Fix |
|---------|-----|
| `flutter` not recognized | Use the script below |
| NDK missing | Android Studio SDK Manager |
| **`'C:\Users\Eph' is not recognized`** | Your Windows username has a **space** (`Eph Tess`). Flutter breaks on that. The script uses `subst` to fix it. |

The Flutter **code is fine**. The PC path with a space in your name breaks the build.

---

## Step 0 — Turn on Developer Mode (required once)

Windows needs this for Flutter plugins:

1. Press **Win + I** → **Privacy & security** → **For developers**
2. Turn **Developer Mode** **On**
3. Confirm if asked

Or run: `start ms-settings:developers`

---

## Step 1 — Install NDK (Android Studio)

1. Open **Android Studio**
2. **More Actions** → **SDK Manager**
3. Open the **SDK Tools** tab
4. Check **NDK (Side by side)**
5. Click **Apply** → wait until it says finished (**no errors**)

---

## Step 2 — Build the APK

Open **PowerShell**:

```powershell
cd "C:\Users\Eph Tess\All projects\BethVerse\mobile"
powershell -ExecutionPolicy Bypass -File .\scripts\build-apk.ps1
```

Wait **10–20 minutes** the first time.

---

## Step 3 — Install on phone

File:

```
C:\Users\Eph Tess\All projects\BethVerse\mobile\dist\bethverse-flutter.apk
```

Copy to your phone → open → Install.

---

## Do NOT type `flutter` directly

It is not on your PATH. Always use **Step 2** (the script finds Flutter for you).
