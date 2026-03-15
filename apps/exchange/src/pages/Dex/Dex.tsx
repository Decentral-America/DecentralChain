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
import { styled, ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useOrderBook } from '@/api/services/matcherService';
import { BuyOrderForm } from '@/features/dex/BuyOrderForm';
import { OrderBook } from '@/features/dex/OrderBook';
import { SellOrderForm } from '@/features/dex/SellOrderForm';
import { TradeHistory } from '@/features/dex/TradeHistory';
import { TradingPairSelector } from '@/features/dex/TradingPairSelector';
// Import DEX components
import { TradingViewChart } from '@/features/dex/TradingViewChart';
import { UserOrders } from '@/features/dex/UserOrders';
import { useDexStore } from '@/stores/dexStore';
import { landingTheme } from '@/theme/landingTheme';

/**
 * Main container with clean light theme like Swap page
 */
const DEXContainer = styled(Box)(({ theme }) => ({
  background: 'transparent',
  minHeight: '100vh',
  padding: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));

/**
 * Clean white card panel like Swap page
 */
const TradingPanel = styled(Paper)(({ theme }) => ({
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  background: '#FFFFFF',
  borderRadius: theme.spacing(2),
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
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
    borderRadius: '3px',
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
})<{ trend?: 'up' | 'down' }>(({ theme, trend }) => ({
  alignItems: 'center',
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.primary,
  display: 'flex',
  fontSize: '2rem',
  fontWeight: 700,
  gap: theme.spacing(1),
}));

export const Dex = () => {
  const [orderFormTab, setOrderFormTab] = useState(0); // 0 = Limit, 1 = Market
  const [tradesTab, setTradesTab] = useState(0); // 0 = Market Trades, 1 = My Trades
  const [bottomTab, setBottomTab] = useState(0); // 0 = Open Orders, 1 = Order History
  const [buySellMode, setBuySellMode] = useState<'buy' | 'sell'>('buy'); // Buy/Sell toggle

  // Get selected pair from DEX store
  const { selectedPair, updateOrderBook, updateMarketData, marketData } = useDexStore();

  // Fetch real order book data with polling
  const { data: orderBookData } = useOrderBook(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    50,
    {
      enabled: !!selectedPair,
      refetchInterval: 5000, // Poll every 5 seconds like Angular (1000ms)
    },
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

      // Calculate market data from order book
      if (orderBookData.bids.length > 0 || orderBookData.asks.length > 0) {
        const lastPrice = orderBookData.bids[0]?.price || orderBookData.asks[0]?.price || 0;
        updateMarketData({
          currentPrice: lastPrice,
          lastPrice: lastPrice,
        });
      }
    }
  }, [orderBookData, updateOrderBook, updateMarketData]);

  // Calculate price trend
  const priceChange = marketData.priceChangePercent24h || 0;
  const priceTrend = priceChange >= 0 ? 'up' : 'down';

  // Format current price for display
  const formattedPrice = marketData.currentPrice
    ? marketData.currentPrice.toLocaleString('en-US', {
        maximumFractionDigits: 8,
        minimumFractionDigits: 2,
      })
    : '0.00';

  return (
    <ThemeProvider theme={landingTheme}>
      <DEXContainer>
        {/* Top Compact Bar - Pair Info & Stats */}
        <Box sx={{ mb: 2 }}>
          <TradingPanel elevation={0} sx={{ overflow: 'visible' }}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
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
                    xs: 6,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      Last Price
                    </Typography>
                    <PriceDisplay
                      trend={priceTrend}
                      sx={{ fontSize: { sm: '1.5rem', xs: '1.2rem' } }}
                    >
                      {formattedPrice}
                      {priceTrend === 'up' ? (
                        <TrendingUp sx={{ fontSize: '1.5rem' }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: '1.5rem' }} />
                      )}
                    </PriceDisplay>
                  </Box>
                </Grid>

                {/* 24h Change */}
                <Grid
                  size={{
                    md: 1.5,
                    xs: 6,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h Change
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={priceChange >= 0 ? 'success.main' : 'error.main'}
                    >
                      {priceChange >= 0 ? '+' : ''}
                      {priceChange.toFixed(2)}%
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
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h High
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {marketData.high24h > 0
                        ? marketData.high24h.toLocaleString('en-US', {
                            maximumFractionDigits: 8,
                            minimumFractionDigits: 2,
                          })
                        : '--'}
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
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h Low
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {marketData.low24h > 0
                        ? marketData.low24h.toLocaleString('en-US', {
                            maximumFractionDigits: 8,
                            minimumFractionDigits: 2,
                          })
                        : '--'}
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
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h Volume
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {marketData.volume24h > 0
                        ? marketData.volume24h.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })
                        : '--'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TradingPanel>
        </Box>

        {/* Main Trading Area - 2 Column Layout */}
        <Grid container spacing={2}>
          {/* LEFT - Chart takes 70% width for prominence */}
          <Grid
            size={{
              lg: 8.5,
              xs: 12,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              {/* Large Chart Section */}
              <TradingPanel
                elevation={0}
                sx={{ flex: 1, minHeight: { md: 550, sm: 400, xs: 300 } }}
              >
                <PanelHeader>
                  <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                    <ShowChart sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h6" fontWeight={700}>
                      Price Chart
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{
                      '&:hover': { bgcolor: 'primary.light', color: 'white' },
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
              <TradingPanel elevation={0} sx={{ minHeight: { md: 400, xs: 250 } }}>
                <PanelHeader>
                  <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                    <Receipt sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Typography variant="h6" fontWeight={700}>
                      Order Book
                    </Typography>
                  </Box>
                </PanelHeader>
                <PanelContent sx={{ maxHeight: 400 }}>
                  <OrderBook />
                </PanelContent>
              </TradingPanel>

              {/* User Orders at Bottom */}
              <TradingPanel elevation={0}>
                <PanelHeader
                  sx={{
                    background:
                      'linear-gradient(90deg, rgba(61, 38, 190, 0.03) 0%, rgba(89, 64, 212, 0.03) 100%)',
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
                        fontWeight: 600,
                        minHeight: 40,
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        borderRadius: '3px 3px 0 0',
                        height: 3,
                      },
                      minHeight: 40,
                    }}
                  >
                    <Tab label="Open Orders (0)" />
                    <Tab label="Order History" />
                  </Tabs>
                </PanelHeader>
                <PanelContent sx={{ maxHeight: 300 }}>
                  {bottomTab === 0 ? <UserOrders /> : <Typography>Order History</Typography>}
                </PanelContent>
              </TradingPanel>
            </Box>
          </Grid>

          {/* RIGHT - Buy/Sell & Trades Sidebar */}
          <Grid
            size={{
              lg: 3.5,
              xs: 12,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Buy/Sell Card with Toggle */}
              <TradingPanel elevation={0} sx={{ minHeight: { md: 560, xs: 'auto' } }}>
                <PanelHeader
                  sx={{
                    alignItems: 'stretch',
                    background:
                      'linear-gradient(90deg, rgba(61, 38, 190, 0.05) 0%, rgba(89, 64, 212, 0.05) 100%)',
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
                        fontWeight: 600,
                        minHeight: 40,
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        borderRadius: '3px 3px 0 0',
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
                        '&.Mui-selected': {
                          color: 'white',
                        },
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: 700,
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
                        },
                        color: 'error.main',
                      }}
                    >
                      Sell
                    </ToggleButton>
                  </ToggleButtonGroup>
                </PanelHeader>
                <PanelContent sx={{ minHeight: { md: 500, xs: 'auto' } }}>
                  {buySellMode === 'buy' ? <BuyOrderForm /> : <SellOrderForm />}
                </PanelContent>
              </TradingPanel>

              {/* Market Trades */}
              <TradingPanel elevation={0}>
                <PanelHeader
                  sx={{
                    background:
                      'linear-gradient(90deg, rgba(61, 38, 190, 0.03) 0%, rgba(89, 64, 212, 0.03) 100%)',
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
                        fontWeight: 600,
                        minHeight: 40,
                        padding: '8px 12px',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        borderRadius: '3px 3px 0 0',
                        height: 3,
                      },
                      minHeight: 40,
                    }}
                  >
                    <Tab label="Market Trades" />
                    <Tab label="My Trades" />
                  </Tabs>
                </PanelHeader>
                <PanelContent sx={{ maxHeight: 450 }}>
                  <TradeHistory />
                </PanelContent>
              </TradingPanel>
            </Box>
          </Grid>
        </Grid>
      </DEXContainer>
    </ThemeProvider>
  );
};
