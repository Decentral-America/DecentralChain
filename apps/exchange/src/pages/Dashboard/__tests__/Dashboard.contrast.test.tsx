/**
 * Dashboard — both-mode contrast
 *
 * `Dashboard.tsx` names no colour of its own: every role it paints with is
 * theme-relative — MUI's `Card` surface, `PageFrame`'s `text.primary`/
 * `text.secondary`, and the premium components' styled-components roles
 * (`colors.text`, `colors.textSecondary`, `colors.surface`, `chrome[mode]`).
 * This file verifies that claim against the redesigned screen in both modes,
 * with both theme providers the app mounts, since the premium components read
 * the styled-components theme and throw without it.
 *
 * The screen it measures:
 *
 *   - the page title, section headings and their counts sit directly on the
 *     ground (`background.default`, which `MainLayout` paints — reproduced
 *     here by a wrapper, so nothing falls through to `<body>`);
 *   - the balance hero (caption, figure, holdings line, empty chart note) and
 *     the quick-action grid are two `Card`s on that ground;
 *   - Assets and Recent activity are grouped inset lists, each a lifted
 *     surface, here showing their empty states.
 *
 * The old "Total Value" banner and the `StatCard` tone plates it sat among are
 * gone — the balance hero replaced them, and its counts are now quiet
 * secondary text under the figure, asserted below. "Portfolio Breakdown" was
 * removed with no equivalent on this screen (the portfolio page owns it), so
 * it has no case here.
 */
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { paintedBackground } from '@/test-utils/paintedBackground';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Dashboard } from '../Dashboard';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader' } }),
}));
vi.mock('@/hooks/useBalanceWatcher', () => ({
  useBalanceWatcher: () => ({ balances: { assets: {}, available: 0 }, isLoading: false }),
}));
/*
 * The holdings line under the balance only trusts the alias count once it has
 * seen a fetch start and finish (an idle hook's empty list is not an answer),
 * and shows a skeleton until then. The stub therefore goes through that one
 * loading → settled cycle, so the line renders its text and can be measured.
 */
vi.mock('@/hooks/useAliases', async () => {
  const { useEffect, useState } = await import('react');
  return {
    useAliases: () => {
      const [isLoading, setLoading] = useState(true);
      useEffect(() => setLoading(false), []);
      return { aliases: [], error: null, isLoading };
    },
  };
});
vi.mock('@/api/services/addressService', () => ({
  useAddressTransactions: () => ({ data: undefined }),
}));
vi.mock('@/api/services/assetsService', () => ({
  useMultipleAssetDetails: () => ({ data: undefined }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/contexts/ConfigContext', () => ({
  useConfig: () => ({ assets: {}, gateway: {} }),
}));
// Closed by default (createAliasOpen starts false); its own contrast is
// verified independently and has no hardcoded literal (confirmed by grep).
// Its transitive hooks (useToast/useTransactionSigning) need providers this
// test does not otherwise exercise, so it is stubbed rather than deep-mocked.
vi.mock('@/components/modals/CreateAliasModal', () => ({
  CreateAliasModal: () => null,
}));

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <CssBaseline />
        {/* `MainLayout`'s ground: the routed page sits directly on it. */}
        <Box sx={{ bgcolor: 'background.default' }}>
          <Dashboard />
        </Box>
      </StyledThemeProvider>
    </ThemeProvider>,
  );

/** Ink (the element's own declared colour) against what is painted behind it. */
function ratioOf(el: HTMLElement): number {
  return contrastRatio(rgbToHex(getComputedStyle(el).color), rgbToHex(paintedBackground(el)));
}

const section = (name: RegExp) =>
  screen.getByRole('heading', { name }).closest('section') as HTMLElement;

describe.each(['light', 'dark'] as const)('Dashboard — page chrome (%s mode)', (mode) => {
  it('the ground and the cards actually follow the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const t = tokens(mode);
    // The page title sits on the ground itself.
    expect(rgbToHex(paintedBackground(screen.getByRole('heading', { level: 1 })))).toBe(
      t.surface.base,
    );
    // The two hero cards and the two grouped lists are the raised surface.
    for (const onCard of [
      screen.getByText('Balance'),
      screen.getByRole('group', { name: 'Quick actions' }),
      screen.getByText('No assets yet'),
      screen.getByText('No activity yet'),
    ]) {
      expect(rgbToHex(paintedBackground(onCard))).toBe(t.surface.raised);
    }
  });

  it('the page title, section headings, counts and header links clear AA against the ground', () => {
    renderIn(mode);
    const assets = screen.getByRole('heading', { name: /^Assets/ });
    const onGround = [
      screen.getByRole('heading', { level: 1, name: 'Welcome back, Trader' }),
      screen.getByText("Here's an overview of your portfolio and recent activity"),
      assets,
      // The quiet count beside the title ("Assets 0").
      within(assets).getByText('0'),
      screen.getByRole('heading', { name: 'Recent activity' }),
      screen.getByRole('button', { name: 'View portfolio' }),
      screen.getByRole('button', { name: 'See all' }),
    ];
    for (const el of onGround) {
      // Guard: measured on the ground, not on a card or `<body>`'s default.
      expect(rgbToHex(paintedBackground(el))).toBe(tokens(mode).surface.base);
      expect(ratioOf(el)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the balance hero — caption, figure, unit, holdings line and chart note — clears AA on its card', () => {
    renderIn(mode);
    const unit = screen.getByText('DCC', { selector: 'small' });
    const onHero = [
      screen.getByText('Balance'),
      // The figure's own element declares the ink; the unit declares a quieter one.
      unit.parentElement as HTMLElement,
      unit,
      // Replaces the old stat cards' counts: quiet secondary text under the figure.
      screen.getByText('0 assets · 0 aliases'),
      screen.getByText('Balance history will appear here once it is available'),
    ];
    for (const el of onHero) {
      expect(ratioOf(el)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('every quick-action tile label clears AA against its own fill', () => {
    renderIn(mode);
    const tiles = within(screen.getByRole('group', { name: 'Quick actions' })).getAllByRole(
      'button',
    );
    expect(tiles).toHaveLength(9);
    for (const tile of tiles) {
      // The tile declares the ink its label inherits; its fill is a translucent
      // control material over the card (or the accent, for the primary tile),
      // composited as painted.
      expect(ratioOf(tile)).toBeGreaterThanOrEqual(4.5);
    }
    // The one filled tile carries the accent, not a fixed literal.
    const send = screen.getByRole('button', { name: 'Send' });
    expect(rgbToHex(paintedBackground(send))).toBe(tokens(mode).accent.primary);
  });

  it('the empty states clear AA against the grouped list they sit in', () => {
    renderIn(mode);
    const assets = section(/^Assets/);
    const activity = section(/^Recent activity/);
    for (const el of [
      within(assets).getByText('No assets yet'),
      within(assets).getByText(/Receive DCC or any token to this address/),
      within(activity).getByText('No activity yet'),
      within(activity).getByText('Transfers, trades and leases appear here as they confirm.'),
    ]) {
      expect(ratioOf(el)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
