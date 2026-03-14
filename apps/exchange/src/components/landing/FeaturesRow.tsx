import { Box, Container, Typography, Grid, Card, CardContent, Stack } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const features = [
  {
    title: 'Non-Custodial Wallet',
    desc: 'Full control of your private keys. Import seed phrase, create new wallets, or connect Ledger hardware wallet for maximum security.',
    icon: <AccountBalanceWalletIcon />,
  },
  {
    title: 'Integrated DEX Trading',
    desc: 'Trade any asset pair on DecentralChain DEX with limit orders, market orders, and real-time order book matching.',
    icon: <SwapHorizIcon />,
  },
  {
    title: 'Staking & Leasing',
    desc: 'Earn rewards by leasing DCC tokens to network nodes. Track your staking rewards and manage leases directly from your wallet.',
    icon: <ShowChartIcon />,
  },
];

export default function FeaturesRow() {
  return (
    <Box component="section" sx={{ py: { xs: 4, md: 4 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" sx={{ mb: 5, fontWeight: 700 }}>
          Everything you need for DecentralChain
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  border: '1px solid #E6EAF2',
                  boxShadow: '0 8px 24px rgba(16,24,40,.04)',
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
