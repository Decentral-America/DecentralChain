/**
 * Theme derivation — unit tests
 *
 * The MUI theme and the styled-components theme are two consumers of one token
 * set. These tests pin that they actually agree: the historical bug was three
 * independent systems that only looked similar.
 */
import { describe, expect, it } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { createAppTheme } from '../mui-theme';
import { contrastRatio, tokens } from '../tokens/semantic';

describe('createAppTheme', () => {
  it('takes its palette from the semantic tokens', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = tokens(mode);
      const mui = createAppTheme(mode);
      expect(mui.palette.mode).toBe(mode);
      expect(mui.palette.background.default).toBe(t.surface.base);
      expect(mui.palette.background.paper).toBe(t.surface.raised);
      expect(mui.palette.text.primary).toBe(t.text.primary);
      expect(mui.palette.divider).toBe(t.border.subtle);
    }
  });

  it('produces genuinely different palettes per mode', () => {
    expect(createAppTheme('light').palette.background.default).not.toBe(
      createAppTheme('dark').palette.background.default,
    );
  });
});

describe('styled-components themes', () => {
  it('take the same values as MUI for the same mode', () => {
    // One source, two consumers — if these disagree the app has two looks again.
    expect(lightTheme.colors.background).toBe(tokens('light').surface.base);
    expect(darkTheme.colors.background).toBe(tokens('dark').surface.base);
    expect(lightTheme.colors.text).toBe(tokens('light').text.primary);
    expect(darkTheme.colors.text).toBe(tokens('dark').text.primary);
  });
});

describe('foreground legibility (regression guard)', () => {
  // `colors.secondary` / `palette.secondary.main` are read as a *text* colour
  // in several places — most importantly the word numbers on the seed-phrase
  // backup screen. Task 2 round 1 shipped this pointed at `accent.muted`,
  // which is illegible as foreground text (see task-2-report.md, Fix round
  // 1: ~1.1-1.9:1). This guard pins the fix so it cannot silently regress.
  const SURFACES = ['base', 'raised', 'hover'] as const;

  for (const mode of ['light', 'dark'] as const) {
    const t = tokens(mode);
    const theme = mode === 'light' ? lightTheme : darkTheme;
    const mui = createAppTheme(mode);

    for (const surface of SURFACES) {
      it(`${mode}: styled-components colors.secondary on surface.${surface} clears 4.5:1`, () => {
        expect(contrastRatio(theme.colors.secondary, t.surface[surface])).toBeGreaterThanOrEqual(
          4.5,
        );
      });

      it(`${mode}: MUI palette.secondary.main on surface.${surface} clears 4.5:1`, () => {
        const secondaryMain = mui.palette.secondary.main;
        expect(contrastRatio(secondaryMain, t.surface[surface])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('hover perceptibility (regression guard)', () => {
  // `colors.hover` / `action.hover` must read as a visibly different surface
  // from the resting background — Task 2 round 1 shipped `surface.raised`,
  // which measured ~1.06-1.07:1 against `surface.base` (imperceptible; see
  // task-2-report.md, Fix round 1). This does not need AA text contrast —
  // it is a background wash, not text — but it must clear a small,
  // deliberately-chosen floor so a future edit cannot flatten it back out.
  const PERCEPTIBLE_FLOOR = 1.1;

  for (const mode of ['light', 'dark'] as const) {
    const t = tokens(mode);
    const theme = mode === 'light' ? lightTheme : darkTheme;
    const mui = createAppTheme(mode);

    it(`${mode}: styled-components colors.hover is perceptibly different from colors.background`, () => {
      // `colors.hover` is optional in DefaultTheme's type (styled.d.ts); both
      // themes always set it, so the assertion below is the real check.
      expect(theme.colors.hover).toBeDefined();
      expect(contrastRatio(theme.colors.hover!, theme.colors.background)).toBeGreaterThan(
        PERCEPTIBLE_FLOOR,
      );
    });

    it(`${mode}: MUI action.hover is perceptibly different from background.default`, () => {
      const actionHover = mui.palette.action.hover;
      expect(contrastRatio(actionHover, mui.palette.background.default)).toBeGreaterThan(
        PERCEPTIBLE_FLOOR,
      );
    });

    it(`${mode}: surface.hover token itself clears the floor against surface.base`, () => {
      expect(contrastRatio(t.surface.hover, t.surface.base)).toBeGreaterThan(PERCEPTIBLE_FLOOR);
    });
  }
});
