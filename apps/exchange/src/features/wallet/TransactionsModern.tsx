/**
 * Transactions Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */

import { AccountBalanceWalletOutlined } from '@mui/icons-material';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Transactions as LegacyTransactions } from './Transactions';

export const TransactionsModern = () => {
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
                  background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                  borderRadius: 2.5,
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
                  display: 'flex',
                  height: 56,
                  justifyContent: 'center',
                  width: 56,
                }}
              >
                <AccountBalanceWalletOutlined sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                    fontSize: { md: '2.5rem', xs: '2rem' },
                    fontWeight: 800,
                    mb: 0.5,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Transaction History
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18 }}>
                  View and export your complete transaction history
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Legacy Transactions Component */}
          <Box>
            <LegacyTransactions />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
