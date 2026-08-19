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
  // `colors.secondary` is read as a *background* in ~10 consumers (see the
  // "background legibility" guard below) — it cannot also be foreground-
  // legible text, proven in task-2-report.md Fix round 1. Fix round 2 split
  // the two roles: `colors.textMuted` is the dedicated foreground token, read
  // by the four real foreground consumers (SeedBackup's `Description` and
  // `WordNumber`, ChartPlate's `Subtitle`, Transactions' `lease` label). MUI
  // has no equivalent split to make — its consumers of the muted-text role
  // already read `text.secondary` directly (e.g. `color="text.secondary"`),
  // which Task 1's WCAG suite already pins.
  const SURFACES = ['base', 'raised', 'hover'] as const;

  for (const mode of ['light', 'dark'] as const) {
    const t = tokens(mode);
    const theme = mode === 'light' ? lightTheme : darkTheme;

    for (const surface of SURFACES) {
      it(`${mode}: styled-components colors.textMuted on surface.${surface} clears 4.5:1`, () => {
        expect(contrastRatio(theme.colors.textMuted, t.surface[surface])).toBeGreaterThanOrEqual(
          4.5,
        );
      });
    }
  }
});

describe('background legibility (regression guard)', () => {
  // `colors.secondary` / `palette.secondary.main` are read as a *background*
  // in ~10 consumers (InfoRow, OrderRow, CodeBadge, ...), several of which
  // render `colors.text` / `text.primary` directly on top. Fix round 1
  // pointed `colors.secondary` at a foreground-legible token and silently
  // broke this pairing (4.68 -> 2.06 in light mode; see task-2-report.md,
  // Fix round 2). This guard pins the restored pairing so it cannot regress
  // again in either direction.
  for (const mode of ['light', 'dark'] as const) {
    const t = tokens(mode);
    const theme = mode === 'light' ? lightTheme : darkTheme;
    const mui = createAppTheme(mode);

    it(`${mode}: colors.text on colors.secondary (styled-components) clears 4.5:1`, () => {
      expect(contrastRatio(theme.colors.text, theme.colors.secondary)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${mode}: palette.text.primary on palette.secondary.main (MUI) clears 4.5:1`, () => {
      expect(
        contrastRatio(mui.palette.text.primary, mui.palette.secondary.main),
      ).toBeGreaterThanOrEqual(4.5);
    });

    it(`${mode}: styled-components and MUI agree on colors.secondary / secondary.main`, () => {
      // One source, two consumers, once more — this is the pairing that
      // regressed silently in round 1 because nothing pinned it.
      expect(theme.colors.secondary).toBe(t.accent.muted);
      expect(mui.palette.secondary.main).toBe(t.accent.muted);
    });

    it(`${mode}: colors.secondary is a 6-digit hex (consumers append alpha suffixes)`, () => {
      // Transactions.tsx (\`\${secondary}20\`), UserOrders.tsx (\`cc\`),
      // TradeHistory.tsx (\`30\`), and LanguageSwitcher.tsx (\`dd\`) all
      // concatenate a 2-digit alpha directly onto this value. An 8- or
      // 4-digit token here would silently produce an invalid colour string.
      expect(theme.colors.secondary).toMatch(/^#[0-9a-f]{6}$/i);
    });
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
