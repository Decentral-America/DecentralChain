/**
 * The exchange once sent "Install Cubensis Connect" clicks to a different
 * vendor's wallet listing. No source file or locale may carry that listing id
 * or the Waves-fork extension slug again.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = path.resolve(import.meta.dirname, '../../..');
const FORBIDDEN = ['lpilbniiabackdjcionkobglmddfbcjo', 'decentralchain-keeper'];

function files(dir: string, accept: (file: string) => boolean): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : files(full, accept);
    return accept(full) ? [full] : [];
  });
}

describe('third-party wallet links', () => {
  const sources = [
    ...files(path.join(APP, 'src'), (f) => /\.(ts|tsx|json)$/.test(f)),
    ...files(path.join(APP, 'public/locales'), (f) => f.endsWith('.json')),
  ];

  it('scans a non-trivial set of files', () => {
    expect(sources.length).toBeGreaterThan(100);
  });

  it('no file references the foreign extension listing', () => {
    const offenders = sources.filter((file) => {
      const text = readFileSync(file, 'utf8');
      return FORBIDDEN.some((needle) => text.includes(needle));
    });
    expect(offenders.map((f) => path.relative(APP, f))).toEqual([]);
  });
});
