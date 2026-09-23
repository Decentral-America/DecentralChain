/**
 * DEX terminal.
 *
 * Four regions on one screen, no page chrome and no scrolling document:
 *
 *   markets │ chart      │ order book
 *   ────────┴────────────┤ ───────────
 *   orders / balances    │ buy · sell
 *
 * The panels are flat and share hairline borders rather than sitting as
 * separate cards, because a terminal is read as one surface. Nothing here
 * scrolls as a page — each region scrolls inside itself, so the market list
 * and the order book can be long without pushing the form off screen.
 */

import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Box, Collapse, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useMarketStats24h, useOrderBook } from '@/api/services/matcherService';
import { BuyOrderForm } from '@/features/dex/BuyOrderForm';
import { MarketsPanel } from '@/features/dex/MarketsPanel';
import { OrderBook } from '@/features/dex/OrderBook';
import { SellOrderForm } from '@/features/dex/SellOrderForm';
import { TerminalOrdersTable } from '@/features/dex/TerminalOrdersTable';
import { TradeHistory } from '@/features/dex/TradeHistory';
import { TradingViewChart } from '@/features/dex/TradingViewChart';
import {
  selectSelectedPair,
  selectUpdateMarketData,
  selectUpdateOrderBook,
  useDexStore,
} from '@/stores/dexStore';

/** One region of the terminal. Borders are shared, so only two edges are drawn. */
const Panel: React.FC<{
  children: React.ReactNode;
  borderLeft?: boolean;
  borderTop?: boolean;
}> = ({ borderLeft = false, borderTop = false, children }) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      borderBottomWidth: 0,
      borderColor: 'divider',
      borderLeftWidth: borderLeft ? 1 : 0,
      borderRightWidth: 0,
      borderStyle: 'solid',
      borderTopWidth: borderTop ? 1 : 0,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      minWidth: 0,
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
);

