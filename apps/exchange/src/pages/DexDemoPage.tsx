import {
  Close as CloseIcon,
  ShowChart as ShowChartIcon,
  SwapHoriz as SwapHorizIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Paper,
  Skeleton,
  Slide,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #0f1419 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
  minHeight: '100vh',
}));

const DemoBanner = styled(Alert)(({ theme: _theme }) => ({
  '& .MuiAlert-icon': {
    animation: `${pulse} 2s ease-in-out infinite`,
  },
  alignItems: 'center',
  borderRadius: 0,
  display: 'flex',
  fontSize: '1rem',
  fontWeight: 600,
  justifyContent: 'center',
}));

const ContentWrapper = styled(Box)({
  margin: '0 auto',
  maxWidth: '1600px',
  padding: '24px',
});

const TradingGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('lg')]: {
    flexDirection: 'column-reverse',
  },
}));

const PairHeader = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
}));

const PriceDisplay = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

const LivePrice = styled(Typography)<{ trend?: 'up' | 'down' }>(({ theme, trend }) => ({
  animation: `${priceFlash} 0.5s ease`,
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.primary,
  fontFamily: '"Courier New", monospace',
  fontSize: '2rem',
  fontWeight: 700,
}));

const TrendChip = styled(Chip)<{ trend?: 'up' | 'down' }>(({ theme, trend }) => ({
  background:
    trend === 'up'
      ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
      : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
  color: 'white',
  fontWeight: 600,
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const StatCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.6)' : 'rgba(255, 255, 255, 0.6)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2),
}));

const ChartPlaceholder = styled(Paper)(({ theme }) => ({
  alignItems: 'center',
  backdropFilter: 'blur(24px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(2),
  display: 'flex',
  height: 400,
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(4),
}));

const OrderBookCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(24px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(2),
  height: '100%',
  padding: theme.spacing(3),
}));

const OrderBookHeader = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  display: 'grid',
  fontSize: '0.875rem',
  fontWeight: 600,
  gridTemplateColumns: '1fr 1fr 1fr',
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5),
}));

const OrderRow = styled(ListItem)<{ ordertype?: 'buy' | 'sell' }>(({ theme, ordertype }) => ({
  '&:hover': {
    background: ordertype === 'buy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
  },
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  display: 'grid',
  fontFamily: '"Courier New", monospace',
  fontSize: '0.875rem',
  gridTemplateColumns: '1fr 1fr 1fr',
  padding: theme.spacing(1, 1.5),
  transition: 'background 0.2s ease',
}));

const PriceCell = styled(Typography)<{ ordertype?: 'buy' | 'sell' }>(({ theme, ordertype }) => ({
  color: ordertype === 'buy' ? theme.palette.success.main : theme.palette.error.main,
  fontFamily: '"Courier New", monospace',
  fontWeight: 600,
}));

const TradeFormCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(24px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  position: 'sticky',
  top: 24,
}));

