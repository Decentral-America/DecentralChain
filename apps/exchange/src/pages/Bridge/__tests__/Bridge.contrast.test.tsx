/**
 * Bridge — both-mode contrast
 *
 * `Bridge.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas`/
 * `palette.indigoHover` — every colour role it uses (`background.default`,
 * `text.secondary`, `primary.main`) is theme-relative, so removing its two
 * `<ThemeProvider theme={landingTheme}>` wrappers (one per branch: signed-out
 * and signed-in) re-derives them from the real app theme automatically. This
 * test verifies that claim on both branches, in both modes — before the fix,
 * both branches always rendered `landingTheme`'s hardcoded light palette
 * regardless of the ambient theme this test wraps them in.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Bridge } from '../Bridge';

vi.mock('@/hooks/useBalanceWatcher', () => ({
  useBalanceWatcher: () => ({ balances: null }),
}));
vi.mock('@/hooks/useGatewayTransaction', () => ({
  useGatewayTransaction: () => ({ withdraw: vi.fn() }),
}));
vi.mock('@/contexts/ConfigContext', () => ({
  useConfig: () => ({ assets: {}, gateway: {} }),
}));

function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

let mockUser: { address: string; name: string } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Bridge />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Bridge — signed-out branch (%s mode)', (mode) => {
  it('the "Authentication Required" heading and body clear AA against the canvas', () => {
    mockUser = null;
    renderIn(mode);
    for (const text of [
      screen.getByText('Authentication Required'),
      screen.getByText(/Please log in to access the cross-chain bridge/),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe.each(['light', 'dark'] as const)('Bridge — signed-in branch (%s mode)', (mode) => {
  it('the canvas actually follows the ambient theme mode, not a forced light literal', () => {
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    const heading = screen.getByText('Cross-Chain Bridge');
    const canvas = nearestBackground(heading);
    expect(rgbToHex(canvas)).toBe(tokens(mode).surface.base);
  });

  it('the header, subtitle and network ticker caption clear AA against the canvas', () => {
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    for (const text of [
      screen.getByText('Cross-Chain Bridge'),
      screen.getByText(/Transfer assets between DecentralChain/),
      screen.getByText('Bitcoin'),
      screen.getByText('BTC'),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the info alert body clears AA against its own background', () => {
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    const alert = screen.getByRole('alert');
    const ink = rgbToHex(getComputedStyle(alert).color);
    const bg = rgbToHex(getComputedStyle(alert).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
