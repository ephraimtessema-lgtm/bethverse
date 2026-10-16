/**
 * Builds a sideloadable Android APK locally (no EAS account required).
 * Output: expo-app/dist/bethverse.apk
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const isDebug = process.argv.includes('--debug');
const variant = isDebug ? 'debug' : 'release';
const apkName = isDebug ? 'app-debug.apk' : 'app-release.apk';

const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');

if (!fs.existsSync(sdk)) {
  console.error('Android SDK not found. Install Android Studio or set ANDROID_HOME.');
  process.exit(1);
}

process.env.ANDROID_HOME = sdk;
process.env.ANDROID_SDK_ROOT = sdk;

const assetsDir = path.join(root, 'assets');
const icon = path.join(assetsDir, 'icon.png');
if (!fs.existsSync(icon)) {
  console.log('Creating default assets…');
  execSync('powershell -ExecutionPolicy Bypass -File scripts/create-assets.ps1', {
    cwd: root,
    stdio: 'inherit',
  });
}

const androidDir = path.join(root, 'android');
if (!fs.existsSync(androidDir)) {
  console.log('Running expo prebuild…');
  execSync('npx expo prebuild --platform android --no-install', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
  });
}

function copyTessdata() {
  const srcDir = path.join(root, 'tessdata');
  if (!fs.existsSync(srcDir)) return;

  const destDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'tessdata');
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.traineddata')) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }
}

function ensureGradleVersion(dir) {
  const props = path.join(dir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
  if (!fs.existsSync(props)) return;
  let content = fs.readFileSync(props, 'utf8');
  let changed = false;
  if (!content.includes('gradle-8.13-bin.zip')) {
    content = content.replace(/gradle-[\d.]+-(all|bin)\.zip/g, 'gradle-8.13-bin.zip');
    changed = true;
  }
  if (!content.includes('networkTimeout=300000')) {
    content = content.replace(/networkTimeout=\d+/g, 'networkTimeout=300000');
    if (!content.includes('networkTimeout=')) {
      content = content.replace(
        /distributionUrl=.*\n/,
        (m) => m + 'networkTimeout=300000\n',
      );
    }
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(props, content);
    console.log('Updated Gradle wrapper to 8.13-bin (60s timeout)');
  }
}

ensureGradleVersion(androidDir);
execSync('node scripts/download-tessdata.mjs', {
  cwd: root,
  stdio: 'inherit',
});
copyTessdata();
execSync('node scripts/patch-tesseract-module.mjs', {
  cwd: root,
  stdio: 'inherit',
});
execSync('node scripts/patch-expo-modules-core.mjs', {
  cwd: root,
  stdio: 'inherit',
});

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const task = isDebug ? 'assembleDebug' : 'assembleRelease';

console.log(`Building ${variant} APK…`);
execSync(`${gradlew} ${task}`, {
  cwd: androidDir,
  stdio: 'inherit',
  env: process.env,
});

const built = path.join(androidDir, 'app', 'build', 'outputs', 'apk', variant, apkName);
const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });
const out = path.join(distDir, 'bethverse.apk');
fs.copyFileSync(built, out);

console.log('');
console.log('APK ready:');
console.log(out);
console.log('');
console.log('Copy to your phone and install (enable Install unknown apps if prompted).');
