/**
 * Wallet — both-mode ground
 *
 * `Wallet.tsx` renders no text of its own. It used to be a styled container
 * painting `theme.palette.background.default` around the routed `<Outlet/>`,
 * inside a `<ThemeProvider theme={landingTheme}>` that forced it light;
 * removing that wrapper let the app theme reach the wallet screens.
 *
 * Since the redesign it is a transparent pass-through: a height-only `Box` on
 * desktop, the bare `<Outlet/>` on mobile. The ground behind every wallet
 * screen is the shell's (`MainLayout` paints `background.default`, covered by
 * its own suite), and `themeToggleAcceptance.test.tsx` asserts Wallet paints
 * no ground of its own. The guarantee this file holds is the same one as
 * before, restated for that structure: what is painted behind the routed
 * screen follows the ambient theme mode, and Wallet cannot pin it to a light
 * literal because it paints nothing over the shell ground at all.
 *
 * Note: `Wallet.tsx`'s wrapper was not just around `Dashboard` (the `index`
 * route) — `walletRoutes.tsx` nests `Portfolio`, `LeasingModern`,
 * `TransactionsModern`, `AliasManagement` and `AccountManagerPage` under the
 * same `<Outlet/>`, so all five were also always forced to `landingTheme`'s
 * light palette and first reached real dark mode through that change. Each
 * was swept independently — see task-6-report.md.
 */
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { paintedBackground } from '@/test-utils/paintedBackground';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Wallet } from '../Wallet';

vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet-content">child route</div>,
}));

/**
 * Wallet inside a stand-in for the shell's ground: the same
 * `bgcolor: 'background.default'` `MainLayout` paints, read from the same
 * theme. The measurement never walks out to `<body>`, so it cannot report the
 * body's colour for a page that painted nothing.
 */
const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <Box data-testid="shell-ground" sx={{ bgcolor: 'background.default' }}>
          <Wallet />
        </Box>
      </StyledThemeProvider>
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Wallet — ground (%s mode)', (mode) => {
  it('paints nothing between the routed screen and the shell ground', () => {
    renderIn(mode);
    const shell = screen.getByTestId('shell-ground');
    let node = screen.getByTestId('outlet-content').parentElement;
    let walked = 0;
    while (node && node !== shell) {
      expect(getComputedStyle(node).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(node).backgroundImage).toBe('none');
      node = node.parentElement;
      walked++;
    }
    // Reached the shell from inside Wallet's own markup, not by falling out.
    expect(node).toBe(shell);
    expect(walked).toBeGreaterThan(0);
  });

  it('the ground behind the routed screen actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const behind = rgbToHex(paintedBackground(screen.getByTestId('outlet-content')));
    expect(behind).toBe(tokens(mode).surface.base);
    expect(behind).toBe(
      rgbToHex(getComputedStyle(screen.getByTestId('shell-ground')).backgroundColor),
    );
  });
});
