/**
 * Semantic tokens — unit tests
 *
 * These pin the two properties that make dark mode real rather than nominal:
 * every token exists in both modes, and text on its own surface clears WCAG AA.
 * A missing dark value is how a "dark mode" ends up with white-on-white text.
 */
import { describe, expect, it } from 'vitest';
import { contrastRatio, SEMANTIC_TOKENS, type SemanticTokens, tokens } from '../semantic';

const MODES = ['light', 'dark'] as const;

/** Walk a token tree to `group.name` leaf paths. */
const leaves = (t: SemanticTokens): string[] =>
  Object.entries(t).flatMap(([group, vals]) =>
    Object.keys(vals as Record<string, string>).map((k) => `${group}.${k}`),
  );

describe('SEMANTIC_TOKENS', () => {
  it('defines both modes', () => {
    expect(Object.keys(SEMANTIC_TOKENS).sort()).toEqual(['dark', 'light']);
  });

  it('defines exactly the same token paths in both modes', () => {
    // A path present in one mode and missing in the other is the bug this
    // whole module exists to prevent.
    expect(leaves(SEMANTIC_TOKENS.light).sort()).toEqual(leaves(SEMANTIC_TOKENS.dark).sort());
  });

  it('gives every token a non-empty value in both modes', () => {
    for (const mode of MODES) {
      for (const [group, vals] of Object.entries(SEMANTIC_TOKENS[mode])) {
        for (const [name, value] of Object.entries(vals as Record<string, string>)) {
          expect(value, `${mode}.${group}.${name}`).toBeTruthy();
        }
      }
    }
  });

  it('never reuses a light value for a dark surface', () => {
    // Catches a copy-paste that leaves dark mode looking like light mode.
    expect(SEMANTIC_TOKENS.dark.surface.base).not.toBe(SEMANTIC_TOKENS.light.surface.base);
    expect(SEMANTIC_TOKENS.dark.text.primary).not.toBe(SEMANTIC_TOKENS.light.text.primary);
  });
});

describe('tokens()', () => {
  it('returns the set for the requested mode', () => {
    expect(tokens('light')).toBe(SEMANTIC_TOKENS.light);
    expect(tokens('dark')).toBe(SEMANTIC_TOKENS.dark);
  });
});

describe('contrastRatio', () => {
  it('computes the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });

  it('is order-independent', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(contrastRatio('#abcdef', '#123456'), 5);
  });

  // Documented hex-only. Before this guard, a non-hex string fell through to
  // `Number.parseInt` on the wrong slice and returned `NaN` — which happens
  // to fail every `toBeGreaterThanOrEqual` comparison, so no test was ever
  // fooled, but silently and only by accident. See task-8-report.md, Finding 4.
  it('fails loudly on a translucent colour instead of returning NaN', () => {
    expect(() => contrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff')).toThrow(/hex/i);
    expect(() => contrastRatio('#ffffff', 'rgb(0, 0, 0)')).toThrow(/hex/i);
  });

  it('fails loudly on any other non-hex input', () => {
    expect(() => contrastRatio('white', '#000000')).toThrow(/hex/i);
  });
});

describe('WCAG AA on every surface', () => {
  // Body text must clear 4.5:1; secondary and tertiary are still body-sized
  // in this app, so they are held to the same bar rather than the 3:1
  // large-text allowance.
  for (const mode of MODES) {
    for (const surface of ['base', 'raised', 'sunken'] as const) {
      for (const level of ['primary', 'secondary', 'tertiary'] as const) {
        it(`${mode}: text.${level} on surface.${surface}`, () => {
          const t = tokens(mode);
          expect(contrastRatio(t.text[level], t.surface[surface])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }
});
