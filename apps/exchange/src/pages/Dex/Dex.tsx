/**
 * DEX Page
 * Modern crypto trading interface with advanced features
 * 3-column layout: OrderBook | Chart+Forms | Markets+Trades
 */

import { Fullscreen, Receipt, ShowChart, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStats24h, useOrderBook } from '@/api/services/matcherService';
import { BuyOrderForm } from '@/features/dex/BuyOrderForm';
import { OrderBook } from '@/features/dex/OrderBook';
import { SellOrderForm } from '@/features/dex/SellOrderForm';
import { TradeHistory } from '@/features/dex/TradeHistory';
import { TradingPairSelector } from '@/features/dex/TradingPairSelector';
// Import DEX components
import { TradingViewChart } from '@/features/dex/TradingViewChart';
import { UserOrders } from '@/features/dex/UserOrders';
import { PageFrame } from '@/layouts/PageFrame';
import {
  selectMarketData,
  selectSelectedPair,
  selectUpdateMarketData,
  selectUpdateOrderBook,
  useDexStore,
} from '@/stores/dexStore';
import { radii } from '@/styles/tokens';

/**
 * Clean white card panel like Swap page
 */
/*
 * The terminal surface: flat, hairline border, and the same corner every other
 * card in the application carries. It sat on the old 4px radius long after the
 * rest of the system moved, which made Trade the one screen whose panels
 * visibly did not belong to the product around them.
 */
const TradingPanel = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: radii.cards,
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  // minWidth:0 lets a dense panel shrink rather than widen the grid.
  minWidth: 0,
  overflow: 'hidden',
}));

/**
 * Panel header with clean styling
 */
const PanelHeader = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
}));

/**
 * Panel content area
 */
const PanelContent = styled(Box)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    '&:hover': {
      background: theme.palette.grey[400],
    },
    background: theme.palette.grey[300],
    borderRadius: '2px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

/**
 * Price display with trend
 */
const PriceDisplay = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'trend',
})<{ trend?: 'up' | 'down' | 'flat' }>(({ theme, trend }) => ({
  alignItems: 'center',
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.primary,
  display: 'flex',
  fontSize: 'clamp(24px, 3vw, 32px)',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 300,
  gap: theme.spacing(1),
  letterSpacing: '-0.64px',
}));

