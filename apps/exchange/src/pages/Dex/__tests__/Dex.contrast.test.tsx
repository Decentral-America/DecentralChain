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
vi.mock('@/features/dex/UserOrders', () => ({ UserOrders: () => <div>user-orders</div> }));
vi.mock('@/api/services/matcherService', () => ({
  useMarketStats24h: () => ({ data: undefined }),
  useOrderBook: () => ({ data: undefined }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
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
      <Dex />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Dex — page chrome (%s mode)', (mode) => {
  it('the panel actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const heading = screen.getByText('Price Chart');
    const bg = nearestBackground(heading);
    expect(rgbToHex(bg)).toBe(tokens(mode).surface.raised);
  });

  it('the stat labels and price display clear AA against the panel', () => {
    renderIn(mode);
    for (const text of [
      screen.getByText('Last Price'),
      screen.getByText('24h Change'),
      screen.getByText('24h Volume'),
      screen.getByText('Price Chart'),
      screen.getByText('Order Book'),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the Buy/Sell tab labels clear AA in their unselected state', () => {
    renderIn(mode);
    for (const text of [screen.getByText('Limit'), screen.getByText('Market')]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
