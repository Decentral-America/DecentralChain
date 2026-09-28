/**
 * Bridge — both-mode contrast
 *
 * `Bridge.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas`/
 * `palette.indigoHover` — every colour role it uses (`background.default`,
 * `background.paper`, `text.secondary`, `primary.main`) is theme-relative, and
 * the redesigned premium pieces it now renders (`EmptyState`,
 * `SegmentedControl`) read the styled-components theme built from the same
 * semantic tokens. This test verifies that on both branches, in both modes —
 * before the `landingTheme` wrappers came off, both branches always rendered a
 * hardcoded light palette regardless of the ambient theme.
 *
 * The app mounts both theme providers above every page, so this does too:
 * the premium components read `theme.colors`/`theme.mode` from
 * styled-components and do not render without it.
 *
 * The redesign moved the text onto new surfaces: the signed-out prompt is an
 * `EmptyState` on a `background.paper` card, and the network picker is a
 * radio group of `background.paper` cards rather than MUI `Card`s. Each
 * assertion measures the colour actually painted behind the text
 * (`paintedBackground`), and where that surface is a card, asserts it is the
 * card's own token — so a card that stopped painting would fail rather than
 * quietly measure the page canvas underneath.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { paintedBackground } from '@/test-utils/paintedBackground';
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

let mockUser: { address: string; name: string } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// The sign-in prompt's action is a router link now, so the page needs a router.
const renderIn = (mode: ThemeMode) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createAppTheme(mode)}>
        <StyledThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
          <CssBaseline />
          <Bridge />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

describe.each(['light', 'dark'] as const)('Bridge — signed-out branch (%s mode)', (mode) => {
  it('the "Authentication Required" heading and body clear AA against their card', () => {
    mockUser = null;
    renderIn(mode);
    for (const text of [
      screen.getByText('Authentication Required'),
      screen.getByText(/Please log in to access the cross-chain bridge/),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(paintedBackground(text));
      // The prompt's own card, not the page canvas behind it.
      expect(bg).toBe(tokens(mode).surface.raised);
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe.each(['light', 'dark'] as const)('Bridge — signed-in branch (%s mode)', (mode) => {
  it('the canvas actually follows the ambient theme mode, not a forced light literal', () => {
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    const heading = screen.getByRole('heading', { level: 1, name: 'Cross-Chain Bridge' });
    expect(rgbToHex(paintedBackground(heading))).toBe(tokens(mode).surface.base);
  });

  it('the header and subtitle clear AA against the canvas', () => {
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    for (const text of [
      screen.getByRole('heading', { level: 1, name: 'Cross-Chain Bridge' }),
      screen.getByText(/Transfer assets between DecentralChain/),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(paintedBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('each network card follows the theme, and its name and caption clear AA on it', () => {
    // The picker is a radio group of cards again, and each card carries its
    // ticker (or "Coming Soon") under the name in `text.secondary` — both
    // lines are read, so both are measured against the card they sit on.
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    for (const network of ['Bitcoin', 'Solana', 'Ethereum', 'BNB Smart Chain']) {
      const card = screen.getByRole('radio', { name: new RegExp(network) });
      expect(rgbToHex(paintedBackground(card))).toBe(tokens(mode).surface.raised);

      const name = within(card).getByText(network);
      // The caption line directly under the name: "BTC", or "Coming Soon".
      const caption = name.nextElementSibling as HTMLElement;
      expect(caption.textContent).toMatch(/^(BTC|SOL|Coming Soon)$/);
      for (const text of [name, caption]) {
        const ink = rgbToHex(getComputedStyle(text).color);
        const bg = rgbToHex(paintedBackground(text));
        expect(bg).toBe(tokens(mode).surface.raised);
        expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('the info alert body clears AA against its own background', () => {
    mockUser = { address: '3P123', name: 'Trader' };
    renderIn(mode);
    const alert = screen.getByRole('alert');
    const ink = rgbToHex(getComputedStyle(alert).color);
    const bg = rgbToHex(paintedBackground(alert));
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
