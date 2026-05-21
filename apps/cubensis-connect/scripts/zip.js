import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { zip } from 'zip-a-folder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_FOLDER = path.resolve(__dirname, '..', 'dist');

// Source maps are generated with `sourcemap: 'hidden'` for Sentry/DevTools use,
// but must NOT be shipped inside the extension package (security: source exposure).
const ZIP_EXCLUDE = ['**/*.map'];

// Top-level await — ESM module. Using Promise.all so every platform zip runs
// concurrently and any single failure propagates immediately (unlike forEach(async)
// which silently drops promise rejections).
const platforms = JSON.parse(await readFile(path.resolve(__dirname, './platforms.json'), 'utf8'));

await Promise.all(
  platforms.map((platformName) =>
    zip(
      path.resolve(DIST_FOLDER, platformName),
      path.resolve(
        DIST_FOLDER,
        // Use || (not ??) so an empty-string CUBENSIS_VERSION also falls back.
        `cubensis-connect-${process.env.CUBENSIS_VERSION || 'local'}-${platformName}.zip`,
      ),
      { exclude: ZIP_EXCLUDE },
    ),
  ),
);
