/**
 * Analytics Page
 * Portfolio analytics and performance insights with real-time data
 */

import {
  AccountBalanceWallet,
  SwapHoriz,
  Timeline,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';
import { Alert, Box, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useAddressTransactions } from '@/api/services/addressService';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';

export const Analytics = () => {
  const { user } = useAuth();
  const { balances, isLoading: isLoadingBalance } = useBalanceWatcher({
    enabled: !!user?.address,
  });
  const { data: transactions, isLoading: isLoadingTransactions } = useAddressTransactions(
    user?.address || '',
    100,
    { enabled: !!user?.address },
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
      change: 'Available Balance',
      icon: <AccountBalanceWallet />,
      label: 'Total Portfolio Value',
      trend: 'neutral' as const,
      value: isLoadingBalance ? <Skeleton width={100} /> : `${portfolioValue.toFixed(8)} DCC`,
    },
    {
      change: 'Generating Balance',
      icon: <TrendingUp />,
      label: 'Total Profit/Loss',
      trend: 'up' as const,
      value: isLoadingBalance ? (
        <Skeleton width={100} />
      ) : (
        `${((balances?.generating || 0) / 100000000).toFixed(8)} DCC`
      ),
    },
    {
      change: `+${todayTransactionCount} today`,
      icon: <SwapHoriz />,
      label: 'Total Transactions',
      trend: 'neutral' as const,
      value: isLoadingTransactions ? <Skeleton width={80} /> : transactionCount.toLocaleString(),
    },
    {
      change: 'Transaction Growth',
      icon: <Timeline />,
      label: '30-Day Activity',
      trend: performanceChange.startsWith('+') ? ('up' as const) : ('down' as const),
      value: isLoadingTransactions ? <Skeleton width={80} /> : performanceChange,
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
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Analytics
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid
            key={stat.label}
            size={{
              md: 3,
              sm: 6,
              xs: 12,
            }}
          >
            <Paper
              sx={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                border: '1px solid #EEF2F7',
                borderRadius: 2,
                p: 2.5,
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    alignItems: 'center',
                    background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
                    borderRadius: 2,
                    color: '#fff',
                    display: 'flex',
                    height: 48,
                    justifyContent: 'center',
                    width: 48,
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
                  sx={{ alignItems: 'center', display: 'flex', gap: 0.5 }}
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
          border: '1px solid #EEF2F7',
          borderRadius: 2,
          mt: 3,
          p: 3,
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
