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

/**
 * The listing link was stripped from the 1_0_25 changelog line with a regex.
 * These checks make sure that rewrite only touched the link markup: the line
 * is still a well-formed `{span.line}[...]` string in every locale. (Key
 * completeness is enforced by src/i18n/__tests__/localeCoverage.test.ts.)
 */
function find(obj: unknown, key: string, out: string[] = []): string[] {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === key && typeof v === 'string') out.push(v);
      else find(v, key, out);
    }
  }
  return out;
}

describe('locale files after the link removal', () => {
  const locales = readdirSync(path.join(APP, 'public/locales'));

  it.each(locales)('%s 1_0_25 is a clean changelog line', (locale) => {
    const json = JSON.parse(
      readFileSync(path.join(APP, 'public/locales', locale, 'translation.json'), 'utf8'),
    );
    const values = find(json, '1_0_25');
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toContain('Cubensis Connect');
      expect(value).not.toContain('http');
      expect(value.split('[').length).toBe(value.split(']').length);
    }
  });
});