const SignInPrompt = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  background: theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.1)' : 'rgba(31, 90, 246, 0.05)',
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(3),
  padding: theme.spacing(3),
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
      amount: parseFloat(amount.toFixed(2)),
      price: parseFloat(price.toFixed(8)),
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
      amount: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      price: parseFloat((1.5 + (Math.random() - 0.5) * 0.1).toFixed(8)),
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
    message: '',
    open: false,
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePlaceOrder = () => {
    if (!price || !amount) {
      setSnackbar({ message: 'Please enter both price and amount', open: true, severity: 'error' });
      return;
    }
    setSnackbar({
      message: `Demo ${activeTab === 0 ? 'Buy' : 'Sell'} order simulated: ${amount} ${assetId1} at ${price} ${assetId2}`,
      open: true,
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
                <Grid
                  size={{
                    md: 6,
                    xs: 12,
                  }}
                >
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
                <Grid
                  textAlign={{ md: 'right', xs: 'left' }}
                  size={{
                    md: 6,
                    xs: 12,
                  }}
                >
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
                  [1, 2, 3, 4].map((i) => (
                    <Grid
                      key={i}
                      size={{
                        sm: 3,
                        xs: 6,
                      }}
                    >
                      <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 1.5 }} />
                    </Grid>
                  ))
                ) : (
                  <>
                    <Grid
                      size={{
                        sm: 3,
                        xs: 6,
                      }}
                    >
                      <StatCard elevation={0}>
                        <Typography variant="caption" color="text.secondary">
                          24h Volume
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {(Math.random() * 1000000).toFixed(0)} {assetId2}
                        </Typography>
                      </StatCard>
                    </Grid>
                    <Grid
                      size={{
                        sm: 3,
                        xs: 6,
                      }}
                    >
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
                    <Grid
                      size={{
                        sm: 3,
                        xs: 6,
                      }}
                    >
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
                    <Grid
                      size={{
                        sm: 3,
                        xs: 6,
                      }}
                    >
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
              <Grid
                size={{
                  lg: 9,
                  xs: 12,
                }}
              >
                {/* Chart Placeholder */}
                <ChartPlaceholder elevation={0}>
                  {loading ? (
                    <Skeleton variant="rectangular" width="100%" height="100%" />
                  ) : (
                    <Box textAlign="center">
                      <ShowChartIcon sx={{ color: 'text.secondary', fontSize: 80, mb: 2 }} />
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
                  <Grid
                    size={{
                      md: 4,
                      xs: 12,
                    }}
                  >
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
                        {loading
                          ? Array.from({ length: 8 }, (_, i) => `buy-skel-${i}`).map((key) => (
                              <Skeleton
                                key={key}
                                variant="rectangular"
                                height={32}
                                sx={{ borderRadius: 1, mb: 0.5 }}
                              />
                            ))
                          : buyOrders.map((order) => (
                              <OrderRow key={String(order.price)} ordertype="buy" disablePadding>
                                <PriceCell ordertype="buy" variant="body2">
                                  {order.price.toFixed(8)}
                                </PriceCell>
                                <Typography
                                  variant="body2"
                                  textAlign="right"
                                  color="text.secondary"
                                >
                                  {order.amount.toFixed(2)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  textAlign="right"
                                  color="text.secondary"
                                >
                                  {order.total.toFixed(2)}
                                </Typography>
                              </OrderRow>
                            ))}
                      </List>
                    </OrderBookCard>
                  </Grid>

                  {/* Recent Trades */}
                  <Grid
                    size={{
                      md: 4,
                      xs: 12,
                    }}
                  >
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
                        {loading
                          ? Array.from({ length: 8 }, (_, i) => `trade-skel-${i}`).map((key) => (
                              <Skeleton
                                key={key}
                                variant="rectangular"
                                height={32}
                                sx={{ borderRadius: 1, mb: 0.5 }}
                              />
                            ))
                          : recentTrades.map((trade) => (
                              <OrderRow key={trade.time} ordertype={trade.type} disablePadding>
                                <PriceCell ordertype={trade.type} variant="body2">
                                  {trade.price.toFixed(8)}
                                </PriceCell>
                                <Typography
                                  variant="body2"
                                  textAlign="right"
                                  color="text.secondary"
                                >
                                  {trade.amount.toFixed(2)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  textAlign="right"
                                  color="text.secondary"
                                >
                                  {trade.time}
                                </Typography>
                              </OrderRow>
                            ))}
                      </List>
                    </OrderBookCard>
                  </Grid>

                  {/* Sell Orders */}
                  <Grid
                    size={{
                      md: 4,
                      xs: 12,
                    }}
                  >
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
                        {loading
                          ? Array.from({ length: 8 }, (_, i) => `sell-skel-${i}`).map((key) => (
                              <Skeleton
                                key={key}
                                variant="rectangular"
                                height={32}
                                sx={{ borderRadius: 1, mb: 0.5 }}
                              />
                            ))
                          : sellOrders.map((order) => (
                              <OrderRow key={String(order.price)} ordertype="sell" disablePadding>
                                <PriceCell ordertype="sell" variant="body2">
                                  {order.price.toFixed(8)}
                                </PriceCell>
                                <Typography
                                  variant="body2"
                                  textAlign="right"
                                  color="text.secondary"
                                >
                                  {order.amount.toFixed(2)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  textAlign="right"
                                  color="text.secondary"
                                >
                                  {order.total.toFixed(2)}
                                </Typography>
                              </OrderRow>
                            ))}
                      </List>
                    </OrderBookCard>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Panel - Trade Form */}
              <Grid
                size={{
                  lg: 3,
                  xs: 12,
                }}
              >
                <Slide direction="left" in={isVisible} timeout={800}>
                  <Box>
                    <TradeFormCard elevation={0}>
                      <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                          '& .Mui-selected': {
                            color: activeTab === 0 ? 'success.main' : 'error.main',
                          },
                          '& .MuiTab-root': {
                            fontSize: '1rem',
                            fontWeight: 600,
                          },
                          '& .MuiTabs-indicator': {
                            background:
                              activeTab === 0
                                ? 'linear-gradient(135deg, #10b981, #34d399)'
                                : 'linear-gradient(135deg, #ef4444, #f87171)',
                            borderRadius: '3px 3px 0 0',
                            height: 3,
                          },
                          marginBottom: 3,
                        }}
                      >
                        <Tab label="Buy" />
                        <Tab label="Sell" />
                      </Tabs>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 1 }}
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
                          sx={{ display: 'block', mb: 1 }}
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
                            endAdornment: (
                              <InputAdornment position="end">
                                <WalletIcon fontSize="small" />
                              </InputAdornment>
                            ),
                            sx: { fontFamily: '"Courier New", monospace' },
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 1 }}
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
                              '&:hover': {
                                background:
                                  activeTab === 0
                                    ? 'linear-gradient(135deg, #059669, #10b981)'
                                    : 'linear-gradient(135deg, #dc2626, #ef4444)',
                              },
                              background:
                                activeTab === 0
                                  ? 'linear-gradient(135deg, #10b981, #34d399)'
                                  : 'linear-gradient(135deg, #ef4444, #f87171)',
                              fontSize: '1rem',
                              fontWeight: 600,
                              py: 1.5,
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
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2,
                          justifyContent: 'center',
                          mt: 2,
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
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
