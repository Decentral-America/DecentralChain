/**
 * Dex — both-mode contrast
 *
 * The terminal's chrome is built from semantic roles only (`surface.*`,
 * `text.*`, `border.*`, `accent.*`, and the two direction hues off `appTile`);
 * nothing in `pages/Dex` or `features/dex/terminal` names a colour. The heavy
 * regions — chart, book, forms, tables — are stubbed so this isolates the page
 * chrome itself, each of them swept by `noRawColours` separately.
 *
 * Four properties, the same ones the previous layout was held to:
 * the panels take the ambient mode; every region title clears AA on its own
 * panel; the *unselected* side of the order switch clears AA (the lowest-
 * contrast text on the page); and the history tab labels clear AA.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Dex } from '../Dex';

vi.mock('@/features/dex/OrderBook', () => ({ OrderBook: () => <div>order-book</div> }));
vi.mock('@/features/dex/BuyOrderForm', () => ({ BuyOrderForm: () => <div>buy-form</div> }));
vi.mock('@/features/dex/SellOrderForm', () => ({ SellOrderForm: () => <div>sell-form</div> }));
vi.mock('@/features/dex/TradeHistory', () => ({ TradeHistory: () => <div>trade-history</div> }));
vi.mock('@/features/dex/TradingViewChart', () => ({
  TradingViewChart: () => <div>chart</div>,
}));
vi.mock('@/features/dex/TerminalOrdersTable', () => ({
  TerminalOrdersTable: () => <div>orders-table</div>,
}));
vi.mock('@/api/services/matcherService', () => ({
  useMarketStats24h: () => ({ data: undefined }),
  useOrderBook: () => ({ data: undefined }),
}));
vi.mock('react-i18next', () => ({
  initReactI18next: { init: () => {}, type: '3rdParty' },
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

const aa = (el: HTMLElement) =>
  contrastRatio(rgbToHex(getComputedStyle(el).color), rgbToHex(nearestBackground(el)));

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
    const bg = nearestBackground(screen.getByText('Order book'));
    expect(rgbToHex(bg)).toBe(tokens(mode).surface.raised);
  });

  it('every region title clears AA against its own panel', () => {
    renderIn(mode);
    for (const text of ['Order book', 'Open orders', 'Trade history', 'Limit order']) {
      expect(aa(screen.getByText(text)), text).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the unselected side of the order switch clears AA', () => {
    renderIn(mode);
    // BUY is selected on mount; SELL sits on the sunken track in secondary ink,
    // the lowest-contrast text in the panel.
    expect(aa(screen.getByText('SELL'))).toBeGreaterThanOrEqual(4.5);
  });

  it('the unselected history tabs clear AA', () => {
    renderIn(mode);
    for (const text of ['Order history', 'Balance']) {
      expect(aa(screen.getByText(text)), text).toBeGreaterThanOrEqual(4.5);
    }
  });
});
