/**
 * SendAssetModalModern — the send control's ink vs what it sits on, the
 * success check, and the transaction-ID well
 *
 * Reachable only through `Dashboard`'s and `Portfolio`'s own modals — not one
 * of Task 6's six page files, but squarely inside `Dashboard`'s render tree,
 * the same class of miss the render-tree sweep is supposed to catch.
 *
 * History: the "Send" button used to be `variant="contained"` over a *fixed*
 * `#4F46E5→#06B6D4` gradient, taking MUI's mode-aware `primary.contrastText`
 * as ink — 2.90:1 in dark, and neither white nor black cleared both stops. It
 * was fixed by dropping the gradient for a theme-derived solid pair.
 *
 * The redesign replaced it with a press-and-hold `HoldToConfirm` ("Hold to
 * send"): a resting face (accent ink on the accent's `primarySurface` tint)
 * that a solid copy (`textOnPrimary` on `primary`) sweeps across while it is
 * held. Mid-hold the label is split between the two, so both faces must clear
 * AA. The resting face did not in dark mode: `primary` #7f70ff on #1f1b3d is
 * 4.42:1 for a 15px label. `HoldToConfirm` now inks it with `primaryHover`
 * (6.18:1 dark, 5.99:1 light, was 5.37:1).
 *
 * The success view's gradient badge is gone too: a bare `success.main` check
 * glyph now sits straight on the dialog paper, so it moves with the mode and
 * both modes are measured at the 3:1 non-text floor (the old badge was a fixed
 * pair and was measured once).
 */
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { chrome } from '@/styles/tokens';
import { paintedBackground } from '@/test-utils/paintedBackground';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { SendAssetModalModern } from '../SendAssetModalModern';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader', seed: 'test seed' } }),
}));
vi.mock('@/utils/transactions', () => ({
  broadcastTransaction: vi.fn().mockResolvedValue({ id: 'fake-tx-id' }),
  createTransferTransaction: vi.fn().mockResolvedValue({}),
}));

/**
 * `HoldToConfirm` times the hold by subtracting `performance.now()` from each
 * frame's timestamp, which in a browser share one clock. jsdom's
 * `requestAnimationFrame` hands its callbacks a timestamp from a different
 * origin (measured: 25581 against `performance.now()`'s 43471), so every
 * frame reads as negative elapsed time and the hold resets to idle — it can
 * never complete. Frames here report the clock the component reads, as a
 * browser's do; the hold still takes its real 1.2 seconds.
 */
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Same `var()`-indirection gap as `CreateToken.contrast.test.tsx` — resolved
 * and always normalised to hex, so a literal `rgb(...)` override (no `var()`
 * involved) can never silently reach `contrastRatio` unconverted again (fix
 * round 1, item 2).
 */
function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function resolveVar(style: CSSStyleDeclaration, value: string): string {
  const match = value.match(/^var\((--[\w-]+)\)$/);
  if (!match) return value;
  const wanted = match[1]!.toLowerCase();
  for (const prop of Array.from(style)) {
    if (prop.toLowerCase() === wanted) return style.getPropertyValue(prop).trim();
  }
  throw new Error(`Could not resolve ${match[1]}`);
}

function computedColor(el: Element): string {
  const style = getComputedStyle(el);
  return toHex(resolveVar(style, style.color));
}

/**
 * The background colour(s) actually behind the element's text. A
 * `linear-gradient` `background-image` (jsdom resolves its colour stops to
 * `rgb(...)`, confirmed directly) gives every stop, since text sitting across
 * a gradient must clear AA against the worst of them, not just whichever
 * channel `backgroundColor` reports (which is `rgba(0, 0, 0, 0)` for a pure
 * gradient fill — checked directly, not assumed). Otherwise it is the colour
 * painted there, translucent layers composited onto the surface beneath.
 */
function backgroundHexStops(el: HTMLElement): string[] {
  const image = getComputedStyle(el).backgroundImage;
  if (image?.includes('gradient')) {
    const stops = image.match(/rgb\([^)]+\)|#[0-9a-fA-F]{3,8}/g);
    if (stops?.length) return stops.map(toHex);
  }
  return [toHex(paintedBackground(el))];
}

function renderIn(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <SendAssetModalModern
            isOpen
            onClose={vi.fn()}
            assetId="DCC"
            assetName="DCC"
            availableBalance="1000"
          />
        </QueryClientProvider>
      </StyledThemeProvider>
    </ThemeProvider>,
  );
}

