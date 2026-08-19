/**
 * Swap — both-mode contrast
 *
 * `Swap.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas` — but it does
 * import `palette.mist`/`palette.periwinkleWash` from `@/styles/tokens`,
 * fixed light-only literals used as the `TokenField`/`DetailRow` panel
 * backgrounds. Those panels hold `text.secondary`/default-ink `Typography`,
 * which the `landingTheme` wrapper always resolved to the same fixed light
 * ink the panel was designed for. Once the wrapper is gone, dark mode reaches
 * that ink for the first time and it sits on the still-fixed-light panel:
 * measured (pre-fix) 1.9:1 / 1.0:1 — see task-6-report.md.
 *
 * The `TokenField` asset-mark `Avatar` has a second, independent defect: its
 * ink was left to MUI's default (`background.default`), which was never
 * designed to pair with an arbitrary brand-mark fill — measured 2.15:1
 * against the USDT/orange mark even in light mode, i.e. pre-existing and
 * mode-independent, found only by inspecting the page's actual render tree.
 *
 * `ComingSoon` (`src/components/feedback/ComingSoon.tsx`) is not one of this
 * task's six files, but `Swap` renders it directly — following the render
 * tree, not the filename, is what the plan's own history says a "complete"
 * sweep keeps missing. Its notice box paints `text.primary`/`text.secondary`
 * on a fixed `status.warningSurface`: measured (pre-fix) 1.01:1 in dark mode,
 * the same "near-white-on-near-white" defect class the whole plan tracks.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Swap } from '../Swap';

/**
 * Drops any alpha channel: `.slice(0, 3)` keeps r/g/b and discards a 4th
 * match, so an ink specified with alpha would be measured against its own
 * r/g/b as if fully opaque — overstating its contrast once alpha actually
 * composites onto the background. Every current call site here passes an
 * opaque colour, so this is exact today; it is a structural limitation of
 * this idiom (duplicated across 15+ contrast test files) rather than a bug
 * in any one test. See task-8-report.md, Finding 5.
 */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Swap />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Swap — page chrome (%s mode)', (mode) => {
  it('the canvas actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const heading = screen.getByText('Swap tokens');
    const bg = nearestBackground(heading);
    expect(rgbToHex(bg)).toBe(tokens(mode).surface.raised);
  });

  it('the "Coming soon" notice clears AA against its own panel', () => {
    renderIn(mode);
    for (const text of [
      screen.getByText('Swapping is not live yet'),
      screen.getByText(/The form below is a preview/),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the TokenField label and balance caption clear AA against the field panel', () => {
    renderIn(mode);
    for (const text of [screen.getAllByText('From')[0]!, screen.getByText('Balance: 0.00 DCC')]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the rate summary (exchange rate, price impact, network fee) clears AA against its panel', () => {
    renderIn(mode);
    for (const text of [screen.getByText('Exchange rate'), screen.getByText('1 DCC = 0.00 USDT')]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the asset-mark avatar initials clear AA against their own fixed brand fill', () => {
    renderIn(mode);
    const dcc = screen.getByText('D');
    const usdt = screen.getByText('U');
    for (const [glyph, markColor] of [
      [dcc, '#8A63D2'],
      [usdt, '#F7931A'],
    ] as const) {
      const ink = rgbToHex(getComputedStyle(glyph).color);
      expect(contrastRatio(ink, markColor)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
