/**
 * OrderBook — both-mode row hover contrast
 *
 * The bid/ask rows tinted their `&:hover` with `status.dangerSurface` /
 * `status.successSurface` — `#fdf1f0` and `#eff7f3`, two entries in
 * `styles/tokens.ts`' flat `status` table, which has no mode dimension. Every
 * cell in the row takes mode-aware ink (`error.main`, `success.main`,
 * `text.primary` by inheritance), so pointing at a row in dark mode erased
 * it: 1.0131:1 on the sell side, 1.0001:1 on the buy side.
 *
 * Those two `status.*Surface` values are correct where they are used with
 * *fixed* ink (`ReissueAssetModal` pairs them with `status.warning`/
 * `status.danger`); the defect is this pairing, not the tokens.
 *
 * jsdom does not apply `:hover`, so the hover fill is read out of the emitted
 * stylesheet. A `userEvent.hover` here would measure the rest state and pass
 * against the broken source.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderBook } from '@/pages/OrderBook';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function hoverBackground(el: HTMLElement): string {
  const classes = Array.from(el.classList).map((c) => `.${c}:hover`);
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (!rule.selectorText || !classes.some((c) => rule.selectorText.includes(c))) continue;
      const value = rule.style.getPropertyValue('background-color');
      if (value) return toHex(value.trim());
    }
  }
  throw new Error(`no :hover background rule found for ${el.className}`);
}

function renderIn(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <OrderBook />
    </ThemeProvider>,
  );
}

/** A price cell identifies its row; both books are on screen at once. */
const SELL_PRICE = '135.25';
const BUY_PRICE = '135.20';

describe.each(['light', 'dark'] as const)('OrderBook — row hover (%s mode)', (mode) => {
  it.each([
    ['sell', SELL_PRICE],
    ['buy', BUY_PRICE],
  ])('every cell in a hovered %s row clears AA against the hover fill', (_side, price) => {
    renderIn(mode);
    const row = screen.getByText(price).parentElement as HTMLElement;
    const fill = hoverBackground(row);

    // The price cell carries `error.main`/`success.main`; amount and total
    // carry no `color` at all and inherit mode-aware `text.primary`. The
    // worst of the three is what decides whether the row is readable, so
    // assert on that rather than short-circuiting at whichever cell comes
    // first in the DOM.
    const cells = Array.from(row.querySelectorAll('p'));
    expect(cells.length).toBe(3);
    const worst = Math.min(
      ...cells.map((cell) => contrastRatio(toHex(getComputedStyle(cell).color), fill)),
    );
    expect(worst).toBeGreaterThanOrEqual(4.5);
    // Asserted after the ratios, so a run against the broken source reports
    // the number that actually breaks the screen.
    expect(fill).toBe(tokens(mode).surface.sunken);
  });
});
