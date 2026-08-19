/**
 * ReceiveAssetModalModern — badge icon ink vs its fixed gradient (fix round 1)
 *
 * Found via the extended sweep item 4 asked for, not named by the reviewer:
 * the same `#06B6D4`/`#10B981` pair as `SendAssetModalModern`'s success-view
 * badge (reachable through `Portfolio.tsx`, one of `Wallet.tsx`'s five
 * sibling routes). `white` missed the 3:1 icon floor against both stops
 * (2.54/2.43), mode-independent — the identical one-word repoint applies.
 *
 * The modal's "Copy Address" `Button` has the *same* defect class as the
 * Critical finding (`variant="contained"` on a fixed gradient), but is
 * deliberately left alone per this round's dispatch: pre-existing, and
 * dark mode's `primary.contrastText` measurably improves it over light's
 * already-broken `white` (light: 2.54/2.43 fail; dark: ~7.5/~7.2 pass) — not
 * a regression this task caused, since `Portfolio.tsx` was never wrapped in
 * `landingTheme` to begin with.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
import { ReceiveAssetModalModern } from '../ReceiveAssetModalModern';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader' } }),
}));

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

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function backgroundHexStops(el: HTMLElement): string[] {
  const style = getComputedStyle(el);
  const image = style.backgroundImage;
  if (image?.includes('gradient')) {
    const stops = image.match(/rgb\([^)]+\)|#[0-9a-fA-F]{3,8}/g);
    if (stops?.length) return stops.map(toHex);
  }
  return [toHex(style.backgroundColor)];
}

describe('ReceiveAssetModalModern — badge icon', () => {
  it('clears the 3:1 icon floor against every stop of its fixed gradient', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <ReceiveAssetModalModern isOpen onClose={vi.fn()} assetName="DCC" />
      </ThemeProvider>,
    );
    const icon = screen.getByTestId('CallReceivedIcon') as unknown as HTMLElement;
    const badge = icon.parentElement as HTMLElement;
    const ink = toHex(getComputedStyle(icon).color);
    for (const bg of backgroundHexStops(badge)) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(3);
    }
  });
});
