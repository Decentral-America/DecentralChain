/**
 * Leasing — status chip contrast on row hover
 *
 * `LeasingModern` (a thin `PageFrame` wrapper around this component) is a
 * live, authenticated route — `/desktop/wallet/leasing`, reachable on mobile
 * too via `MobilePageShell` (`walletRoutes.tsx`). Its leasing-history table
 * renders `<TableRow hover>`, so pointing at a row paints MUI's
 * `action.hover` underneath it — the same token as `tokens(mode).surface.hover`
 * (`mui-theme.ts:19`).
 *
 * The status `Chip` was `variant="outlined"`: no fill of its own, so its
 * label read directly off whatever sat behind it. At rest that is the card's
 * `surface.raised` (fine, ≥5.19:1 for every intent colour); on hover it
 * became `surface.hover`, where `intent.warning` measures 4.1654:1 in light
 * mode and `intent.success` 4.2865:1 — both under the 4.5:1 AA floor for
 * body text. (The row's other outlined intent element, the "Cancel" button's
 * `color="error"` label, clears at 4.5122:1 — tight, but not a genuine
 * failure, so it is measured here and left alone.)
 *
 * Fixed by dropping `variant="outlined"` on the status chip: MUI's filled
 * variant gives it `intent.<x>` as its own opaque fill with the matching
 * `intent.on<X>` ink (verified ≥4.5:1 in both modes for all four intents —
 * see `theme/tokens/semantic.ts`), so the row's hover state can no longer
 * reach its ink at all.
 *
 * `paintedBackground` below encodes that behaviour honestly: if the element
 * has no opaque background of its own, the row's `:hover` background is what
 * is actually visible behind it (read out of the emitted emotion stylesheet
 * — jsdom does not apply `:hover`, so a simulated pointer would silently
 * measure the rest state and pass on broken code, the same trap
 * `AppTopBar.contrast.test.tsx` documents). If the element *does* paint its
 * own background, that is what is actually visible, regardless of the row.
 */
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Leasing } from '../Leasing';

const ADDRESS = '3PLeasingContrastTestAddress0000000';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: ADDRESS } }),
}));
vi.mock('@/hooks/useBalanceWatcher', () => ({
  useBalanceWatcher: () => ({
    balances: { available: 500000000000, leaseOut: 100000000000, regular: 600000000000 },
    error: null,
    forceRefresh: vi.fn(),
    isFetching: false,
    isLoading: false,
  }),
}));

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

/**
 * MUI's `variant="contained"`/`"outlined"` slot colours resolve to a raw
 * `var(--variant-...)` reference in jsdom rather than a computed colour (see
 * `CreateToken.contrast.test.tsx`'s copy of this same helper). jsdom does
 * compute the custom property itself, case-lowered, so the lookup has to be
 * case-insensitive too.
 */
function resolveVar(style: CSSStyleDeclaration, value: string): string {
  const match = value.match(/^var\((--[\w-]+)\)$/);
  if (!match) return value;
  const wanted = match[1]!.toLowerCase();
  for (const prop of Array.from(style)) {
    if (prop.toLowerCase() === wanted) return style.getPropertyValue(prop).trim();
  }
  return 'transparent'; // No matching custom property: nothing overrides the default (none).
}

/** The ink actually painted on `el`, resolving MUI's CSS-variable slot colours. */
function ink(el: HTMLElement): string {
  const style = getComputedStyle(el);
  return toHex(resolveVar(style, style.color));
}

/** `el`'s own background, or `null` if it paints no opaque fill of its own. */
function ownBackground(el: HTMLElement): string | null {
  const style = getComputedStyle(el);
  const raw = resolveVar(style, style.backgroundColor);
  if (!raw || raw === 'rgba(0, 0, 0, 0)' || raw === 'transparent') return null;
  return toHex(raw);
}

/**
 * The `&:hover` background declared for `el` in the emitted stylesheet.
 *
 * Matched only against `el`'s own `css-<hash>` emotion class, never against
 * MUI's static classes (`MuiTableRow-hover`, `MuiTableRow-root`, ...). This
 * suite renders `Leasing` in both modes across several `it()`s in one file;
 * emotion never removes a `<style>` tag once injected, so by the time a
 * later test runs, `document.styleSheets` holds `.MuiTableRow-hover:hover`
 * rules from *every* mode rendered so far, all sharing that static
 * substring. The first match by static class alone is whichever rule
 * happened to be injected first across the whole file — provably the wrong
 * one here (confirmed by mutation: filtering on the static class matched
 * light mode's own leftover rule while measuring the dark-mode render,
 * silently substituting light's `surface.hover` for dark's). The `css-`
 * hash is emotion's own de-duplication key — content-derived, so it differs
 * between light and dark (their `action.hover` values differ) and is
 * therefore the only selector fragment that safely identifies *this*
 * render's rule and no other's.
 */
