/**
 * AppTile — anatomy, state and reach.
 *
 * Tested directly rather than through the launcher: the tile carries five
 * states, and exercising one of them through the dialog means mounting fifteen
 * tiles to look at one.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppTile } from '@/layouts/shell/AppTile';
import { LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

const SWAP = LAUNCHER_TILES.find((d) => d.label === 'Swap')!;

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function renderTile(mode: ThemeMode, active = false, onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AppTile destination={SWAP} active={active} onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  const button = screen.getByRole('button', { name: SWAP.label });
  const plate = button.querySelector('.app-tile__plate') as HTMLElement;
  return { button, onNavigate, plate };
}

/**
 * The `box-shadow` a plain (no pseudo-class, no `@media`) rule gives `el`'s
 * own emotion class — the declaration MUI applies with no interaction state
 * at all. Read from the stylesheet rather than `getComputedStyle` so it is
 * comparable, format-for-format, against `focusVisibleBoxShadow` below:
 * `getComputedStyle` normalises colours to `rgb()` while the raw rule text
 * keeps the hex it was written with, and diffing across the two formats would
 * make "different" true for formatting reasons alone rather than a real
 * value difference.
 */
function ownBoxShadow(el: HTMLElement): string {
  const ownClass = Array.from(el.classList).find((c) => c.startsWith('css-'));
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (rule.selectorText !== `.${ownClass}`) continue;
      const value = rule.style.getPropertyValue('box-shadow');
      if (value) return value.trim();
    }
  }
  throw new Error(`no plain box-shadow rule found for .${ownClass}`);
}

/**
 * The `box-shadow` the `:focus-visible` rule declares for `button`'s plate.
 * jsdom never applies `:focus-visible`, so the only honest way to check it is
 * to read the rule emotion emitted rather than trust `getComputedStyle`.
 */
function focusVisibleBoxShadow(button: HTMLElement): string {
  const ownClass = Array.from(button.classList).find((c) => c.startsWith('css-'));
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (rule.selectorText?.includes(`.${ownClass}:focus-visible`)) {
        const value = rule.style.getPropertyValue('box-shadow');
        if (value) return value.trim();
      }
    }
  }
  throw new Error(`no :focus-visible box-shadow rule found for .${ownClass}`);
}

/**
 * The `:hover` alternative of the reduced-motion override's selector list —
 * the rule inside `@media (prefers-reduced-motion: reduce)` that touches
 * `:hover`/`:active` declares both as one comma-joined selector
 * (`&&:active .plate, &&:hover .plate`), so this splits on the comma and
 * returns only the `:hover` half. That keeps the comparison against
 * `hoverSelector` (below) apples-to-apples: comparing the whole two-part list
 * against a single selector would always report the list as "more specific"
 * purely because it has twice as many class tokens, masking whether `&&` is
 * still doubled.
 *
 * jsdom does not evaluate `prefers-reduced-motion` (or apply `:hover`), so
 * this reads the rule text rather than `getComputedStyle`.
 */
function reducedMotionOverrideSelector(el: HTMLElement): string {
  const ownClass = Array.from(el.classList).find((c) => c.startsWith('css-'));
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (
        !(rule instanceof CSSMediaRule) ||
        rule.conditionText !== '(prefers-reduced-motion: reduce)'
      ) {
        continue;
      }
      for (const inner of Array.from(rule.cssRules) as CSSStyleRule[]) {
        if (inner.selectorText.includes(`.${ownClass}`) && inner.selectorText.includes(':hover')) {
          const hoverAlternative = inner.selectorText
            .split(',')
            .find((part) => part.includes(':hover'));
          if (hoverAlternative) return hoverAlternative.trim();
        }
      }
    }
  }
  throw new Error(`no reduced-motion :hover override rule found for .${ownClass}`);
}

/** The plain (non-media) `:hover` rule's selector text for `el`'s own class. */
function hoverSelector(el: HTMLElement): string {
  const ownClass = Array.from(el.classList).find((c) => c.startsWith('css-'));
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (rule.selectorText?.includes(`.${ownClass}:hover`)) return rule.selectorText;
    }
  }
  throw new Error(`no plain :hover rule found for .${ownClass}`);
}

/**
 * CSS specificity's class column — every class selector and pseudo-class
 * counts once. The rules compared here have no IDs and no type selectors, so
 * this column is the whole of their specificity.
 */
function classSpecificity(selectorText: string): number {
  const classes = selectorText.match(/\.[\w-]+/g)?.length ?? 0;
  const pseudoClasses = selectorText.match(/:[a-zA-Z-]+/g)?.length ?? 0;
  return classes + pseudoClasses;
}

