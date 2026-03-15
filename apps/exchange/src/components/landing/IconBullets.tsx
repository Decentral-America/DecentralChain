import QrCode2Icon from '@mui/icons-material/QrCode2';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import StorageIcon from '@mui/icons-material/Storage';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Avatar, Box, Container, Grid, Stack, Typography } from '@mui/material';

const bullets = [
  {
    desc: 'Trade DCC, BTC, CRC and other DecentralChain assets',
    icon: <SwapHorizIcon />,
    title: 'DEX Trading Pairs',
  },
  {
    desc: 'Full order book access with custom pricing',
    icon: <StorageIcon />,
    title: 'Limit & Market Orders',
  },
  {
    desc: 'PBKDF2 encryption with master password protection',
    icon: <SecurityIcon />,
    title: 'Encrypted Storage',
  },
  {
    desc: 'Complete audit trail of all wallet activity',
    icon: <TrendingUpIcon />,
    title: 'Transaction History',
  },
  {
    desc: 'Sign transactions with hardware device',
    icon: <ShieldIcon />,
    title: 'Ledger Integration',
  },
  {
    desc: 'Available at decentral.exchange',
    icon: <QrCode2Icon />,
    title: 'Web & Desktop',
  },
];

export default function IconBullets() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 4, xs: 3 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={2.5}>
          {bullets.map((bullet) => (
            <Grid
              key={bullet.title}
              size={{
                md: 4,
                sm: 6,
                xs: 12,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    height: 40,
                    width: 40,
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
