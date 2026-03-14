/**
 * DEX Page
 * Modern crypto trading interface with advanced features
 * 3-column layout: OrderBook | Chart+Forms | Markets+Trades
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import { landingTheme } from '@/theme/landingTheme';
import { ShowChart, TrendingUp, TrendingDown, Fullscreen, Receipt } from '@mui/icons-material';

// Import DEX components
import { TradingViewChart } from '@/features/dex/TradingViewChart';
import { OrderBook } from '@/features/dex/OrderBook';
import { TradeHistory } from '@/features/dex/TradeHistory';
import { BuyOrderForm } from '@/features/dex/BuyOrderForm';
import { SellOrderForm } from '@/features/dex/SellOrderForm';
import { TradingPairSelector } from '@/features/dex/TradingPairSelector';
import { UserOrders } from '@/features/dex/UserOrders';
import { useDexStore } from '@/stores/dexStore';
import { useOrderBook } from '@/api/services/matcherService';

/**
 * Main container with clean light theme like Swap page
 */
const DEXContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'transparent',
  padding: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));

/**
 * Clean white card panel like Swap page
 */
const TradingPanel = styled(Paper)(({ theme }) => ({
  background: '#FFFFFF',
  borderRadius: theme.spacing(2),
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
}));

/**
 * Panel header with clean styling
 */
const PanelHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

/**
 * Panel content area
 */
const PanelContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[300],
    borderRadius: '3px',
    '&:hover': {
      background: theme.palette.grey[400],
    },
  },
}));

/**
 * Price display with trend
 */
const PriceDisplay = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'trend',
})<{ trend?: 'up' | 'down' }>(({ theme, trend }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
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
    }
  );

  // Update store when order book data changes
  useEffect(() => {
    if (orderBookData) {
      // Transform API data to store format
      const transformedOrderBook = {
        bids: orderBookData.bids.map((bid, idx) => ({
          id: `bid-${idx}`,
          type: 'buy' as const,
          price: bid.price.toString(),
          amount: bid.amount.toString(),
          timestamp: orderBookData.timestamp,
        })),
        asks: orderBookData.asks.map((ask, idx) => ({
          id: `ask-${idx}`,
          type: 'sell' as const,
          price: ask.price.toString(),
          amount: ask.amount.toString(),
          timestamp: orderBookData.timestamp,
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
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
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
                <Grid item xs={12} md={2.5} sx={{ overflow: 'visible', zIndex: 1000 }}>
                  <TradingPairSelector />
                </Grid>

                {/* Price Display */}
                <Grid item xs={6} md={2}>
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      Last Price
                    </Typography>
                    <PriceDisplay trend={priceTrend} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
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
                <Grid item xs={6} md={1.5}>
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
                <Grid item xs={4} md={2} sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h High
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {marketData.high24h > 0
                        ? marketData.high24h.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })
                        : '--'}
                    </Typography>
                  </Box>
                </Grid>

                {/* 24h Low - hidden on xs */}
                <Grid item xs={4} md={2} sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h Low
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {marketData.low24h > 0
                        ? marketData.low24h.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })
                        : '--'}
                    </Typography>
                  </Box>
                </Grid>

                {/* 24h Volume */}
                <Grid item xs={12} sm={4} md={2}>
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      24h Volume
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {marketData.volume24h > 0
                        ? marketData.volume24h.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
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
          <Grid item xs={12} lg={8.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              {/* Large Chart Section */}
              <TradingPanel elevation={0} sx={{ flex: 1, minHeight: { xs: 300, sm: 400, md: 550 } }}>
                <PanelHeader>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChart sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h6" fontWeight={700}>
                      Price Chart
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'primary.light', color: 'white' },
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
              <TradingPanel elevation={0} sx={{ minHeight: { xs: 250, md: 400 } }}>
                <PanelHeader>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      minHeight: 40,
                      '& .MuiTab-root': {
                        minHeight: 40,
                        fontWeight: 600,
                        color: 'text.secondary',
                      },
                      '& .Mui-selected': {
                        color: 'primary.main',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                      },
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
          <Grid item xs={12} lg={3.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Buy/Sell Card with Toggle */}
              <TradingPanel elevation={0} sx={{ minHeight: { xs: 'auto', md: 560 } }}>
                <PanelHeader
                  sx={{
                    background:
                      'linear-gradient(90deg, rgba(61, 38, 190, 0.05) 0%, rgba(89, 64, 212, 0.05) 100%)',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 2,
                  }}
                >
                  {/* Order Type Tabs */}
                  <Tabs
                    value={orderFormTab}
                    onChange={(_, v) => setOrderFormTab(v)}
                    sx={{
                      minHeight: 40,
                      '& .MuiTab-root': {
                        minHeight: 40,
                        fontWeight: 600,
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                      },
                      '& .Mui-selected': {
                        color: 'primary.main',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                      },
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
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: '1rem',
                        border: 'none',
                        '&.Mui-selected': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ToggleButton
                      value="buy"
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'success.main',
                          '&:hover': {
                            bgcolor: 'success.dark',
                          },
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
                          bgcolor: 'error.main',
                          '&:hover': {
                            bgcolor: 'error.dark',
                          },
                        },
                        color: 'error.main',
                      }}
                    >
                      Sell
                    </ToggleButton>
                  </ToggleButtonGroup>
                </PanelHeader>
                <PanelContent sx={{ minHeight: { xs: 'auto', md: 500 } }}>
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
                      minHeight: 40,
                      '& .MuiTab-root': {
                        minHeight: 40,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        padding: '8px 12px',
                        color: 'text.secondary',
                      },
                      '& .Mui-selected': {
                        color: 'primary.main',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                      },
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
