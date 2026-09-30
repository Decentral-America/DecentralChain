/**
 * Leasing — status chip and Cancel button contrast, row hovered or not
 *
 * `LeasingModern` (a thin `PageFrame` wrapper around this component) is a
 * live, authenticated route — `/desktop/wallet/leasing`, reachable on mobile
 * too via `MobilePageShell` (`walletRoutes.tsx`). Its lease history is an
 * `InsetGroup` of `InsetRow`s (a grouped list inside the "History" section,
 * no longer a `<TableRow hover>` table): white `surface.raised` in light mode,
 * graphite in dark, with each lease's status chip under its amount and a
 * "Cancel" button as the row's accessory.
 *
 * The status `Chip` was once `variant="outlined"`: no fill of its own, so its
 * label read directly off the table row's `action.hover` fill, where
 * `intent.warning` measured 4.1654:1 and `intent.success` 4.2865:1 in light
 * mode. Fixed by filling it: `intent.<x>` as its own opaque fill with the
 * matching `intent.on<X>` ink (verified ≥4.5:1 in both modes for all four
 * intents — see `theme/tokens/semantic.ts`), so nothing behind the row can
 * reach its ink.
 *
 * The redesign's theme then broke that fix without touching `Leasing.tsx`:
 * its `MuiChip.filled` override repaints *every* filled chip with the neutral
 * translucent `chrome.fill`, coloured ones included, leaving the `intent.on*`
 * ink on a grey wash — 1.15:1 (white on #efeff0) in light mode, 1.65:1 (black
 * on #323236) in dark. `Leasing.tsx` now restates the intent fill on the chip.
 *
 * The Cancel button is no longer "genuinely outlined": the redesign's
 * outlined buttons paint their own translucent `chrome.fill` at rest and
 * `chrome.fillHover` under the pointer, and `color="error"` inked them
 * `intent.danger` — 3.75:1 at rest / 3.37:1 hovered in dark mode, 4.69:1 /
 * 4.32:1 in light. `Leasing.tsx` now inks it with the alert set's danger ink
 * (`chrome[mode].alert.error.fg`): 7.13:1 / 6.57:1 light, 6.26:1 / 5.64:1
 * dark.
 *
 * What is behind an ink is measured with the shared `paintedBackground`,
 * which composites translucent fills onto the first opaque surface — reading
 * a translucent fill as if it were solid reports a contrast nobody sees. The
 * pointer state is read out of the emitted stylesheets (`declaredHover`
 * below): jsdom does not apply `:hover`, so a simulated pointer would
 * silently measure the rest state and pass on broken code, the same trap
 * `AppTopBar.contrast.test.tsx` documents. Rows with their own controls are
 * plain `div`s that declare no hover fill (only whole-row buttons take
 * `listHover`), so today a hovered row reveals its rest background; the
 * measurement still applies whatever the row declares, so a hover fill added
 * later is measured, not assumed away.
 */
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { paintedBackground } from '@/test-utils/paintedBackground';
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

/**
 * `el`'s own fill: hex when opaque, the raw `rgba(...)` when translucent (so
 * it can never equal an opaque token by accident — `rgbToHex` would drop the
 * alpha), `null` when it paints none.
 */
function ownBackground(el: HTMLElement): string | null {
  const style = getComputedStyle(el);
  const raw = resolveVar(style, style.backgroundColor);
  if (!raw || raw === 'rgba(0, 0, 0, 0)' || raw === 'transparent') return null;
  const alpha = raw.match(/^rgba\(.*,\s*([\d.]+)\)$/);
  if (alpha && Number(alpha[1]) < 1) return raw;
  return toHex(raw);
}

/**
 * `el`'s generated class: emotion's `css-<hash>` for MUI, or the
 * styled-components name class (the one that is not the static `sc-<id>`
 * component id).
 */
function generatedClass(el: HTMLElement): string | undefined {
  const classes = Array.from(el.classList);
  return (
    classes.find((c) => c.startsWith('css-')) ??
    classes.find((c) => !c.startsWith('sc-') && !c.startsWith('Mui'))
  );
}

function styleRules(rules: CSSRuleList): CSSStyleRule[] {
  return Array.from(rules).flatMap((rule) =>
    'selectorText' in rule
      ? [rule as CSSStyleRule]
      : 'cssRules' in rule
        ? styleRules((rule as CSSGroupingRule).cssRules)
        : [],
  );
}

