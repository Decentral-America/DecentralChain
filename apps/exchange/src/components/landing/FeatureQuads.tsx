import { Box, Container, Grid, Card, CardContent, Typography, Stack, Avatar } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const features = [
  {
    title: 'Hardware Wallet Support',
    desc: 'Connect Ledger Nano devices for maximum security',
    icon: <SecurityIcon />,
  },
  {
    title: 'Multi-Account',
    desc: 'Manage multiple wallets with one master password',
    icon: <SpeedIcon />,
  },
  {
    title: 'Real-Time Trading',
    desc: 'Live order book and instant trade execution',
    icon: <AccountBalanceIcon />,
  },
  {
    title: 'Asset Management',
    desc: 'Send, receive, and track all your DCC tokens',
    icon: <SupportAgentIcon />,
  },
];

export default function FeatureQuads() {
  return (
    <Box component="section" sx={{ py: { xs: 3, md: 4 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={2.5}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card sx={{ bgcolor: '#FBFCFE', border: '1px solid #EEF2F7', boxShadow: 1 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      variant="rounded"
                      sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600} fontSize={14}>
                        {feature.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feature.desc}
                      </Typography>
                    </Box>
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
