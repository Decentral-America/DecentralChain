/**
 * Leasing Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */

import { TrendingUpOutlined } from '@mui/icons-material';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Leasing as LegacyLeasing } from './Leasing';

export const LeasingModern = () => {
  return (
    <Box sx={{ py: { md: 6, xs: 4 } }}>
      <Container maxWidth="xl">
        <Stack spacing={5}>
          {/* Hero Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Box
                sx={{
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
                  borderRadius: 2.5,
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  height: 56,
                  justifyContent: 'center',
                  width: 56,
                }}
              >
                <TrendingUpOutlined sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
                    fontSize: { md: '2.5rem', xs: '2rem' },
                    fontWeight: 800,
                    mb: 0.5,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Leasing & Staking
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18 }}>
                  Stake your DCC to earn rewards and support the network
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Legacy Leasing Component */}
          <Box>
            <LegacyLeasing />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
