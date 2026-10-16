import { createWorker, PSM } from 'tesseract.js';

const LANG_MAP = {
  auto: 'eng',
  english: 'eng',
  french: 'fra',
  spanish: 'spa',
  arabic: 'ara',
  portuguese: 'por',
  german: 'deu',
  italian: 'ita',
  chinese: 'chi_sim',
  japanese: 'jpn',
};

const QUALITY_PRESETS = {
  fast: {
    psm: PSM.SINGLE_BLOCK,
    upscaleMinWidth: 0,
  },
  balanced: {
    psm: PSM.AUTO,
    upscaleMinWidth: 0,
  },
  accurate: {
    psm: PSM.AUTO,
    upscaleMinWidth: 1400,
  },
};

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function prepareImage(file, quality) {
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.balanced;
  if (!preset.upscaleMinWidth) return file;

  const img = await loadImage(file);
  if (img.width >= preset.upscaleMinWidth) return file;

  const scale = preset.upscaleMinWidth / img.width;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || file), 'image/png');
  });
}

/**
 * Extract text from an image file using on-device OCR (no network).
 */
export async function extractTextFromImage(file, { language = 'auto', quality = 'balanced', onProgress } = {}) {
  const lang = LANG_MAP[language] || 'eng';
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.balanced;
  const prepared = await prepareImage(file, quality);

  const worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round((m.progress || 0) * 100));
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: preset.psm,
      preserve_interword_spaces: quality === 'accurate' ? '1' : '0',
    });
    const { data } = await worker.recognize(prepared);
    return {
      text: (data.text || '').trim(),
      confidence: data.confidence ?? null,
    };
  } finally {
    await worker.terminate();
  }
}
