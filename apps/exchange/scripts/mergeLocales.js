/**
 * Merge Locale Files Script
 * Merges all Angular locale JSON files into single translation.json for each language
 * Supports 17 languages: de, en, es, et_EE, fr, hi_IN, id, it, ja, ko, nl_NL, pl, pt_BR, pt_PT, ru, tr, zh_CN
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language codes to process
const LANGUAGES = [
  'de',
  'en',
  'es',
  'et_EE',
  'fr',
  'hi_IN',
  'id',
  'it',
  'ja',
  'ko',
  'nl_NL',
  'pl',
  'pt_BR',
  'pt_PT',
  'ru',
  'tr',
  'zh_CN',
];

// Source and destination paths
const SOURCE_DIR = path.join(__dirname, '../../locale');
const DEST_DIR = path.join(__dirname, '../src/i18n/locales');

/**
 * Merge all JSON files from a language directory
 */
function mergeLanguageFiles(languageCode) {
  const sourcePath = path.join(SOURCE_DIR, languageCode);
  const destPath = path.join(DEST_DIR, languageCode);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }

  // Read all JSON files in the source directory
  const files = fs.readdirSync(sourcePath).filter((file) => file.endsWith('.json'));

  const merged = {};

  files.forEach((file) => {
    const filePath = path.join(sourcePath, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const data = JSON.parse(content);

      // Use filename (without .json) as the top-level key
      // e.g., app.ui.json becomes { "app.ui": { ... } }
      const key = file.replace('.json', '');

      // For nested structure: app.ui -> { app: { ui: { ... } } }
      // We'll use dot notation keys for simplicity
      merged[key] = data;
    } catch (error) {
      console.error(`Error parsing ${file} in ${languageCode}:`, error.message);
    }
  });

  // Write merged translation file
  const outputPath = path.join(destPath, 'translation.json');
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf8');
  return files.length;
}

/**
 * Main execution
 */
function main() {
  // Ensure destination directory exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  let _totalFiles = 0;
  let _processedLanguages = 0;

  LANGUAGES.forEach((lang) => {
    const sourcePath = path.join(SOURCE_DIR, lang);

    if (fs.existsSync(sourcePath)) {
      const fileCount = mergeLanguageFiles(lang);
      _totalFiles += fileCount;
      _processedLanguages++;
    } else {
      console.warn(`⚠ Warning: ${lang} directory not found at ${sourcePath}`);
    }
  });
}

// Run the script
main();
