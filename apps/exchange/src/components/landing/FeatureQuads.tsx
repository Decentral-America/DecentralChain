import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Avatar, Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';

const features = [
  {
    desc: 'Connect Ledger Nano devices for maximum security',
    icon: <SecurityIcon />,
    title: 'Hardware Wallet Support',
  },
  {
    desc: 'Manage multiple wallets with one master password',
    icon: <SpeedIcon />,
    title: 'Multi-Account',
  },
  {
    desc: 'Live order book and instant trade execution',
    icon: <AccountBalanceIcon />,
    title: 'Real-Time Trading',
  },
  {
    desc: 'Send, receive, and track all your DCC tokens',
    icon: <SupportAgentIcon />,
    title: 'Asset Management',
  },
];

export default function FeatureQuads() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 4, xs: 3 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={2.5}>
          {features.map((feature) => (
            <Grid
              key={feature.title}
              size={{
                md: 3,
                sm: 6,
                xs: 12,
              }}
            >
              <Card sx={{ bgcolor: '#FBFCFE', border: '1px solid #EEF2F7', boxShadow: 1 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      variant="rounded"
                      sx={{ bgcolor: 'primary.main', height: 32, width: 32 }}
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
