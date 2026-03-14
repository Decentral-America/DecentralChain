import { Box, Container, Card, CardContent, Typography, Stack } from '@mui/material';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { SvgIcon, SvgIconProps } from '@mui/material';

// Ethereum icon component
const EthereumIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
  </SvgIcon>
);

// Generic crypto icon for others
const CryptoIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
  </SvgIcon>
);

// Mini sparkline chart component
const MiniChart = ({ data, positive }: { data: number[]; positive: boolean }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const height = 40;
  const width = 100;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#10B981' : '#EF4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const coins = [
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
    icon: CurrencyBitcoinIcon,
    price: '$43,527.82',
    change: '+2.45%',
    positive: true,
    chartData: [38, 42, 40, 45, 43, 47, 44, 48, 46, 50, 48, 52],
  },
  {
    ticker: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    icon: EthereumIcon,
    price: '$2,284.56',
    change: '+1.28%',
    positive: true,
    chartData: [32, 35, 33, 38, 36, 40, 38, 42, 40, 44, 42, 45],
  },
  {
    ticker: 'USDT',
    name: 'Tether',
    color: '#26A17B',
    icon: CryptoIcon,
    price: '$1.00',
    change: '-0.02%',
    positive: false,
    chartData: [50, 49, 50, 49, 50, 49, 50, 49, 50, 49, 50, 49],
  },
  {
    ticker: 'BNB',
    name: 'Binance',
    color: '#F3BA2F',
    icon: CryptoIcon,
    price: '$312.89',
    change: '+3.12%',
    positive: true,
    chartData: [30, 32, 34, 33, 36, 38, 37, 40, 42, 41, 44, 46],
  },
  {
    ticker: 'SOL',
    name: 'Solana',
    color: '#9945FF',
    icon: CryptoIcon,
    price: '$98.32',
    change: '+5.67%',
    positive: true,
    chartData: [25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52],
  },
  {
    ticker: 'ADA',
    name: 'Cardano',
    color: '#0033AD',
    icon: CryptoIcon,
    price: '$0.58',
    change: '+0.89%',
    positive: true,
    chartData: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
  },
  {
    ticker: 'DOT',
    name: 'Polkadot',
    color: '#E6007A',
    icon: CryptoIcon,
    price: '$7.23',
    change: '-1.23%',
    positive: false,
    chartData: [48, 46, 44, 45, 43, 41, 42, 40, 38, 39, 37, 35],
  },
  {
    ticker: 'AVAX',
    name: 'Avalanche',
    color: '#E84142',
    icon: CryptoIcon,
    price: '$36.54',
    change: '+2.34%',
    positive: true,
    chartData: [28, 30, 32, 35, 33, 37, 39, 41, 40, 43, 45, 48],
  },
  {
    ticker: 'MATIC',
    name: 'Polygon',
    color: '#8247E5',
    icon: CryptoIcon,
    price: '$0.92',
    change: '+4.56%',
    positive: true,
    chartData: [22, 25, 27, 30, 32, 35, 38, 40, 42, 45, 47, 50],
  },
  {
    ticker: 'LINK',
    name: 'Chainlink',
    color: '#2A5ADA',
    icon: CryptoIcon,
    price: '$14.78',
    change: '+1.92%',
    positive: true,
    chartData: [30, 32, 31, 34, 36, 38, 37, 40, 42, 44, 43, 46],
  },
  {
    ticker: 'UNI',
    name: 'Uniswap',
    color: '#FF007A',
    icon: CryptoIcon,
    price: '$6.45',
    change: '-0.78%',
    positive: false,
    chartData: [45, 44, 42, 43, 41, 39, 40, 38, 37, 36, 35, 34],
  },
  {
    ticker: 'XRP',
    name: 'Ripple',
    color: '#23292F',
    icon: CryptoIcon,
    price: '$0.54',
    change: '+3.45%',
    positive: true,
    chartData: [25, 28, 27, 30, 33, 35, 37, 39, 41, 43, 45, 48],
  },
  {
    ticker: 'ATOM',
    name: 'Cosmos',
    color: '#2E3148',
    icon: CryptoIcon,
    price: '$9.87',
    change: '+2.11%',
    positive: true,
    chartData: [27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49],
  },
  {
    ticker: 'LTC',
    name: 'Litecoin',
    color: '#345D9D',
    icon: CryptoIcon,
    price: '$72.34',
    change: '+1.56%',
    positive: true,
    chartData: [33, 35, 37, 36, 39, 41, 40, 43, 45, 44, 47, 49],
  },
  {
    ticker: 'ALGO',
    name: 'Algorand',
    color: '#000000',
    icon: CryptoIcon,
    price: '$0.18',
    change: '-2.34%',
    positive: false,
    chartData: [50, 48, 47, 45, 44, 42, 41, 39, 38, 36, 35, 33],
  },
];