function hoverBackground(el: HTMLElement): string {
  const hashClass = Array.from(el.classList).find((c) => c.startsWith('css-'));
  if (!hashClass) throw new Error(`${el.className} has no emotion hash class to match`);
  // The hash class is a compound member of the selector, not the segment
  // `:hover` is appended to (that is `.MuiTableRow-hover`) — so it has to be
  // matched as "present somewhere in this selector", not "immediately
  // followed by :hover".
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (!rule.selectorText) continue;
      if (!rule.selectorText.includes(`.${hashClass}`) || !rule.selectorText.includes(':hover')) {
        continue;
      }
      const value = rule.style.getPropertyValue('background-color');
      if (value) return toHex(value.trim());
    }
  }
  throw new Error(`no :hover background-color rule found for ${el.className}`);
}

/**
 * What a pointer actually resting on `row` reveals behind `el`: `el`'s own
 * fill if it paints one, otherwise the row's hover fill showing through.
 */
function paintedBackground(el: HTMLElement, row: HTMLElement): string {
  return ownBackground(el) ?? hoverBackground(row);
}

function renderLeasing(mode: ThemeMode) {
  const client = new QueryClient();
  // One row whose status resolves to 'active' (`chipColor: 'success'`) via
  // the active-leases query, one whose status resolves to 'pending'
  // (`chipColor: 'warning'`, `Leasing.tsx`'s default) via the transaction
  // history query — the two chip colours the sweep found failing.
  client.setQueryData(
    ['active-leases', ADDRESS],
    [
      {
        amount: 100000000,
        height: 100,
        id: 'lease-active-1',
        recipient: '3PNodeAddressActive00000000000000',
        status: 'active',
        timestamp: Date.now(),
        type: 8,
        typeName: 'lease-out',
      },
    ],
  );
  client.setQueryData(
    ['lease-transactions', ADDRESS],
    [
      {
        amount: 50000000,
        height: 90,
        id: 'lease-pending-1',
        recipient: '3PNodeAddressPending0000000000000',
        timestamp: Date.now(),
        type: 8,
        typeName: 'lease-out',
      },
    ],
  );
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={createAppTheme(mode)}>
        <Leasing />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe.each([
  'light',
  'dark',
] as const)('Leasing — status chip on row hover (%s mode)', (mode) => {
  it('the pending-status chip is filled with its own intent fill, not outlined on the row', () => {
    renderLeasing(mode);
    const chip = screen.getByText('Pending').closest('.MuiChip-root') as HTMLElement;
    expect(ownBackground(chip)).toBe(tokens(mode).intent.warning);
    expect(ink(chip)).toBe(tokens(mode).intent.onWarning);
  });

  it('the active-status chip is filled with its own intent fill, not outlined on the row', () => {
    renderLeasing(mode);
    const chip = screen.getByText('Active').closest('.MuiChip-root') as HTMLElement;
    expect(ownBackground(chip)).toBe(tokens(mode).intent.success);
    expect(ink(chip)).toBe(tokens(mode).intent.onSuccess);
  });

  it('the pending chip clears AA against whatever is actually visible behind it, row hovered or not', () => {
    renderLeasing(mode);
    const chip = screen.getByText('Pending').closest('.MuiChip-root') as HTMLElement;
    const row = chip.closest('tr') as HTMLElement;
    expect(contrastRatio(ink(chip), paintedBackground(chip, row))).toBeGreaterThanOrEqual(4.5);
  });

  it('the active chip clears AA against whatever is actually visible behind it, row hovered or not', () => {
    renderLeasing(mode);
    const chip = screen.getByText('Active').closest('.MuiChip-root') as HTMLElement;
    const row = chip.closest('tr') as HTMLElement;
    expect(contrastRatio(ink(chip), paintedBackground(chip, row))).toBeGreaterThanOrEqual(4.5);
  });

  it("the Cancel button's outlined error ink clears AA on the row's hover fill (audited, already passing, left alone)", () => {
    renderLeasing(mode);
    const button = screen.getByRole('button', { name: 'Cancel' });
    const row = button.closest('tr') as HTMLElement;
    // Genuinely outlined — no fill of its own in either mode — so what it
    // must clear is the row's hover background, not itself.
    expect(ownBackground(button)).toBeNull();
    expect(contrastRatio(ink(button), paintedBackground(button, row))).toBeGreaterThanOrEqual(4.5);
  });
});
