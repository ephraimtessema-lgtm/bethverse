import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const buildGradle = path.join(root, 'node_modules', 'react-native-tesseract-ocr', 'android', 'build.gradle');
const moduleJava = path.join(
  root,
  'node_modules',
  'react-native-tesseract-ocr',
  'android',
  'src',
  'main',
  'java',
  'com',
  'reactlibrary',
  'TesseractOcrModule.java',
);

if (!fs.existsSync(buildGradle)) {
  process.exit(0);
}

const patched = `// Patched for modern Android Gradle Plugin by scripts/patch-tesseract-module.mjs.
def DEFAULT_COMPILE_SDK_VERSION = 35
def DEFAULT_MIN_SDK_VERSION = 24
def DEFAULT_TARGET_SDK_VERSION = 34

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

apply plugin: 'com.android.library'

android {
    namespace 'com.reactlibrary'
    compileSdk safeExtGet('compileSdkVersion', DEFAULT_COMPILE_SDK_VERSION)

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', DEFAULT_MIN_SDK_VERSION)
        targetSdkVersion safeExtGet('targetSdkVersion', DEFAULT_TARGET_SDK_VERSION)
        versionCode 1
        versionName "1.0"
    }
}

repositories {
    mavenCentral()
    mavenLocal()
    google()
}

dependencies {
    implementation 'com.facebook.react:react-android'
    implementation 'com.rmtheis:tess-two:9.1.0'
}
`;

const current = fs.readFileSync(buildGradle, 'utf8');
if (current !== patched) {
  fs.writeFileSync(buildGradle, patched);
  console.log('Patched react-native-tesseract-ocr for Android Gradle Plugin compatibility');
}

if (fs.existsSync(moduleJava)) {
  let java = fs.readFileSync(moduleJava, 'utf8');
  let changed = false;

  const externalImport = 'import android.os.Environment;\n';
  if (java.includes(externalImport)) {
    java = java.replace(externalImport, '');
    changed = true;
  }

  const oldDataPath = '    private static String DATA_PATH = Environment.getExternalStorageDirectory().toString();';
  const newDataPath = '    private String DATA_PATH;';
  if (java.includes(oldDataPath)) {
    java = java.replace(oldDataPath, newDataPath);
    changed = true;
  }

  const oldConstructor = `        if (!this.DATA_PATH.contains(reactContext.getPackageName())) {
            this.DATA_PATH += File.separator + reactContext.getPackageName();
        }
        this.TESS_FILES_PATH = this.DATA_PATH + File.separator + this.TESS_FILES_DIRECTORY;`;
  const newConstructor = `        this.DATA_PATH = reactContext.getFilesDir().getAbsolutePath();
        this.TESS_FILES_PATH = this.DATA_PATH + File.separator + this.TESS_FILES_DIRECTORY;`;
  if (java.includes(oldConstructor)) {
    java = java.replace(oldConstructor, newConstructor);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(moduleJava, java);
    console.log('Patched react-native-tesseract-ocr to store tessdata in app-private files');
  }
}
