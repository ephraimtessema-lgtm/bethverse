import { NativeModules } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export type OcrResult = {
  text: string;
  confidence: number;
  /** False when running in Expo Go — install the built APK for on-device OCR. */
  nativeAvailable: boolean;
};

const LANG_MAP: Record<string, string> = {
  amharic: 'amh',
  auto: 'amh',
  english: 'eng',
  arabic: 'ara',
  french: 'fra',
  spanish: 'spa',
  portuguese: 'por',
  german: 'deu',
  italian: 'ita',
};

/** True only in a dev/production build that includes react-native-tesseract-ocr. */
export function isOcrNativeAvailable(): boolean {
  return Boolean(NativeModules.TesseractOcr);
}

async function prepareImage(uri: string, quality: string): Promise<string> {
  const source = uri.startsWith('file://') ? uri : uri;
  if (quality === 'fast') {
    const out = await ImageManipulator.manipulateAsync(
      source,
      [{ resize: { width: 960 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    return out.uri;
  }
  if (quality === 'accurate') {
    const out = await ImageManipulator.manipulateAsync(
      source,
      [{ resize: { width: 1800 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG },
    );
    return out.uri;
  }
  return source;
}

function normalizeUri(uri: string): string {
  return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
}

export async function extractTextFromImageUri(
  uri: string,
  options: { language?: string; quality?: string } = {},
): Promise<OcrResult> {
  if (!isOcrNativeAvailable()) {
    return { text: '', confidence: 0, nativeAvailable: false };
  }

  const prepared = await prepareImage(uri, options.quality ?? 'balanced');
  const imagePath = normalizeUri(prepared);

  const TesseractOcr = require('react-native-tesseract-ocr').default as {
    recognize: (path: string, language: string, opts: object) => Promise<string>;
  };

  const requestedLanguage = options.language ?? 'amharic';
  const languages = requestedLanguage === 'auto' ? ['amh', 'eng'] : [LANG_MAP[requestedLanguage] ?? 'amh'];
  const results = await Promise.all(
    languages.map((language) => TesseractOcr.recognize(imagePath, language, {})),
  );
  const text = results
    .map((result) => (result ?? '').trim())
    .sort((a, b) => b.length - a.length)[0] ?? '';
  return {
    text,
    confidence: text ? 75 : 0,
    nativeAvailable: true,
  };
}