/** Fill both fields, as a real user must, to enable the send control. */
async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole('textbox', { name: 'To' }),
    '3PaBcDeFgHiJkLmNoPqRsTuVwXyZ012345',
  );
  await user.type(screen.getByRole('spinbutton', { name: 'Amount' }), '10');
}

const sendControl = () => screen.getByRole('button', { name: /^hold to send/i });

/** Hold the control with Space until it commits, then wait for the success view. */
async function holdToSend() {
  fireEvent.keyDown(sendControl(), { key: ' ' });
  await screen.findByText(
    'Your transaction has been broadcast to the network.',
    {},
    { timeout: 5000 },
  );
}

describe.each([
  'light',
  'dark',
] as const)('SendAssetModalModern — "Hold to send" control (%s mode)', (mode) => {
  it('both faces clear AA against every stop of whatever they actually sit on, once enabled', async () => {
    const user = userEvent.setup();
    renderIn(mode);
    // Disabled (exempt from AA, drawn at half opacity) until both fields are
    // non-empty — fill them to reach the pair that is actually shown.
    expect(sendControl()).toHaveAttribute('aria-disabled', 'true');
    await fillForm(user);
    const control = sendControl();
    expect(control).not.toHaveAttribute('aria-disabled');

    // The resting face: the control's own ink on its own tint.
    const restInk = computedColor(control);
    for (const bg of backgroundHexStops(control)) {
      expect(contrastRatio(restInk, bg)).toBeGreaterThanOrEqual(4.5);
    }

    // The face that sweeps in while held: a solid layer with its own ink.
    const sweep = control.querySelector(':scope > [aria-hidden="true"]') as HTMLElement;
    expect(sweep).not.toBeNull();
    expect(sweep).toHaveTextContent(/^Hold to send/);
    const sweepInk = computedColor(sweep);
    for (const bg of backgroundHexStops(sweep)) {
      expect(contrastRatio(sweepInk, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe.each([
  'light',
  'dark',
] as const)('SendAssetModalModern — success-view check icon (%s mode)', (mode) => {
  it('clears the 3:1 icon floor against the surface it is painted on', async () => {
    const user = userEvent.setup();
    renderIn(mode);
    await fillForm(user);
    await holdToSend();

    const icon = screen.getByRole('dialog').querySelector('svg.lucide-circle-check');
    expect(icon).not.toBeNull();
    // The glyph strokes `currentColor`, so its ink is whatever its wrapper
    // declares — read from the wrapper's own rule.
    expect(icon?.getAttribute('stroke')).toBe('currentColor');
    const wrapper = icon?.parentElement as HTMLElement;
    const ink = computedColor(wrapper);
    expect(ink).toBe(tokens(mode).intent.success);
    for (const bg of backgroundHexStops(wrapper)) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(3);
    }
  });
});

/**
 * The transaction-ID well in the success view (final-review item 2).
 *
 * It was a `bgcolor: 'grey.50'` Card: MUI's grey ramp has no mode dimension,
 * so a fixed light fill under the paper's mode-aware `text.primary` — 1.04:1
 * in dark. The transaction ID is the one piece of information this view
 * exists to hand back to the user, and it was invisible.
 *
 * It is now a row of the redesign's `DetailGroup` summary block: the mode's
 * translucent `chrome.fillSubtle` well over the dialog paper, with the ID in
 * the row's value cell. The guarantee is the same: the ID's ink clears AA on
 * what is actually painted behind it, and the well follows the theme mode
 * rather than a fixed literal.
 */
describe.each([
  'light',
  'dark',
] as const)('SendAssetModalModern — transaction-ID well (%s mode)', (mode) => {
  it('the txId ink clears AA against the surface it is actually painted on', async () => {
    const user = userEvent.setup();
    renderIn(mode);
    await fillForm(user);
    await holdToSend();

    const txId = screen.getByText('fake-tx-id');
    const well = txId.closest('dl') as HTMLElement;
    expect(well).not.toBeNull();
    const ink = computedColor(txId);
    const [fill] = backgroundHexStops(txId);
    expect(contrastRatio(ink, fill as string)).toBeGreaterThanOrEqual(4.5);
    // Follows the mode: this mode's well material, on this mode's paper.
    expect(getComputedStyle(well).backgroundColor).toBe(chrome[mode].fillSubtle);
    expect(toHex(paintedBackground(well.parentElement as HTMLElement))).toBe(
      tokens(mode).surface.raised,
    );
  });
});