export const Dex = () => {
  const { t, i18n } = useTranslation();
  const [orderFormTab, setOrderFormTab] = useState(0); // 0 = Limit, 1 = Market
  const [tradesTab, setTradesTab] = useState(0); // 0 = Market Trades, 1 = My Trades
  const [bottomTab, setBottomTab] = useState(0); // 0 = Open Orders, 1 = Order History
  const [buySellMode, setBuySellMode] = useState<'buy' | 'sell'>('buy'); // Buy/Sell toggle

  // Get selected pair from DEX store
  const selectedPair = useDexStore(selectSelectedPair);
  const updateOrderBook = useDexStore(selectUpdateOrderBook);
  const updateMarketData = useDexStore(selectUpdateMarketData);
  const marketData = useDexStore(selectMarketData);

  // Fetch real order book data with polling
  // Cadence is owned by useOrderBook so every caller polls the book the same
  // way; overriding it here is what let this page drift to 5s.
  const { data: orderBookData } = useOrderBook(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    50,
    { enabled: !!selectedPair },
  );

  // Update store when order book data changes
  useEffect(() => {
    if (orderBookData) {
      // Transform API data to store format
      const transformedOrderBook = {
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
      };
      updateOrderBook(transformedOrderBook);
    }
  }, [orderBookData, updateOrderBook]);

  // Real 24h aggregates, derived from data-service candles.
  const { data: stats24h } = useMarketStats24h(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    { enabled: !!selectedPair },
  );

  // Push the traded numbers into the store.
  //
  // "Last Price" used to be the best *bid* off the order book, which is not a
  // traded price at all — on a book with a wide spread it can sit far from
  // anything that ever changed hands. It now comes from the close of the most
  // recent traded candle, and falls back to the mid-market price only when the
  // pair has not traded in 24h, so the header still shows something meaningful
  // rather than jumping to zero.
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

  // Calculate price trend.
  //
  // `>= 0` previously meant an untraded pair — every pair on this chain right
  // now — rendered a green up-arrow next to a hard 0.00%, which reads as "flat
  // but healthy" rather than "no trades". `null` suppresses the arrow entirely.
  const priceChange = stats24h?.hasTrades ? stats24h.priceChangePercent24h : null;
  const priceTrend = priceChange === null ? 'flat' : priceChange >= 0 ? 'up' : 'down';

  // Format current price for display
  const formattedPrice = marketData.currentPrice
    ? marketData.currentPrice.toLocaleString(i18n.language, {
        maximumFractionDigits: 8,
        minimumFractionDigits: 2,
      })
    : '0.00';

  return (
    <PageFrame fit title="Trade" subtitle="Place orders against the live order book.">
      {/* Top Compact Bar - Pair Info & Stats */}
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <TradingPanel elevation={0} sx={{ overflow: 'visible' }}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              {/* Pair Selector */}
              <Grid
                sx={{ overflow: 'visible', zIndex: 1000 }}
                size={{
                  md: 2.5,
                  xs: 12,
                }}
              >
                <TradingPairSelector />
              </Grid>

              {/* Price Display */}
              <Grid
                size={{
                  md: 2,
                  xs: 4,
                }}
              >
                <Box>
                  <Typography variant="caption" color="primary.main">
                    Last Price
                  </Typography>
                  <PriceDisplay
                    trend={priceTrend}
                    sx={{ fontSize: { sm: '1.5rem', xs: '1.2rem' } }}
                  >
                    {formattedPrice}
                    {priceTrend === 'up' && <TrendingUp sx={{ fontSize: '1.5rem' }} />}
                    {priceTrend === 'down' && <TrendingDown sx={{ fontSize: '1.5rem' }} />}
                  </PriceDisplay>
                </Box>
              </Grid>

              {/* 24h Change */}
              <Grid
                size={{
                  md: 1.5,
                  xs: 4,
                }}
              >
                <Box>
                  <Typography variant="caption" color="primary.main">
                    24h Change
                  </Typography>
                  <Typography
                    variant="h6"
                    color={
                      priceChange === null
                        ? 'text.secondary'
                        : priceChange >= 0
                          ? 'success.main'
                          : 'error.main'
                    }
                  >
                    {priceChange === null
                      ? '—'
                      : `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`}
                  </Typography>
                </Box>
              </Grid>

              {/* 24h High - hidden on xs */}
              <Grid
                sx={{ display: { sm: 'block', xs: 'none' } }}
                size={{
                  md: 2,
                  xs: 4,
                }}
              >
                <Box>
                  <Typography variant="caption" color="primary.main">
                    24h High
                  </Typography>
                  <Typography variant="body1">
                    {marketData.high24h > 0
                      ? marketData.high24h.toLocaleString('en-US', {
                          maximumFractionDigits: 8,
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </Typography>
                </Box>
              </Grid>

              {/* 24h Low - hidden on xs */}
              <Grid
                sx={{ display: { sm: 'block', xs: 'none' } }}
                size={{
                  md: 2,
                  xs: 4,
                }}
              >
                <Box>
                  <Typography variant="caption" color="primary.main">
                    24h Low
                  </Typography>
                  <Typography variant="body1">
                    {marketData.low24h > 0
                      ? marketData.low24h.toLocaleString('en-US', {
                          maximumFractionDigits: 8,
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </Typography>
                </Box>
              </Grid>

              {/* 24h Volume */}
              <Grid
                size={{
                  md: 2,
                  sm: 4,
                  xs: 12,
                }}
              >
                <Box>
                  <Typography variant="caption" color="primary.main">
                    24h Volume
                  </Typography>
                  <Typography variant="body1">
                    {marketData.volume24h > 0
                      ? marketData.volume24h.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TradingPanel>
      </Box>

      {/*
          The terminal fills whatever the market bar leaves.
          Panels used to carry fixed minimums — 550px of chart, 400px of order
          book, 560px of order form — which added up to a screen and a half and
          made the trading view scroll like a document. They are proportions of
          the available height now, each panel scrolling inside itself, which is
          how a terminal is meant to behave.
        */}
      <Box
        sx={{
          display: 'grid',
          flex: 1,
          gap: 2,
          /*
           * A CSS grid, not a wrapping flex row. MUI's Grid wraps, and a
           * wrapping flex line takes the height of its tallest item — so the
           * columns grew to their content and the terminal scrolled however
           * tightly the panels inside were constrained.
           */
          gridTemplateColumns: { md: 'minmax(0, 1fr) 360px', xs: 'minmax(0, 1fr)' },
          minHeight: 0,
        }}
      >
        {/* LEFT - Chart takes the width, for prominence */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* Large Chart Section */}
          <TradingPanel
            elevation={0}
            sx={{ flex: 1.9, minHeight: { md: 200, xs: 'clamp(190px, 30dvh, 280px)' } }}
          >
            <PanelHeader>
              <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                <ShowChart sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6">Price Chart</Typography>
              </Box>
              <IconButton
                size="small"
                sx={{
                  '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                  color: 'primary.main',
                }}
              >
                <Fullscreen />
              </IconButton>
            </PanelHeader>
            <PanelContent>
              <TradingViewChart />
            </PanelContent>
          </TradingPanel>

          {/* Order Book - Now in main area */}
          <TradingPanel
            elevation={0}
            sx={{ flex: 1.8, minHeight: { md: 210, xs: 'clamp(170px, 26dvh, 250px)' } }}
          >
            <PanelHeader>
              <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                <Receipt sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6">Order Book</Typography>
              </Box>
            </PanelHeader>
            <PanelContent>
              <OrderBook />
            </PanelContent>
          </TradingPanel>

          {/* User Orders at Bottom */}
          <TradingPanel elevation={0} sx={{ flex: 1, minHeight: { md: 130, xs: 200 } }}>
            <PanelHeader
              sx={{
                background: 'transparent',
              }}
            >
              <Tabs
                value={bottomTab}
                onChange={(_, v) => setBottomTab(v)}
                sx={{
                  '& .Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    minHeight: 40,
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    borderRadius: '4px 4px 0 0',
                    height: 3,
                  },
                  minHeight: 40,
                }}
              >
                <Tab label="Open Orders (0)" />
                <Tab label={t('app.dex.orderHistory')} />
              </Tabs>
            </PanelHeader>
            <PanelContent>
              {bottomTab === 0 ? (
                <UserOrders />
              ) : (
                <Typography>{t('app.dex.orderHistory')}</Typography>
              )}
            </PanelContent>
          </TradingPanel>
        </Box>

        {/* RIGHT - Buy/Sell & Trades Sidebar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* Buy/Sell Card with Toggle */}
          <TradingPanel elevation={0} sx={{ flex: 2.4, minHeight: { md: 300, xs: 'auto' } }}>
            <PanelHeader
              sx={{
                alignItems: 'stretch',
                background: 'transparent',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Order Type Tabs */}
              <Tabs
                value={orderFormTab}
                onChange={(_, v) => setOrderFormTab(v)}
                sx={{
                  '& .Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    minHeight: 40,
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    borderRadius: '4px 4px 0 0',
                    height: 3,
                  },
                  minHeight: 40,
                }}
              >
                <Tab label="Limit" />
                <Tab label="Market" />
              </Tabs>

              {/* Buy/Sell Toggle */}
              <ToggleButtonGroup
                value={buySellMode}
                exclusive
                onChange={(_, newMode) => {
                  if (newMode !== null) setBuySellMode(newMode);
                }}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    fontSize: '1rem',
                    py: 1.5,
                  },
                }}
              >
                <ToggleButton
                  value="buy"
                  sx={{
                    '&.Mui-selected': {
                      '&:hover': {
                        bgcolor: 'success.dark',
                      },
                      bgcolor: 'success.main',
                      // A shared 'white' on the group above used to cover
                      // this, but success.main is a bright dark-mode pastel
                      // (white ink measured ~1.77:1 there). Each button now
                      // carries its own intent's contrastText — MUI already
                      // computes it correctly (~5.3 light / ~9.1 dark, see
                      // task-2-report.md, Fix round 3).
                      color: 'success.contrastText',
                    },
                    color: 'success.main',
                  }}
                >
                  Buy
                </ToggleButton>
                <ToggleButton
                  value="sell"
                  sx={{
                    '&.Mui-selected': {
                      '&:hover': {
                        bgcolor: 'error.dark',
                      },
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                    },
                    color: 'error.main',
                  }}
                >
                  Sell
                </ToggleButton>
              </ToggleButtonGroup>
            </PanelHeader>
            <PanelContent>
              {buySellMode === 'buy' ? <BuyOrderForm /> : <SellOrderForm />}
            </PanelContent>
          </TradingPanel>

          {/* Market Trades */}
          <TradingPanel elevation={0} sx={{ flex: 1, minHeight: { md: 150, xs: 200 } }}>
            <PanelHeader
              sx={{
                background: 'transparent',
              }}
            >
              <Tabs
                value={tradesTab}
                onChange={(_, v) => setTradesTab(v)}
                sx={{
                  '& .Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    minHeight: 40,
                    padding: '8px 12px',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    borderRadius: '4px 4px 0 0',
                    height: 3,
                  },
                  minHeight: 40,
                }}
              >
                <Tab label="Market Trades" />
                <Tab label="My Trades" />
              </Tabs>
            </PanelHeader>
            <PanelContent>
              <TradeHistory />
            </PanelContent>
          </TradingPanel>
        </Box>
      </Box>
    </PageFrame>
  );
};
