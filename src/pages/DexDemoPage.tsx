import React, { useState, useEffect } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Alert,
  List,
  ListItem,
  Skeleton,
  Tooltip,
  Fade,
  Slide,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  ShowChart as ShowChartIcon,
  SwapHoriz as SwapHorizIcon,
  AccountBalanceWallet as WalletIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Types
interface OrderBook {
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
}

interface Trade {
  price: number;
  amount: number;
  time: string;
  type: 'buy' | 'sell';
}

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const priceFlash = keyframes`
  0% { background-color: rgba(31, 90, 246, 0.2); }
  100% { background-color: transparent; }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #0f1419 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
}));

const DemoBanner = styled(Alert)(({ theme }) => ({
  borderRadius: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  fontWeight: 600,
  '& .MuiAlert-icon': {
    animation: `${pulse} 2s ease-in-out infinite`,
  },
}));

const ContentWrapper = styled(Box)({
  maxWidth: '1600px',
  margin: '0 auto',
  padding: '24px',
});

const TradingGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('lg')]: {
    flexDirection: 'column-reverse',
  },
}));

const PairHeader = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
}));

const PriceDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

const LivePrice = styled(Typography)<{ trend?: 'up' | 'down' }>(({ theme, trend }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  fontFamily: '"Courier New", monospace',
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.primary,
  animation: `${priceFlash} 0.5s ease`,
}));

const TrendChip = styled(Chip)<{ trend?: 'up' | 'down' }>(({ theme, trend }) => ({
  fontWeight: 600,
  background:
    trend === 'up'
      ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
      : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
  color: 'white',
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const StatCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.6)' : 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
}));

const ChartPlaceholder = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  height: 400,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: theme.spacing(3),
}));

const OrderBookCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  height: '100%',
}));

const OrderBookHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  padding: theme.spacing(1.5),
  fontWeight: 600,
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(1),
}));

const OrderRow = styled(ListItem)<{ ordertype?: 'buy' | 'sell' }>(({ theme, ordertype }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  padding: theme.spacing(1, 1.5),
  fontFamily: '"Courier New", monospace',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  borderRadius: theme.spacing(1),
  '&:hover': {
    background: ordertype === 'buy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
  },
}));

const PriceCell = styled(Typography)<{ ordertype?: 'buy' | 'sell' }>(({ theme, ordertype }) => ({
  fontWeight: 600,
  fontFamily: '"Courier New", monospace',
  color: ordertype === 'buy' ? theme.palette.success.main : theme.palette.error.main,
}));

const TradeFormCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  position: 'sticky',
  top: 24,
}));

const SignInPrompt = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.1)' : 'rgba(31, 90, 246, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  textAlign: 'center',
}));

// Mock data generators
const generateMockOrderBook = (type: 'buy' | 'sell'): OrderBook[] => {
  const basePrice = 1.5;
  const orders: OrderBook[] = [];

  for (let i = 0; i < 12; i++) {
    const priceOffset = (Math.random() * 0.1 + i * 0.01) * (type === 'sell' ? 1 : -1);
    const price = basePrice + priceOffset;
    const amount = Math.random() * 100 + 10;
    orders.push({
      price: parseFloat(price.toFixed(8)),
      amount: parseFloat(amount.toFixed(2)),
      total: parseFloat((price * amount).toFixed(2)),
      type,
    });
  }

  return orders.sort((a, b) => (type === 'buy' ? b.price - a.price : a.price - b.price));
};

const generateMockTrades = (): Trade[] => {
  const trades: Trade[] = [];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const time = new Date(now.getTime() - i * 60000);
    trades.push({
      price: parseFloat((1.5 + (Math.random() - 0.5) * 0.1).toFixed(8)),
      amount: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      time: time.toLocaleTimeString(),
      type: Math.random() > 0.5 ? 'buy' : 'sell',
    });
  }

  return trades;
};

export const DexDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetId1 = searchParams.get('assetId1') || 'DCC';
  const assetId2 = searchParams.get('assetId2') || 'USDT';

  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [price, setPrice] = useState('1.50');
  const [amount, setAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(1.5);
  const [priceTrend, setPriceTrend] = useState<'up' | 'down'>('up');
  const [buyOrders, setBuyOrders] = useState<OrderBook[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderBook[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  useEffect(() => {
    setIsVisible(true);
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      setBuyOrders(generateMockOrderBook('buy'));
      setSellOrders(generateMockOrderBook('sell'));
      setRecentTrades(generateMockTrades());
    }, 1000);

    // Simulate live price updates
    const priceInterval = setInterval(() => {
      setCurrentPrice((prevPrice) => {
        const change = (Math.random() - 0.5) * 0.02;
        const newPrice = prevPrice + change;
        setPriceTrend(change > 0 ? 'up' : 'down');
        return parseFloat(newPrice.toFixed(8));
      });
    }, 3000);

    return () => clearInterval(priceInterval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePlaceOrder = () => {
    if (!price || !amount) {
      setSnackbar({ open: true, message: 'Please enter both price and amount', severity: 'error' });
      return;
    }
    setSnackbar({
      open: true,
      message: `Demo ${activeTab === 0 ? 'Buy' : 'Sell'} order simulated: ${amount} ${assetId1} at ${price} ${assetId2}`,
      severity: 'info',
    });
  };

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : '0.00';
  const priceChange = (((currentPrice - 1.5) / 1.5) * 100).toFixed(2);

  return (
    <PageContainer>
      {/* Demo Warning Banner */}
      <DemoBanner severity="warning" icon={<WarningIcon />}>
        DEMO MODE - Simulated Trading Environment - No Real Funds Used
      </DemoBanner>

      <ContentWrapper>
        <Fade in={isVisible} timeout={600}>
          <Box>
            {/* Pair Header */}
            <PairHeader elevation={0}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {assetId1} / {assetId2}
                  </Typography>
                  <PriceDisplay>
                    {loading ? (
                      <Skeleton variant="text" width={200} height={60} />
                    ) : (
                      <>
                        <LivePrice trend={priceTrend}>{currentPrice.toFixed(8)}</LivePrice>
                        <TrendChip
                          trend={priceTrend}
                          icon={priceTrend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          label={`${priceTrend === 'up' ? '+' : ''}${priceChange}%`}
                          size="medium"
                        />
                      </>
                    )}
                  </PriceDisplay>
                </Grid>
                <Grid item xs={12} md={6} textAlign={{ xs: 'left', md: 'right' }}>
                  <Button
                    variant="outlined"
                    startIcon={<SwapHorizIcon />}
                    onClick={() => navigate('/dex')}
                    size="large"
                  >
                    Change Pair
                  </Button>
                </Grid>
              </Grid>

              {/* Market Stats */}
              <StatsGrid container spacing={2}>
                {loading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Grid item xs={6} sm={3} key={i}>
                        <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 1.5 }} />
                      </Grid>
                    ))}
                  </>
                ) : (
                  <>
                    <Grid item xs={6} sm={3}>
                      <StatCard elevation={0}>
                        <Typography variant="caption" color="text.secondary">
                          24h Volume
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {(Math.random() * 1000000).toFixed(0)} {assetId2}
                        </Typography>
                      </StatCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <StatCard elevation={0}>
                        <Typography variant="caption" color="text.secondary">
                          24h Change
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          color={priceTrend === 'up' ? 'success.main' : 'error.main'}
                        >
                          {priceChange}%
                        </Typography>
                      </StatCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <StatCard elevation={0}>
                        <Typography variant="caption" color="text.secondary">
                          24h High
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          fontFamily="'Courier New', monospace"
                        >
                          {(currentPrice * 1.05).toFixed(4)}
                        </Typography>
                      </StatCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <StatCard elevation={0}>
                        <Typography variant="caption" color="text.secondary">
                          24h Low
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          fontFamily="'Courier New', monospace"
                        >
                          {(currentPrice * 0.95).toFixed(4)}
                        </Typography>
                      </StatCard>
                    </Grid>
                  </>
                )}
              </StatsGrid>
            </PairHeader>

            {/* Main Trading Interface */}
            <TradingGrid container spacing={3}>
              {/* Left Panel - Chart and Order Books */}
              <Grid item xs={12} lg={9}>
                {/* Chart Placeholder */}
                <ChartPlaceholder elevation={0}>
                  {loading ? (
                    <Skeleton variant="rectangular" width="100%" height="100%" />
                  ) : (
                    <Box textAlign="center">
                      <ShowChartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Price Chart Placeholder
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        TradingView or custom chart would be integrated here
                      </Typography>
                    </Box>
                  )}
                </ChartPlaceholder>

                {/* Order Books Grid */}
                <Grid container spacing={3}>
                  {/* Buy Orders */}
                  <Grid item xs={12} md={4}>
                    <OrderBookCard elevation={0}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{ color: 'success.main' }}
                      >
                        Buy Orders
                      </Typography>
                      <OrderBookHeader>
                        <Typography variant="caption">Price</Typography>
                        <Typography variant="caption" textAlign="right">
                          Amount
                        </Typography>
                        <Typography variant="caption" textAlign="right">
                          Total
                        </Typography>
                      </OrderBookHeader>
                      <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {loading ? (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <Skeleton
                                key={i}
                                variant="rectangular"
                                height={32}
                                sx={{ mb: 0.5, borderRadius: 1 }}
                              />
                            ))}
                          </>
                        ) : (
                          buyOrders.map((order, index) => (
                            <OrderRow key={index} ordertype="buy" disablePadding>
                              <PriceCell ordertype="buy" variant="body2">
                                {order.price.toFixed(8)}
                              </PriceCell>
                              <Typography variant="body2" textAlign="right" color="text.secondary">
                                {order.amount.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" textAlign="right" color="text.secondary">
                                {order.total.toFixed(2)}
                              </Typography>
                            </OrderRow>
                          ))
                        )}
                      </List>
                    </OrderBookCard>
                  </Grid>

                  {/* Recent Trades */}
                  <Grid item xs={12} md={4}>
                    <OrderBookCard elevation={0}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Recent Trades
                      </Typography>
                      <OrderBookHeader>
                        <Typography variant="caption">Price</Typography>
                        <Typography variant="caption" textAlign="right">
                          Amount
                        </Typography>
                        <Typography variant="caption" textAlign="right">
                          Time
                        </Typography>
                      </OrderBookHeader>
                      <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {loading ? (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <Skeleton
                                key={i}
                                variant="rectangular"
                                height={32}
                                sx={{ mb: 0.5, borderRadius: 1 }}
                              />
                            ))}
                          </>
                        ) : (
                          recentTrades.map((trade, index) => (
                            <OrderRow key={index} ordertype={trade.type} disablePadding>
                              <PriceCell ordertype={trade.type} variant="body2">
                                {trade.price.toFixed(8)}
                              </PriceCell>
                              <Typography variant="body2" textAlign="right" color="text.secondary">
                                {trade.amount.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" textAlign="right" color="text.secondary">
                                {trade.time}
                              </Typography>
                            </OrderRow>
                          ))
                        )}
                      </List>
                    </OrderBookCard>
                  </Grid>

                  {/* Sell Orders */}
                  <Grid item xs={12} md={4}>
                    <OrderBookCard elevation={0}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{ color: 'error.main' }}
                      >
                        Sell Orders
                      </Typography>
                      <OrderBookHeader>
                        <Typography variant="caption">Price</Typography>
                        <Typography variant="caption" textAlign="right">
                          Amount
                        </Typography>
                        <Typography variant="caption" textAlign="right">
                          Total
                        </Typography>
                      </OrderBookHeader>
                      <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {loading ? (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <Skeleton
                                key={i}
                                variant="rectangular"
                                height={32}
                                sx={{ mb: 0.5, borderRadius: 1 }}
                              />
                            ))}
                          </>
                        ) : (
                          sellOrders.map((order, index) => (
                            <OrderRow key={index} ordertype="sell" disablePadding>
                              <PriceCell ordertype="sell" variant="body2">
                                {order.price.toFixed(8)}
                              </PriceCell>
                              <Typography variant="body2" textAlign="right" color="text.secondary">
                                {order.amount.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" textAlign="right" color="text.secondary">
                                {order.total.toFixed(2)}
                              </Typography>
                            </OrderRow>
                          ))
                        )}
                      </List>
                    </OrderBookCard>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Panel - Trade Form */}
              <Grid item xs={12} lg={3}>
                <Slide direction="left" in={isVisible} timeout={800}>
                  <Box>
                    <TradeFormCard elevation={0}>
                      <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                          marginBottom: 3,
                          '& .MuiTab-root': {
                            fontWeight: 600,
                            fontSize: '1rem',
                          },
                          '& .Mui-selected': {
                            color: activeTab === 0 ? 'success.main' : 'error.main',
                          },
                          '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '3px 3px 0 0',
                            background:
                              activeTab === 0
                                ? 'linear-gradient(135deg, #10b981, #34d399)'
                                : 'linear-gradient(135deg, #ef4444, #f87171)',
                          },
                        }}
                      >
                        <Tab label="Buy" />
                        <Tab label="Sell" />
                      </Tabs>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Price ({assetId2})
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00000000"
                          InputProps={{
                            sx: { fontFamily: '"Courier New", monospace' },
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Amount ({assetId1})
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          InputProps={{
                            sx: { fontFamily: '"Courier New", monospace' },
                            endAdornment: (
                              <InputAdornment position="end">
                                <WalletIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Total ({assetId2})
                        </Typography>
                        <TextField
                          fullWidth
                          value={total}
                          disabled
                          InputProps={{
                            sx: { fontFamily: '"Courier New", monospace', fontWeight: 600 },
                          }}
                        />
                      </Box>

                      <Tooltip title="This is a demo - orders are simulated">
                        <span>
                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handlePlaceOrder}
                            sx={{
                              background:
                                activeTab === 0
                                  ? 'linear-gradient(135deg, #10b981, #34d399)'
                                  : 'linear-gradient(135deg, #ef4444, #f87171)',
                              fontWeight: 600,
                              fontSize: '1rem',
                              py: 1.5,
                              '&:hover': {
                                background:
                                  activeTab === 0
                                    ? 'linear-gradient(135deg, #059669, #10b981)'
                                    : 'linear-gradient(135deg, #dc2626, #ef4444)',
                              },
                            }}
                          >
                            {activeTab === 0 ? 'Place Buy Order' : 'Place Sell Order'} (Demo)
                          </Button>
                        </span>
                      </Tooltip>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 2, textAlign: 'center' }}
                      >
                        Available Balance: 0.00 {assetId1}
                      </Typography>
                    </TradeFormCard>

                    {/* Sign In Prompt */}
                    <SignInPrompt elevation={0}>
                      <Typography variant="body2" gutterBottom>
                        This is a demo environment.
                      </Typography>
                      <Box
                        sx={{
                          mt: 2,
                          display: 'flex',
                          gap: 2,
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate('/auth/signin')}
                        >
                          Sign In
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate('/auth/signup')}
                        >
                          Create Account
                        </Button>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 2 }}
                      >
                        Sign in to trade with real funds
                      </Typography>
                    </SignInPrompt>
                  </Box>
                </Slide>
              </Grid>
            </TradingGrid>
          </Box>
        </Fade>
      </ContentWrapper>

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};
