/**
 * Leasing Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */
import { Box, Container, Typography, Stack } from '@mui/material';
import { TrendingUpOutlined } from '@mui/icons-material';
import { Leasing as LegacyLeasing } from './Leasing';

export const LeasingModern = () => {
  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="xl">
        <Stack spacing={5}>
          {/* Hero Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                }}
              >
                <TrendingUpOutlined sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    background: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
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

export default LeasingModern;