/** Panel title bar — the same 40px rule everywhere so the regions line up. */
const PanelTitle: React.FC<{ children: React.ReactNode; actions?: React.ReactNode }> = ({
  actions,
  children,
}) => (
  <Box
    sx={{
      alignItems: 'center',
      borderBottom: 1,
      borderColor: 'divider',
      display: 'flex',
      flexShrink: 0,
      justifyContent: 'space-between',
      minHeight: 40,
      px: 2,
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
      {children}
    </Typography>
    {actions}
  </Box>
);

const BOTTOM_ROW_HEIGHT = 368;

/**
 * How tall the trading region is.
 *
 * The chart is the reason this screen exists, so it takes the viewport. The
 * orders rail sits underneath and is reached by scrolling — its tabs stay
 * visible at the bottom edge, which is what tells you there is more down
 * there. `main` in MainLayout is the app's one scroll container, so making
 * this page taller than it is what produces the scroll.
 */
const TRADING_REGION_HEIGHT = 'calc(100dvh - 210px)';
const SIDE_COLUMN_WIDTH = 356;
const MARKETS_WIDTH = 340;

export const Dex: React.FC = () => {
  const selectedPair = useDexStore(selectSelectedPair);
  const updateOrderBook = useDexStore(selectUpdateOrderBook);
  const updateMarketData = useDexStore(selectUpdateMarketData);
  const [ordersTab, setOrdersTab] = useState(0);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [depthOpen, setDepthOpen] = useState(false);
  const [railsOpen, setRailsOpen] = useState(true);

  // 50 levels a side. The hook owns its own polling interval — overriding it
  // here is what let this page drift to a 5s poll previously.
  const { data: orderBookData } = useOrderBook(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    50,
    { enabled: !!selectedPair },
  );

  // The matcher returns bare price/amount levels; the store holds Orders. The
  // synthetic ids are positional and exist only to key the rows.
  useEffect(() => {
    if (!orderBookData) return;

    updateOrderBook({
      asks: orderBookData.asks.map((ask, idx) => ({
        amount: ask.amount.toString(),
        id: `ask-${idx}`,
        price: ask.price.toString(),
        timestamp: orderBookData.timestamp,
        type: 'sell' as const,
      })),
      bids: orderBookData.bids.map((bid, idx) => ({
        amount: bid.amount.toString(),
        id: `bid-${idx}`,
        price: bid.price.toString(),
        timestamp: orderBookData.timestamp,
        type: 'buy' as const,
      })),
    });
  }, [orderBookData, updateOrderBook]);

  // Real 24h aggregates, from data-service candles.
  const { data: stats24h } = useMarketStats24h(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    { enabled: !!selectedPair },
  );

  /**
   * "Last Price" is the close of the most recent traded candle, not the best
   * bid — on a book with a wide spread the best bid can sit far from anything
   * that ever changed hands. It falls back to the mid only when the pair has
   * not traded in 24h, so the order book's header shows something meaningful
   * instead of zero.
   */
  useEffect(() => {
    if (!stats24h) return;

    const bestBid = orderBookData?.bids[0]?.price ?? 0;
    const bestAsk = orderBookData?.asks[0]?.price ?? 0;
    const mid = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk || 0;

    updateMarketData({
      currentPrice: stats24h.hasTrades ? stats24h.lastPrice : mid,
      high24h: stats24h.high24h,
      lastPrice: stats24h.lastPrice,
      low24h: stats24h.low24h,
      priceChange24h: stats24h.priceChange24h,
      priceChangePercent24h: stats24h.priceChangePercent24h,
      volume24h: stats24h.volume24h,
    });
  }, [stats24h, orderBookData, updateMarketData]);

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        display: 'grid',
        gridTemplateColumns: { lg: `minmax(0, 1fr) ${SIDE_COLUMN_WIDTH}px`, xs: 'minmax(0, 1fr)' },
        minHeight: 0,
      }}
    >
      {/* Left: markets + chart above, orders below */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: `${TRADING_REGION_HEIGHT} ${BOTTOM_ROW_HEIGHT}px`,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              md: railsOpen ? `${MARKETS_WIDTH}px minmax(0, 1fr)` : '0px minmax(0, 1fr)',
              xs: 'minmax(0, 1fr)',
            },
            minHeight: 0,
            minWidth: 0,
            transition: 'grid-template-columns 160ms',
          }}
        >
          <Box sx={{ display: { md: 'block', xs: 'none' }, minHeight: 0, overflow: 'hidden' }}>
            <MarketsPanel />
          </Box>

          <Panel>
            {/* The chart owns this region outright — no title bar competing
                with it, which is what the extra 40px is worth here. The
                handle on its edge collapses the markets rail rather than
                being decoration. */}
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
              <Box
                onClick={() => setRailsOpen((open) => !open)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setRailsOpen((open) => !open);
                }}
                aria-label={railsOpen ? 'Collapse markets list' : 'Expand markets list'}
                sx={{
                  '&:hover': { color: 'text.primary' },
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  borderLeftWidth: 0,
                  borderRadius: '0 4px 4px 0',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  color: 'text.secondary',
                  cursor: 'pointer',
                  display: { md: 'flex', xs: 'none' },
                  height: 44,
                  justifyContent: 'center',
                  left: 0,
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  zIndex: 1,
                }}
              >
                {railsOpen ? (
                  <ChevronLeft sx={{ fontSize: 14 }} />
                ) : (
                  <ChevronRight sx={{ fontSize: 14 }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
                <TradingViewChart />
              </Box>
            </Box>
          </Panel>
        </Box>

        <Panel borderTop>
          <Tabs
            value={ordersTab}
            onChange={(_e, v: number) => setOrdersTab(v)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              '& .MuiTab-root': { fontSize: 13, minHeight: 40, px: 2, textTransform: 'none' },
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
              minHeight: 40,
            }}
          >
            <Tab label="My Open Orders" />
            <Tab label="My Order History" />
            <Tab label="My Trade History" />
            <Tab label="Trade History" />
            <Tab label="My Balance" />
          </Tabs>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            {ordersTab === 3 && <TradeHistory />}
            {ordersTab === 0 && <TerminalOrdersTable scope="open" />}
            {(ordersTab === 1 || ordersTab === 2) && <TerminalOrdersTable scope="history" />}
            {ordersTab === 4 && <TerminalOrdersTable scope="open" />}
          </Box>
        </Panel>
      </Box>

      {/* Right: order book above, order form below */}
      <Box
        sx={{
          display: { lg: 'grid', xs: 'none' },
          gridTemplateRows: `${TRADING_REGION_HEIGHT} ${BOTTOM_ROW_HEIGHT}px`,
          minHeight: 0,
        }}
      >
        <Panel borderLeft>
          <PanelTitle>Order Book</PanelTitle>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <OrderBook />
          </Box>

          {/*
            Market depth collapses by default. It plots the same levels the
            book above already lists, so on a shallow pair it earns none of
            the height it would take from them.
          */}
          <Box sx={{ borderColor: 'divider', borderTop: 1, flexShrink: 0 }}>
            <Box
              onClick={() => setDepthOpen((open) => !open)}
              sx={{
                alignItems: 'center',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                minHeight: 40,
                px: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Market Depth
              </Typography>
              <IconButton
                size="small"
                aria-label={depthOpen ? 'Collapse market depth' : 'Expand market depth'}
              >
                {depthOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={depthOpen}>
              <Box sx={{ pb: 2, px: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Depth is drawn from the levels listed above.
                </Typography>
              </Box>
            </Collapse>
          </Box>
        </Panel>

        <Panel borderLeft borderTop>
          <Tabs
            value={side}
            onChange={(_e, v: 'buy' | 'sell') => setSide(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.06em',
                minHeight: 40,
              },
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
              minHeight: 40,
            }}
          >
            <Tab value="buy" label="BUY" />
            <Tab value="sell" label="SELL" />
          </Tabs>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1.5, py: 1 }}>
            {side === 'buy' ? <BuyOrderForm /> : <SellOrderForm />}
          </Box>
        </Panel>
      </Box>
    </Box>
  );
};
