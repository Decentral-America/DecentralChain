/**
 * One locale tree (public/locales, served to i18next-http-backend), and every
 * locale covers every English key. `pendingTranslations.json` is the only
 * escape hatch for strings still waiting on a translator; it is empty and the
 * test keeps it that way unless an entry is genuinely still missing from a
 * listed locale (a finished translation must be removed from the list).
 * For the sections translated in the audit remediation (landing page, account
 * manager, save-seed, the generic deposit modal) interpolation tokens must
 * also survive translation intact.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import pendingFile from '../pendingTranslations.json';

const pending = pendingFile as { keys: string[][]; locales: string[] };

type Tree = { [key: string]: Tree | string | string[] };

const LOCALES = path.resolve(import.meta.dirname, '../../../public/locales');
const load = (locale: string): Tree =>
  JSON.parse(readFileSync(path.join(LOCALES, locale, 'translation.json'), 'utf8')) as Tree;
const isTree = (value: unknown): value is Tree =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const leaves = (node: Tree, prefix: string[] = []): [string, string | string[]][] =>
  Object.entries(node).flatMap(([key, value]) =>
    isTree(value)
      ? leaves(value, [...prefix, key])
      : [[JSON.stringify([...prefix, key]), value] as [string, string | string[]]],
  );
const leafMap = (locale: string) => new Map(leaves(load(locale)));
const tokens = (value: string | string[]): string =>
  [
    ...[value]
      .flat()
      .join('\u0000')
      .matchAll(/\{\{[^}]+\}\}/g),
  ]
    .map((m) => m[0])
    .sort()
    .join('|');

const AUDITED_PREFIXES = [
  ['app', 'landing'],
  ['app', 'accountManager'],
  ['app', 'saveSeed'],
];
const isAudited = (key: string): boolean => {
  const segs = JSON.parse(key) as string[];
  const deposit = segs.length === 5 && segs.slice(0, 4).join('.') === 'app.utils.modal.deposit';
  return deposit || AUDITED_PREFIXES.some((prefix) => prefix.every((seg, i) => segs[i] === seg));
};

const en = leafMap('en');
const locales = readdirSync(LOCALES).filter((locale) => locale !== 'en');
const pendingKeys = new Set(pending.keys.map((key) => JSON.stringify(key)));
const pendingLocales = new Set(pending.locales);

describe('exchange locale coverage', () => {
  it('ships a single locale tree', () => {
    expect(existsSync(path.resolve(import.meta.dirname, '../locales'))).toBe(false);
    expect(locales.length).toBe(16);
  });

  it('has no English-only strings pending translation', () => {
    expect(pending.keys).toEqual([]);
    expect(pending.locales).toEqual([]);
  });

  it.each(locales)('%s has no key English lacks', (locale) => {
    expect([...leafMap(locale).keys()].filter((key) => !en.has(key))).toEqual([]);
  });

  it.each(locales)('%s covers English except recorded pending keys', (locale) => {
    const have = leafMap(locale);
    const allowed = pendingLocales.has(locale) ? pendingKeys : new Set<string>();
    expect([...en.keys()].filter((key) => !have.has(key) && !allowed.has(key))).toEqual([]);
  });

  it.each(locales)('%s keeps the interpolation tokens of the audited sections', (locale) => {
    const have = leafMap(locale);
    const drifted = [...en].filter(([key, value]) => {
      if (!isAudited(key)) return false;
      const translated = have.get(key);
      return translated !== undefined && tokens(translated) !== tokens(value);
    });
    expect(drifted.map(([key]) => key)).toEqual([]);
  });

  it('Spanish is complete', () => {
    expect(pendingLocales.has('es')).toBe(false);
  });
});