/**
 * Crypto cards with live prices and charts - Animated Carousel
 */
export default function CoinsMarquee() {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: 'background.default',
        py: { xs: 4, md: 6 },
        mt: { xs: -4, md: -6 },
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        {/* Left blur gradient */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: { xs: 40, md: 80 },
            background: 'linear-gradient(to right, #fafafa 0%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />

        {/* Right blur gradient */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: { xs: 40, md: 80 },
            background: 'linear-gradient(to left, #fafafa 0%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />

        {/* Scrolling container */}
        <Box
          sx={{
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{
              animation: 'scroll 40s linear infinite',
              '&:hover': {
                animationPlayState: 'paused',
              },
              '@keyframes scroll': {
                '0%': {
                  transform: 'translateX(0)',
                },
                '100%': {
                  transform: 'translateX(-50%)',
                },
              },
            }}
          >
            {/* First set of cards */}
            {coins.map((coin) => {
              const IconComponent = coin.icon;
              return (
                <Card
                  key={`${coin.ticker}-1`}
                  sx={{
                    minWidth: { xs: 160, sm: 180, md: 200 },
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid #E5E7EB',
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${coin.color}20`,
                      borderColor: coin.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      {/* Icon and Ticker */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: `${coin.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent sx={{ fontSize: 20, color: coin.color }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            {coin.ticker}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: 10 }}
                          >
                            {coin.name}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Mini Chart */}
                      <Box sx={{ mx: -1, my: 0.5 }}>
                        <MiniChart data={coin.chartData} positive={coin.positive} />
                      </Box>

                      {/* Price and Change */}
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: 15, mb: 0.5 }}>
                          {coin.price}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {coin.positive ? (
                            <TrendingUpIcon sx={{ fontSize: 14, color: '#10B981' }} />
                          ) : (
                            <TrendingDownIcon sx={{ fontSize: 14, color: '#EF4444' }} />
                          )}
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            sx={{ color: coin.positive ? '#10B981' : '#EF4444', fontSize: 12 }}
                          >
                            {coin.change}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            {/* Duplicate set for seamless loop */}
            {coins.map((coin) => {
              const IconComponent = coin.icon;
              return (
                <Card
                  key={`${coin.ticker}-2`}
                  sx={{
                    minWidth: { xs: 160, sm: 180, md: 200 },
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid #E5E7EB',
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${coin.color}20`,
                      borderColor: coin.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      {/* Icon and Ticker */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: `${coin.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent sx={{ fontSize: 20, color: coin.color }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            {coin.ticker}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: 10 }}
                          >
                            {coin.name}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Mini Chart */}
                      <Box sx={{ mx: -1, my: 0.5 }}>
                        <MiniChart data={coin.chartData} positive={coin.positive} />
                      </Box>

                      {/* Price and Change */}
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: 15, mb: 0.5 }}>
                          {coin.price}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {coin.positive ? (
                            <TrendingUpIcon sx={{ fontSize: 14, color: '#10B981' }} />
                          ) : (
                            <TrendingDownIcon sx={{ fontSize: 14, color: '#EF4444' }} />
                          )}
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            sx={{ color: coin.positive ? '#10B981' : '#EF4444', fontSize: 12 }}
                          >
                            {coin.change}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
