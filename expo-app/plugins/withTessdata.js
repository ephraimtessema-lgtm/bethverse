const { withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies tessdata/*.traineddata into Android assets for react-native-tesseract-ocr.
 */
function withTessdata(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const srcDir = path.join(projectRoot, 'tessdata');
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets',
        'tessdata',
      );

      if (!fs.existsSync(srcDir)) {
        console.warn('[withTessdata] tessdata/ folder missing — Amharic OCR will not work.');
        return config;
      }

      fs.mkdirSync(destDir, { recursive: true });
      for (const file of fs.readdirSync(srcDir)) {
        if (file.endsWith('.traineddata')) {
          fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
          console.log(`[withTessdata] copied ${file}`);
        }
      }
      return config;
    },
  ]);
}

module.exports = createRunOncePlugin(withTessdata, 'withTessdata');
