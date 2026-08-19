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
import { Alert, Box, Grid, Paper, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useAddressTransactions } from '@/api/services/addressService';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { formatAmount } from '@/utils/formatters';

export const Analytics = () => {
  const { palette } = useTheme();
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
    // Convert dcclets to DCC
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

  // Real 30-day windows: transactions in the last 30 days vs the 30 days before
  // that, both cut by actual timestamp — not by array position, which does not
  // correspond to a time window at all when txs arrive in bursts.
  const activityChange = useMemo(() => {
    if (!transactions) return null;
    const flatTxs = transactions.flat();
    if (flatTxs.length === 0) return null;

    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recentCutoff = now - 30 * DAY_MS;
    const priorCutoff = now - 60 * DAY_MS;

    const recentCount = flatTxs.filter((tx) => (tx.timestamp || 0) >= recentCutoff).length;
    const priorCount = flatTxs.filter(
      (tx) => (tx.timestamp || 0) >= priorCutoff && (tx.timestamp || 0) < recentCutoff,
    ).length;

    if (priorCount === 0) return null;

    const change = ((recentCount - priorCount) / priorCount) * 100;
    return { recentCount, text: change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%` };
  }, [transactions]);

  const stats = [
    {
      change: 'Available Balance',
      icon: <AccountBalanceWallet />,
      label: 'Total Portfolio Value',
      trend: 'neutral' as const,
      value: isLoadingBalance ? <Skeleton width={100} /> : `${formatAmount(portfolioValue)} DCC`,
    },
    {
      // Renamed from "Total Profit/Loss": no price oracle or historical-balance
      // data exists anywhere in this stack (see BalanceChart.tsx), so P&L is
      // not a computable figure — showing generatingBalance under a P&L label
      // was a real number wearing the wrong name. This is what it actually is.
      change: 'Eligible to earn block rewards',
      icon: <TrendingUp />,
      label: 'Generating Balance',
      trend: 'neutral' as const,
      value: isLoadingBalance ? (
        <Skeleton width={100} />
      ) : (
        `${formatAmount((balances?.generating || 0) / 100000000)} DCC`
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
      change: activityChange ? 'vs. previous 30 days' : 'Not enough history yet',
      icon: <Timeline />,
      label: '30-Day Activity',
      trend: activityChange
        ? activityChange.text.startsWith('+')
          ? ('up' as const)
          : ('down' as const)
        : ('neutral' as const),
      value: isLoadingTransactions ? <Skeleton width={80} /> : (activityChange?.text ?? '—'),
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
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2.5,
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    alignItems: 'center',
                    background: `linear-gradient(180deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
                    borderRadius: 2,
                    color: 'primary.contrastText',
                    display: 'flex',
                    height: 48,
                    justifyContent: 'center',
                    width: 48,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                  }}
                >
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
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    fontWeight: 600,
                    gap: 0.5,
                  }}
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
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mt: 3,
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 700,
          }}
        >
          Recent Transaction Activity
        </Typography>
        {isLoadingTransactions ? (
          <Stack spacing={1}>
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
          </Stack>
        ) : transactions && transactions.flat().length > 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            Showing {Math.min(10, transactions.flat().length)} of {transactions.flat().length} total
            transactions
          </Typography>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            No transaction history available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
