import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';

const features = [
  {
    desc: 'Full control of your private keys. Import seed phrase, create new wallets, or connect Ledger hardware wallet for maximum security.',
    icon: <AccountBalanceWalletIcon />,
    title: 'Non-Custodial Wallet',
  },
  {
    desc: 'Trade any asset pair on DecentralChain DEX with limit orders, market orders, and real-time order book matching.',
    icon: <SwapHorizIcon />,
    title: 'Integrated DEX Trading',
  },
  {
    desc: 'Earn rewards by leasing DCC tokens to network nodes. Track your staking rewards and manage leases directly from your wallet.',
    icon: <ShowChartIcon />,
    title: 'Staking & Leasing',
  },
];

export default function FeaturesRow() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 4, xs: 4 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 5 }}>
          Everything you need for DecentralChain
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid
              key={feature.title}
              size={{
                md: 4,
                xs: 12,
              }}
            >
              <Card
                sx={{
                  border: '1px solid #E6EAF2',
                  borderRadius: 2,
                  boxShadow: '0 8px 24px rgba(16,24,40,.04)',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                    <Typography variant="h6" fontWeight={700}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.desc}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