/**
 * The `:hover` background declared for `el` in the emitted stylesheets, or
 * `null` when it declares none.
 *
 * Matched only against `el`'s own generated class, never against static
 * class names (`MuiButton-root`, `sc-<id>`, ...). This suite renders
 * `Leasing` in both modes across several `it()`s in one file; neither emotion
 * nor styled-components removes a `<style>` rule once injected, so by the
 * time a later test runs, `document.styleSheets` holds `:hover` rules from
 * *every* mode rendered so far, all sharing those static substrings. The
 * first match by static class alone is whichever rule happened to be
 * injected first across the whole file — provably the wrong one (confirmed
 * by mutation on the old table: filtering on `MuiTableRow-hover` matched
 * light mode's leftover rule while measuring the dark-mode render, silently
 * substituting light's `surface.hover` for dark's). The generated class is
 * each library's content-derived de-duplication key, so it differs between
 * light and dark and is the only selector fragment that safely identifies
 * *this* render's rule and no other's.
 *
 * The hash class is a compound member of the selector, not necessarily the
 * segment `:hover` is appended to, so it is matched as "present somewhere in
 * this selector". Later rules win at equal specificity, so the last
 * declaration is the one the browser paints.
 */
function declaredHover(el: HTMLElement): string | null {
  const hashClass = generatedClass(el);
  if (!hashClass) return null;
  let value: string | null = null;
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of styleRules(sheet.cssRules)) {
      if (!rule.selectorText.includes(`.${hashClass}`) || !rule.selectorText.includes(':hover')) {
        continue;
      }
      const declared = rule.style.getPropertyValue('background-color');
      if (declared) value = declared.trim();
    }
  }
  return value;
}

/**
 * What is painted behind `el` with the pointer resting on it: `el` and every
 * ancestor match `:hover` at once, so each one's declared hover fill replaces
 * its rest fill before the layers are composited.
 */
function paintedUnderPointer(el: HTMLElement): string {
  const restored: Array<[HTMLElement, string]> = [];
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const hover = declaredHover(node);
    if (hover === null) continue;
    restored.push([node, node.style.backgroundColor]);
    node.style.backgroundColor = hover;
  }
  try {
    return toHex(paintedBackground(el));
  } finally {
    for (const [node, previous] of restored) node.style.backgroundColor = previous;
  }
}

/** The lease row (an `InsetRow` in the "History" list) that `el` sits in. */
function historyRow(el: HTMLElement): HTMLElement {
  const history = screen.getByRole('region', { name: /^History/ });
  let node: HTMLElement | null = el;
  while (node && node.parentElement?.parentElement !== history) node = node.parentElement;
  if (!node) throw new Error('element is not inside a History row');
  return node;
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
        <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
          <Leasing />
        </StyledThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe.each(['light', 'dark'] as const)(
  'Leasing — status chip and Cancel button, row hovered or not (%s mode)',
  (mode) => {
    it('the pending-status chip is filled with its own intent fill, not a neutral wash', () => {
      renderLeasing(mode);
      const chip = screen.getByText('Pending').closest('.MuiChip-root') as HTMLElement;
      expect(ownBackground(chip)).toBe(tokens(mode).intent.warning);
      expect(ink(chip)).toBe(tokens(mode).intent.onWarning);
    });

    it('the active-status chip is filled with its own intent fill, not a neutral wash', () => {
      renderLeasing(mode);
      const chip = screen.getByText('Active').closest('.MuiChip-root') as HTMLElement;
      expect(ownBackground(chip)).toBe(tokens(mode).intent.success);
      expect(ink(chip)).toBe(tokens(mode).intent.onSuccess);
    });

    it('the pending chip clears AA against whatever is actually visible behind it, row hovered or not', () => {
      renderLeasing(mode);
      const chip = screen.getByText('Pending').closest('.MuiChip-root') as HTMLElement;
      // The row is found structurally and carries a generated class, so "no
      // hover fill declared" is a real absence, not a lookup that missed.
      expect(generatedClass(historyRow(chip))).toBeDefined();
      expect(contrastRatio(ink(chip), toHex(paintedBackground(chip)))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ink(chip), paintedUnderPointer(chip))).toBeGreaterThanOrEqual(4.5);
    });

    it('the active chip clears AA against whatever is actually visible behind it, row hovered or not', () => {
      renderLeasing(mode);
      const chip = screen.getByText('Active').closest('.MuiChip-root') as HTMLElement;
      expect(generatedClass(historyRow(chip))).toBeDefined();
      expect(contrastRatio(ink(chip), toHex(paintedBackground(chip)))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ink(chip), paintedUnderPointer(chip))).toBeGreaterThanOrEqual(4.5);
    });

    it("the Cancel button's error ink clears AA on its own translucent fill, at rest and under the pointer", () => {
      renderLeasing(mode);
      const button = screen.getByRole('button', { name: 'Cancel' });
      expect(generatedClass(historyRow(button))).toBeDefined();
      // Not outlined-on-the-row any more: the theme gives outlined buttons a
      // translucent fill of their own, and a different one on hover. The
      // hover lookup must find it in this mode's render, or the pointer
      // measurement below would silently repeat the rest state.
      expect(ownBackground(button)).toMatch(/^rgba\(/);
      expect(declaredHover(button)).toMatch(/^rgba\(/);
      expect(declaredHover(button)).not.toBe(ownBackground(button));
      expect(contrastRatio(ink(button), toHex(paintedBackground(button)))).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrastRatio(ink(button), paintedUnderPointer(button))).toBeGreaterThanOrEqual(4.5);
    });
  },
);
