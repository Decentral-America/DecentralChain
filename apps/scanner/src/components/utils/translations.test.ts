/**
 * `t()` falls back to the raw key, so a missing key renders as "nfts" or
 * "failedToLoadTransaction" on the live site. Every literal key passed to t()
 * must exist in English, and Spanish must cover every English key.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { translations } from './translations';

const SRC = path.resolve(import.meta.dirname, '../..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.(ts|tsx)$/.test(entry) || /\.test\./.test(entry) || entry === 'translations.tsx')
      return [];
    return [full];
  });
}

const usedKeys = new Set(
  sourceFiles(SRC).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([A-Za-z0-9_]+)'/g)].map(
      (m) => m[1] as string,
    ),
  ),
);

describe('scanner translations', () => {
  it('finds the keys the pages use', () => {
    expect(usedKeys.size).toBeGreaterThan(250);
  });

  it('defines every key passed to t() in English', () => {
    expect([...usedKeys].filter((key) => !(key in translations.en)).sort()).toEqual([]);
  });

  it('defines every English key in Spanish', () => {
    expect(
      Object.keys(translations.en)
        .filter((key) => !(key in translations.es))
        .sort(),
    ).toEqual([]);
  });
});
