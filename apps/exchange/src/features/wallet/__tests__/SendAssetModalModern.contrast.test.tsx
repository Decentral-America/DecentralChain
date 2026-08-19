/**
 * SendAssetModalModern — Send button ink vs its fixed fill (fix round 1)
 *
 * Reachable only through `Dashboard`'s and `Portfolio`'s own modals — not one
 * of Task 6's six page files, but squarely inside `Dashboard`'s render tree,
 * the same class of miss the render-tree sweep is supposed to catch.
 *
 * The "Send" button is `variant="contained"` with a *fixed* gradient
 * `background` (`linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)`), so it
 * takes MUI's *mode-aware* `primary.contrastText` as ink instead of the
 * gradient's own designed-for-light value. In dark that ink is `#14122b`
 * (near-black) on `#4F46E5` (indigo) — 2.90:1. This is the identical pattern
 * already fixed on CreateToken's Next/Create buttons: a mode-aware ink
 * landing on a fill that never moves with it.
 *
 * Neither white nor black clears *both* gradient stops (white: 6.29 / 2.43;
 * black: 3.34 / 8.65) — unlike the two badges fixed in the same round, this
 * one cannot be rescued with a pinned ink. Fixed the same way as
 * CreateToken's pair: drop the custom fill and let `variant="contained"`
 * derive a verified-accessible solid fill+ink pair from the theme.
 */
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode } from '@/theme/tokens/semantic';
import { SendAssetModalModern } from '../SendAssetModalModern';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader', seed: 'test seed' } }),
}));
vi.mock('@/utils/transactions', () => ({
  broadcastTransaction: vi.fn().mockResolvedValue({ id: 'fake-tx-id' }),
  createTransferTransaction: vi.fn().mockResolvedValue({}),
}));

function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

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

function computedColor(el: HTMLElement): string {
  const style = getComputedStyle(el);
  return toHex(resolveVar(style, style.color));
}

/**
 * The background colour(s) actually behind the element's text. A plain
 * `background-color` gives one; a `linear-gradient` `background-image`
 * (jsdom resolves its colour stops to `rgb(...)`, confirmed directly) gives
 * every stop, since text sitting across a gradient must clear AA against
 * the worst of them, not just whichever channel `backgroundColor` reports
 * (which is `rgba(0, 0, 0, 0)` for a pure gradient fill — checked directly,
 * not assumed).
 */
function backgroundHexStops(el: HTMLElement): string[] {
  const style = getComputedStyle(el);
  const image = style.backgroundImage;
  if (image?.includes('gradient')) {
    const stops = image.match(/rgb\([^)]+\)|#[0-9a-fA-F]{3,8}/g);
    if (stops?.length) return stops.map(toHex);
  }
  return [toHex(resolveVar(style, style.backgroundColor))];
}

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <QueryClientProvider client={new QueryClient()}>
        <Box>
          <SendAssetModalModern isOpen onClose={vi.fn()} assetId="DCC" assetName="DCC" />
        </Box>
      </QueryClientProvider>
    </ThemeProvider>,
  );

describe.each([
  'light',
  'dark',
] as const)('SendAssetModalModern — Send button (%s mode)', (mode) => {
  it('the ink clears AA against every stop of whatever it actually sits on, once enabled', async () => {
    const user = userEvent.setup();
    renderIn(mode);
    // Disabled (exempt from AA) until both fields are non-empty — fill them,
    // as a real user must, to reach the ink/fill pair that is actually shown.
    await user.type(
      screen.getByLabelText(/Recipient Address or Alias/i),
      '3PaBcDeFgHiJkLmNoPqRsTuVwXyZ012345',
    );
    await user.type(screen.getByLabelText(/^Amount$/i), '10');
    const button = screen.getByRole('button', { name: /^send$/i });
    expect(button).toBeEnabled();
    const ink = computedColor(button);
    for (const bg of backgroundHexStops(button)) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/**
 * Success-view badge (fix round 1, item 3): a fixed `white` icon on a fixed
 * `#06B6D4→#10B981` gradient missed the 3:1 icon floor against both stops
 * (2.43/2.54), mode-independent. Unlike the Send button above and the
 * form-view badge (both `#4F46E5→#06B6D4`, where neither black nor white
 * clears both ends), this pair clears comfortably with the app's pinned
 * dark ink, `tokens('light').text.primary` (7.51/7.19) — a one-word
 * repoint, not a design decision.
 */
describe('SendAssetModalModern — success-view badge icon', () => {
  it('clears the 3:1 icon floor against every stop of its fixed gradient', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <QueryClientProvider client={new QueryClient()}>
          <Box>
            <SendAssetModalModern
              isOpen
              onClose={vi.fn()}
              assetId="DCC"
              assetName="DCC"
              availableBalance="1000"
            />
          </Box>
        </QueryClientProvider>
      </ThemeProvider>,
    );
    await user.type(
      screen.getByLabelText(/Recipient Address or Alias/i),
      '3PaBcDeFgHiJkLmNoPqRsTuVwXyZ012345',
    );
    await user.type(screen.getByLabelText(/^Amount$/i), '10');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    await screen.findByText('Transaction Sent');
    // The success view drops the "Send" button entirely (only "Close"
    // remains), so the badge's `SendIcon` is the sole match.
    const icon = screen.getByTestId('SendIcon') as unknown as HTMLElement;
    const badge = icon.parentElement as HTMLElement;
    const ink = computedColor(icon);
    for (const bg of backgroundHexStops(badge)) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(3);
    }
  });
});
