/**
 * ReceiveAssetModalModern — badge icon ink vs its fixed fill
 *
 * Task 8 replaced the badge's old cyan-to-emerald two-stop gradient
 * (`#06B6D4`→`#10B981`) with a solid `tokens('light').intent.success` fill —
 * a fixed badge, mode-independent by design, matching `SendAssetModalModern`'s
 * sibling success badge. Fix round 1 caught a semantic error in the repoint
 * that shipped alongside it: the icon's ink was pinned to
 * `tokens('light').text.primary` (3.42:1), the "fixed badge → dark ink"
 * pattern used for badges with *light* fixed fills elsewhere in this file —
 * wrong here, because this fill is a solid intent colour with its own
 * purpose-built ink, `intent.onSuccess` (5.34:1).
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
import { ReceiveAssetModalModern } from '../ReceiveAssetModalModern';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader' } }),
}));

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
  it('clears the 4.5:1 body-text floor against its own fixed intent.success fill', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <ReceiveAssetModalModern isOpen onClose={vi.fn()} assetName="DCC" />
      </ThemeProvider>,
    );
    const icon = screen.getByTestId('CallReceivedIcon') as unknown as HTMLElement;
    const badge = icon.parentElement as HTMLElement;
    const ink = toHex(getComputedStyle(icon).color);
    for (const bg of backgroundHexStops(badge)) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
