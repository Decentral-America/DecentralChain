/**
 * Transactions Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */
import { Box, Container, Typography, Stack } from '@mui/material';
import { AccountBalanceWalletOutlined } from '@mui/icons-material';
import { Transactions as LegacyTransactions } from './Transactions';

export const TransactionsModern = () => {
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
                  background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
                }}
              >
                <AccountBalanceWalletOutlined sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
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

export default TransactionsModern;
