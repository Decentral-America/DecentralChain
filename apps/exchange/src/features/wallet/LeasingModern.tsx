/**
 * Leasing Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */

import { TrendingUpOutlined } from '@mui/icons-material';
import { Box, Container, Stack, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens/semantic';
import { Leasing as LegacyLeasing } from './Leasing';

export const LeasingModern = () => {
  return (
    <Box sx={{ py: { md: 6, xs: 4 } }}>
      <Container maxWidth="xl">
        <Stack spacing={5}>
          {/* Hero Section */}
          <Box>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  background: tokens('light').intent.warning,
                  borderRadius: 2.5,
                  boxShadow: `0 8px 24px ${tokens('light').intent.warning}4D`,
                  display: 'flex',
                  height: 56,
                  justifyContent: 'center',
                  width: 56,
                }}
              >
                {/*
                  Fixed badge, fixed gradient — `white` missed even the 3:1
                  icon floor against both stops (2.15/2.26), mode-independent
                  since neither the icon nor the gradient ever read the
                  theme. Both stops clear comfortably with the app's own
                  fixed dark ink instead (8.49/8.06 — fix round 1,
                  task-6-report.md), the same "fixed panel, fixed ink" pin
                  used for CreateToken's customize button.
                */}
                <TrendingUpOutlined sx={{ color: tokens('light').text.primary, fontSize: 32 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    background: tokens('light').intent.warning,
                    fontSize: { md: '2.5rem', xs: '2rem' },
                    fontWeight: 800,
                    mb: 0.5,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Leasing & Staking
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    fontSize: 18,
                  }}
                >
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
