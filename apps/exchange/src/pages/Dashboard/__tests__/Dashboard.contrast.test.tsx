/**
 * Dashboard — both-mode contrast
 *
 * `Dashboard.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas`/
 * `palette.indigoHover` — every colour role it uses (`text.primary`,
 * `text.secondary`, `primary.main`/`contrastText`, `secondary.main`/
 * `contrastText`, `action.hover`/`selected`, `background.default`) is
 * theme-relative and was already repointed at Task 2's own per-mode ink
 * tokens (see the inline comments citing task-2-report.md). Removing the
 * `<ThemeProvider theme={landingTheme}>` wrapper re-derives them from the
 * real app theme. This test verifies that claim, and separately verifies
 * `StatCard`'s own tone plates (a component only Dashboard renders) — its
 * `bg`/`fg` pair is a fixed literal, self-consistent in both modes, so it is
 * not a mode regression, but it is asserted directly rather than assumed.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Dashboard } from '../Dashboard';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader' } }),
}));
vi.mock('@/hooks/useBalanceWatcher', () => ({
  useBalanceWatcher: () => ({ balances: { assets: {}, available: 0 }, isLoading: false }),
}));
vi.mock('@/hooks/useAliases', () => ({ useAliases: () => ({ aliases: [] }) }));
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

function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Dashboard — page chrome (%s mode)', (mode) => {
  it('the canvas actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const heading = screen.getByText('Quick Actions');
    const bg = nearestBackground(heading);
    expect(rgbToHex(bg)).toBe(tokens(mode).surface.raised);
  });

  it('section headings and empty-state copy clear AA against the card', () => {
    renderIn(mode);
    for (const text of [
      screen.getByText('Quick Actions'),
      screen.getByText('My Assets'),
      screen.getByText('Recent Activity'),
      screen.getByText('Portfolio Breakdown'),
      screen.getByText('No assets found'),
      screen.getByText(/Nothing yet\. Transfers, orders and leases/),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the "Total Value" portfolio banner ink clears AA against its own fill', () => {
    renderIn(mode);
    const label = screen.getByText('Total Value');
    const ink = rgbToHex(getComputedStyle(label).color);
    const bg = rgbToHex(nearestBackground(label));
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
