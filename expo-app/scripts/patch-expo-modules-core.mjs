import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const patches = [
  {
    file: path.join(root, 'node_modules', 'expo-modules-core', 'android', 'CMakeLists.txt'),
    target: String.raw`\$\{PACKAGE_NAME\}`,
  },
  {
    file: path.join(root, 'node_modules', 'expo-sqlite', 'android', 'CMakeLists.txt'),
    target: String.raw`\$\{PACKAGE_NAME\}`,
  },
  {
    file: path.join(root, 'node_modules', 'react-native-screens', 'android', 'CMakeLists.txt'),
    target: 'rnscreens',
  },
  {
    file: path.join(root, 'node_modules', 'react-native-safe-area-context', 'android', 'src', 'main', 'jni', 'CMakeLists.txt'),
    target: String.raw`\$\{LIB_TARGET_NAME\}`,
  },
  {
    file: path.join(root, 'node_modules', 'react-native-svg', 'android', 'src', 'main', 'jni', 'CMakeLists.txt'),
    target: 'react_codegen_rnsvg',
  },
];

for (const { file: cmakeFile, target } of patches) {
  if (!fs.existsSync(cmakeFile)) {
    continue;
  }

  let content = fs.readFileSync(cmakeFile, 'utf8');
  const targetPattern = new RegExp(`target_link_libraries\\(\\s*${target}(?!\\s*\\n\\s*c\\+\\+_shared)`, 'g');
  const next = content.replace(
    targetPattern,
    (match) => `${match}\n  c++_shared`,
  );

  if (next !== content) {
    content = next;
    fs.writeFileSync(cmakeFile, content);
    console.log(`Patched ${path.relative(root, cmakeFile)} to link c++_shared explicitly`);
  }
}
