/**
 * Downloads Tesseract traineddata files required for on-device OCR (Amharic + English).
 * Run automatically before APK builds; files land in expo-app/tessdata/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tessDir = path.join(__dirname, '..', 'tessdata');

const FILES = [
  {
    name: 'amh.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/amh.traineddata',
  },
  {
    name: 'eng.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata',
  },
  {
    name: 'ara.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/ara.traineddata',
  },
  {
    name: 'fra.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/fra.traineddata',
  },
  {
    name: 'spa.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/spa.traineddata',
  },
  {
    name: 'por.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/por.traineddata',
  },
  {
    name: 'deu.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/deu.traineddata',
  },
  {
    name: 'ita.traineddata',
    url: 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/ita.traineddata',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.rmSync(dest, { force: true });
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.rmSync(dest, { force: true });
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(undefined);
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function main() {
  fs.mkdirSync(tessDir, { recursive: true });
  for (const { name, url } of FILES) {
    const dest = path.join(tessDir, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100_000) {
      console.log(`[tessdata] ${name} already present`);
      continue;
    }
    console.log(`[tessdata] Downloading ${name}…`);
    await download(url, dest);
    console.log(`[tessdata] Saved ${name} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
  }
  console.log('[tessdata] Ready.');
}

main().catch((err) => {
  console.error('[tessdata] Download failed:', err.message);
  process.exit(1);
});
