/**
 * LeasingModern — hero badge icon ink vs its fixed gradient (fix round 1)
 *
 * Reachable only through `Wallet.tsx`'s `<Outlet/>` (one of the five sibling
 * routes named but not individually swept in task-6-report.md's first pass).
 *
 * The icon badge is a fixed `white` `TrendingUpOutlined` on a fixed
 * `#F59E0B→#FB923C` gradient — missed the 3:1 icon floor against both stops
 * (2.15/2.26), mode-independent (neither the icon colour nor the gradient
 * ever reads the theme). Unlike the Send button/badge findings in the same
 * round, both stops clear comfortably with a single pinned dark ink
 * (8.49/8.06), so this is a one-word repoint rather than a design decision.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
import { LeasingModern } from '../LeasingModern';

// The legacy `Leasing` component underneath the hero is its own heavy tree
// (data-service, react-query, `useBalanceWatcher`) unrelated to the hero
// badge under test — stubbed so this test isolates the badge.
vi.mock('../Leasing', () => ({ Leasing: () => null }));

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

describe('LeasingModern — hero badge icon', () => {
  it('clears the 3:1 icon floor against every stop of its fixed gradient', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <LeasingModern />
      </ThemeProvider>,
    );
    const icon = screen.getByTestId('TrendingUpOutlinedIcon') as unknown as HTMLElement;
    const badge = icon.parentElement as HTMLElement;
    const ink = toHex(getComputedStyle(icon).color);
    for (const bg of backgroundHexStops(badge)) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(3);
    }
  });
});
