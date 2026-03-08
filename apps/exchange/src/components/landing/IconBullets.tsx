import QrCode2Icon from '@mui/icons-material/QrCode2';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import StorageIcon from '@mui/icons-material/Storage';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Avatar, Box, Container, Grid, Stack, Typography } from '@mui/material';

const bullets = [
  {
    title: 'DEX Trading Pairs',
    desc: 'Trade DCC, BTC, CRC and other DecentralChain assets',
    icon: <SwapHorizIcon />,
  },
  {
    title: 'Limit & Market Orders',
    desc: 'Full order book access with custom pricing',
    icon: <StorageIcon />,
  },
  {
    title: 'Encrypted Storage',
    desc: 'PBKDF2 encryption with master password protection',
    icon: <SecurityIcon />,
  },
  {
    title: 'Transaction History',
    desc: 'Complete audit trail of all wallet activity',
    icon: <TrendingUpIcon />,
  },
  {
    title: 'Ledger Integration',
    desc: 'Sign transactions with hardware device',
    icon: <ShieldIcon />,
  },
  {
    title: 'Web & Desktop',
    desc: 'Available at decentral.exchange',
    icon: <QrCode2Icon />,
  },
];

export default function IconBullets() {
  return (
    <Box component="section" sx={{ py: { xs: 3, md: 4 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={2.5}>
          {bullets.map((bullet) => (
            <Grid
              key={bullet.title}
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    color: '#fff',
                  }}
                >
                  {bullet.icon}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>{bullet.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bullet.desc}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