describe.each(['light', 'dark'] as const)('AppTile (%s mode)', (mode) => {
  it('paints its plate from the destination hue, both halves', () => {
    const { plate } = renderTile(mode);
    const hue = tokens(mode).appTile[SWAP.hue];
    expect(toHex(getComputedStyle(plate).backgroundColor)).toBe(hue.fill);
    expect(toHex(getComputedStyle(plate).color)).toBe(hue.on);
  });

  it('its glyph clears AA against the plate it sits on', () => {
    const { plate } = renderTile(mode);
    const ink = toHex(getComputedStyle(plate).color);
    const fill = toHex(getComputedStyle(plate).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('its label clears AA against the dialog ground, not the plate', () => {
    const { button } = renderTile(mode);
    const label = screen.getByText(SWAP.label);
    const ink = toHex(getComputedStyle(label).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
    // The label sits outside the plate, so its legibility depends on one
    // verified surface rather than on eight separate fills.
    expect(button.querySelector('.app-tile__plate')?.contains(label)).toBe(false);
  });

  it('its label still clears AA against the ground when current, in the accent ink', () => {
    // The inactive case above only ever measures `text.primary`. Active swaps
    // the label to `accent.primary` (see "marks the current destination"
    // below) — a different ink against the same ground, so it needs its own
    // floor rather than inheriting the inactive case's pass.
    renderTile(mode, true);
    const label = screen.getByText(SWAP.label);
    const ink = toHex(getComputedStyle(label).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
  });

  it('marks the current destination without relying on the fill', () => {
    const { button, plate } = renderTile(mode, true);
    expect(button).toHaveAttribute('aria-current', 'page');
    // The fill identifies the feature, so the state has to be carried by the
    // ring instead. Asserted as present-vs-absent rather than by matching the
    // colour inside the shorthand: jsdom is free to normalise a hex in
    // `box-shadow` to `rgb()`, and an assertion that depends on which it picks
    // is a coin flip, not a test.
    expect(getComputedStyle(plate).boxShadow).not.toBe('none');
  });

  it('leaves a non-current destination without the marker or the ring', () => {
    const { button, plate } = renderTile(mode, false);
    expect(button).not.toHaveAttribute('aria-current');
    expect(getComputedStyle(plate).boxShadow).toBe('none');
  });

  it('gives a focused tile a box-shadow distinct from the current-route ring, so the two compose instead of collapsing (WCAG 2.4.7)', () => {
    // MUI's FocusTrap focuses the dialog on open, so the first Tab always
    // lands on the Dashboard tile — which is also the current one on the
    // app's default route. If `:focus-visible` reused the current-route ring
    // verbatim, that first Tab would produce a pixel-identical `box-shadow`
    // and read as no visible change at all. Compared as active === true, the
    // strictest case: the two rings have to differ even when both apply to
    // the same tile at once.
    const { button, plate } = renderTile(mode, true);
    const currentRingBoxShadow = ownBoxShadow(plate);
    const focusBoxShadow = focusVisibleBoxShadow(button);
    expect(focusBoxShadow).not.toBe('none');
    expect(focusBoxShadow).not.toBe(currentRingBoxShadow);
  });
});

describe('AppTile behaviour', () => {
  it('navigates to its destination on click', () => {
    const { button, onNavigate } = renderTile('light');
    button.click();
    expect(onNavigate).toHaveBeenCalledWith(SWAP.path);
  });

  it('exposes its description without needing a hover', () => {
    const { button } = renderTile('light');
    const id = button.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent).toBe(SWAP.description);
  });

  it('hides the glyph from assistive tech and names itself by its label', () => {
    const { button, plate } = renderTile('light');
    expect(plate).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAccessibleName(SWAP.label);
  });

  it('raises the reduced-motion override above :hover/:active with a doubled class, not source order', () => {
    // Regression test: a previous commit fixed an inert
    // `prefers-reduced-motion` override by doubling the ampersand
    // (`&&:hover`/`&&:active`) so the media rule outranks the plain
    // `:hover`/`:active` rules at (0,4,0) instead of tying with them at
    // (0,3,0) — a tie that stylis breaks by source order, and Biome sorts
    // `@media` blocks *above* `&:...` peers, so the un-doubled version loses.
    // A later revert to a single `&` re-ties the specificity and silently
    // re-breaks reduced motion while every existing test — none of which
    // read `@media` rule text — stays green.
    const { button } = renderTile('light');
    const mediaSelector = reducedMotionOverrideSelector(button);
    const plainHoverSelector = hoverSelector(button);
    expect(classSpecificity(mediaSelector)).toBeGreaterThan(classSpecificity(plainHoverSelector));
  });

  it('clamps the label to two lines so a long one cannot push its grid row taller than its neighbours', () => {
    const longLabel = {
      ...SWAP,
      label: 'A destination with an implausibly long name for this tile',
    };
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <AppTile destination={longLabel} active={false} onNavigate={vi.fn()} />
      </ThemeProvider>,
    );
    const label = screen.getByText(longLabel.label);
    const style = getComputedStyle(label);
    // jsdom does not lay out text, so line count/height are not measurable —
    // asserting the clamping declarations themselves is the honest floor.
    expect(style.display).toBe('-webkit-box');
    expect(style.getPropertyValue('-webkit-line-clamp')).toBe('2');
    expect(style.overflow).toBe('hidden');
  });
});
