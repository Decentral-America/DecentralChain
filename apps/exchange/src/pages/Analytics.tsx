/**
 * Analytics Page
 * Portfolio analytics and performance insights with real-time data
 */
import { Box, Typography, Paper, Grid, Stack, Skeleton, Alert } from '@mui/material';
import {
  TrendingUp,
  AccountBalanceWallet,
  SwapHoriz,
  Timeline,
  TrendingDown,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useAddressTransactions } from '@/api/services/addressService';
import { useMemo } from 'react';

export const Analytics = () => {
  const { user } = useAuth();
  const { balances, isLoading: isLoadingBalance } = useBalanceWatcher({
    enabled: !!user?.address,
  });
  const { data: transactions, isLoading: isLoadingTransactions } = useAddressTransactions(
    user?.address || '',
    100,
    { enabled: !!user?.address }
  );

  // Calculate total portfolio value in DCC
  const portfolioValue = useMemo(() => {
    if (!balances || balances.available === undefined) return 0;
    // Convert wavelets to DCC
    return balances.available / 100000000;
  }, [balances]);

  // Calculate transaction count (flatten nested array)
  const transactionCount = useMemo(() => {
    if (!transactions) return 0;
    return transactions.flat().length;
  }, [transactions]);

  // Calculate today's transactions
  const todayTransactionCount = useMemo(() => {
    if (!transactions) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return transactions.flat().filter((tx) => {
      const txTimestamp = tx.timestamp || 0;
      return txTimestamp >= todayTimestamp;
    }).length;
  }, [transactions]);

  // Calculate performance (simplified - comparing last tx timestamp vs first)
  const performanceChange = useMemo(() => {
    if (!transactions || transactions.length === 0) return '+0.0%';
    const flatTxs = transactions.flat();
    if (flatTxs.length < 2) return '+0.0%';

    // Simple metric: more transactions = more activity = positive indicator
    const recentTxs = flatTxs.slice(0, Math.min(30, flatTxs.length));
    const olderTxs = flatTxs.slice(Math.min(30, flatTxs.length));

    if (olderTxs.length === 0) return '+100.0%';

    const change = ((recentTxs.length - olderTxs.length) / olderTxs.length) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }, [transactions]);

  const stats = [
    {
      label: 'Total Portfolio Value',
      value: isLoadingBalance ? <Skeleton width={100} /> : `${portfolioValue.toFixed(8)} DCC`,
      change: 'Available Balance',
      icon: <AccountBalanceWallet />,
      trend: 'neutral' as const,
    },
    {
      label: 'Total Profit/Loss',
      value: isLoadingBalance ? (
        <Skeleton width={100} />
      ) : (
        `${((balances?.generating || 0) / 100000000).toFixed(8)} DCC`
      ),
      change: 'Generating Balance',
      icon: <TrendingUp />,
      trend: 'up' as const,
    },
    {
      label: 'Total Transactions',
      value: isLoadingTransactions ? <Skeleton width={80} /> : transactionCount.toLocaleString(),
      change: `+${todayTransactionCount} today`,
      icon: <SwapHoriz />,
      trend: 'neutral' as const,
    },
    {
      label: '30-Day Activity',
      value: isLoadingTransactions ? <Skeleton width={80} /> : performanceChange,
      change: 'Transaction Growth',
      icon: <Timeline />,
      trend: performanceChange.startsWith('+') ? ('up' as const) : ('down' as const),
    },
  ];

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please connect your wallet to view analytics</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid #EEF2F7',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  color={
                    stat.trend === 'up'
                      ? 'success.main'
                      : stat.trend === 'down'
                        ? 'error.main'
                        : 'text.secondary'
                  }
                  fontWeight={600}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  {stat.trend === 'up' && <TrendingUp fontSize="small" />}
                  {stat.trend === 'down' && <TrendingDown fontSize="small" />}
                  {stat.change}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 2,
          border: '1px solid #EEF2F7',
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Transaction Activity
        </Typography>
        {isLoadingTransactions ? (
          <Stack spacing={1}>
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
          </Stack>
        ) : transactions && transactions.flat().length > 0 ? (
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(10, transactions.flat().length)} of {transactions.flat().length} total
            transactions
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No transaction history available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
