/**
 * Dex — both-mode contrast
 *
 * `Dex.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas`/
 * `palette.indigoHover` — every colour role it uses (`background.paper`,
 * `divider`, `text.secondary`, `primary.main`, `success.main`/`error.main`
 * with their `contrastText`) is theme-relative, and its entire render tree
 * (`TradingPairSelector`, `OrderBook`, `BuyOrderForm`, `SellOrderForm`,
 * `TradeHistory`, `TradingViewChart`, `UserOrders`) was independently
 * confirmed to hold no hardcoded literal either — `TradingViewChart` reads
 * `theme.palette.*` for every chart colour. The heavy feature panels are
 * stubbed here so this test isolates the page chrome itself; each was swept
 * separately (see task-6-report.md) rather than trusted from a file list.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Dex } from '../Dex';

vi.mock('@/features/dex/TradingPairSelector', () => ({
  TradingPairSelector: () => <div>pair-selector</div>,
}));
vi.mock('@/features/dex/OrderBook', () => ({ OrderBook: () => <div>order-book</div> }));
vi.mock('@/features/dex/BuyOrderForm', () => ({ BuyOrderForm: () => <div>buy-form</div> }));
vi.mock('@/features/dex/SellOrderForm', () => ({ SellOrderForm: () => <div>sell-form</div> }));
vi.mock('@/features/dex/TradeHistory', () => ({ TradeHistory: () => <div>trade-history</div> }));
vi.mock('@/features/dex/TradingViewChart', () => ({
  TradingViewChart: () => <div>chart</div>,
}));
// The rail's table reaches for auth and the matcher; this suite is about page
// chrome, so it is stubbed the same way every other region is.
vi.mock('@/features/dex/TerminalOrdersTable', () => ({
  TerminalOrdersTable: () => <div>orders-table</div>,
}));
vi.mock('@/api/services/matcherService', () => ({
  useMarketStats24h: () => ({ data: undefined }),
  useOrderBook: () => ({ data: undefined }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
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

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Dex />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Dex — terminal chrome (%s mode)', (mode) => {
  it('the panels follow the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const heading = screen.getByText('Order Book');
    const bg = nearestBackground(heading);
    expect(rgbToHex(bg)).toBe(tokens(mode).surface.raised);
  });

  it('every panel title clears AA against its own panel', () => {
    // The terminal replaced the stat bar and the card headers with four
    // titled regions; this asserts the same property against the chrome that
    // now exists rather than the chrome that used to.
    renderIn(mode);
    for (const text of [
      screen.getByText('Order Book'),
      screen.getByText('Market Depth'),
      screen.getByText('My Open Orders'),
      screen.getByText('Trade History'),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the Buy/Sell tab labels clear AA in their unselected state', () => {
    renderIn(mode);
    // SELL is the unselected side on mount, and an unselected MUI tab is the
    // lowest-contrast text in the panel.
    const label = screen.getByText('SELL');
    const ink = rgbToHex(getComputedStyle(label).color);
    const bg = rgbToHex(nearestBackground(label));
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the markets rail column headers clear AA', () => {
    renderIn(mode);
    for (const text of [screen.getByText('Pair'), screen.getByText('Volume')]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
