import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getRide(filename) {
  return fs.readFileSync(path.resolve(__dirname, filename), 'utf8');
}
