/**
 * Analytics Page
 *
 * What this account can honestly say about itself from the node: its balances
 * and how many transactions it has made. There is no price oracle, so there is
 * no profit, no loss and no value growth here; a figure the wallet cannot know
 * is left out rather than approximated. The one change it does show is
 * activity — transactions in the last 30 days against the 30 before — because
 * that is counted from real timestamps, not inferred.
 */

import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import { Activity, ArrowLeftRight, ReceiptText } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAddressTransactions } from '@/api/services/addressService';
import { Button } from '@/components/atoms/Button';
import { StatCard } from '@/components/atoms/StatCard';
import { EmptyState } from '@/components/premium/EmptyState';
import { SkeletonLines, SkeletonSwap } from '@/components/premium/SkeletonSwap';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';
import { typeScale } from '@/styles/tokens';

/** Base units per DCC. */
const DCCLETS = 100000000;

/** The skeleton for one stat card: a figure-height bar over a label-height bar. */
function StatSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={30} width="70%" />
      <Skeleton variant="rounded" height={12} width="45%" sx={{ mt: 1.25 }} />
    </Box>
  );
}

function Stat({
  label,
  value,
  caption,
  suffix,
  decimals,
  ready,
}: {
  label: string;
  /** Numbers roll; a string (a signed percentage, an em dash) renders as given. */
  value: number | string;
  caption?: string | undefined;
  suffix?: string | undefined;
  decimals?: number | undefined;
  ready: boolean;
}) {
  return (
    <SkeletonSwap
      ready={ready}
      label={label}
      skeleton={
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <StatSkeleton />
          </CardContent>
        </Card>
      }
    >
      <StatCard label={label} value={value} caption={caption} suffix={suffix} decimals={decimals} />
    </SkeletonSwap>
  );
}

export const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balances, isLoading: isLoadingBalance } = useBalanceWatcher({
    enabled: !!user?.address,
  });
  const { data: transactions, isLoading: isLoadingTransactions } = useAddressTransactions(
    user?.address || '',
    100,
    { enabled: !!user?.address },
  );

  const available = useMemo(() => {
    if (!balances || balances.available === undefined) return 0;
    // Convert dcclets to DCC
    return balances.available / DCCLETS;
  }, [balances]);

  const generating = (balances?.generating || 0) / DCCLETS;

  // Transactions arrive as a nested array; flatten once.
  const flat = useMemo(() => (transactions ? transactions.flat() : []), [transactions]);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime();
    return flat.filter((tx) => (tx.timestamp || 0) >= start).length;
  }, [flat]);

  // Real 30-day windows: transactions in the last 30 days vs the 30 days before
  // that, both cut by actual timestamp — not by array position, which does not
  // correspond to a time window at all when txs arrive in bursts.
  const activityChange = useMemo(() => {
    if (flat.length === 0) return null;

    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recentCutoff = now - 30 * DAY_MS;
    const priorCutoff = now - 60 * DAY_MS;

    const recentCount = flat.filter((tx) => (tx.timestamp || 0) >= recentCutoff).length;
    const priorCount = flat.filter(
      (tx) => (tx.timestamp || 0) >= priorCutoff && (tx.timestamp || 0) < recentCutoff,
    ).length;

    if (priorCount === 0) return null;

    const change = ((recentCount - priorCount) / priorCount) * 100;
    return { recentCount, text: change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%` };
  }, [flat]);

  if (!user) {
    return (
      <PageFrame title="Analytics">
        <Card>
          <EmptyState
            icons={[Activity]}
            title="No wallet connected"
            description="Sign in to see this account's balances and activity."
          />
        </Card>
      </PageFrame>
    );
  }

  const balancesReady = !isLoadingBalance;
  const txReady = !isLoadingTransactions;

  // The query reads the latest 100, so a count of 100 is a floor, not a total.
  const transactionsCaption = [flat.length >= 100 ? 'latest 100' : null, `${todayCount} today`]
    .filter(Boolean)
    .join(' · ');

  return (
    <PageFrame
      title="Analytics"
      subtitle="Balances and activity for this account, read from the node."
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: pageRhythm }}>
        <Grid container spacing={{ md: pageRhythm, xs: 1.5 }}>
          <Grid size={{ md: 3, xs: 6 }}>
            <Stat label="Available balance" value={available} suffix=" DCC" ready={balancesReady} />
          </Grid>
          <Grid size={{ md: 3, xs: 6 }}>
            {/*
              Not "Total Profit/Loss": no price oracle or historical-balance
              data exists anywhere in this stack (see BalanceChart.tsx), so P&L
              is not a computable figure — showing the generating balance under
              a P&L label was a real number wearing the wrong name.
            */}
            <Stat
              label="Generating balance"
              caption="eligible to earn block rewards"
              value={generating}
              suffix=" DCC"
              ready={balancesReady}
            />
          </Grid>
          <Grid size={{ md: 3, xs: 6 }}>
            <Stat
              label="Transactions"
              caption={transactionsCaption}
              value={flat.length}
              decimals={0}
              ready={txReady}
            />
          </Grid>
          <Grid size={{ md: 3, xs: 6 }}>
            <Stat
              label="30-day activity"
              caption={activityChange ? 'vs. previous 30 days' : 'not enough history yet'}
              value={activityChange?.text ?? '—'}
              ready={txReady}
            />
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography
              component="h2"
              sx={{
                fontSize: typeScale.subheading.size,
                fontWeight: 600,
                letterSpacing: typeScale.subheading.tracking,
                mb: 1.5,
              }}
            >
              Recent activity
            </Typography>
            <SkeletonSwap ready={txReady} skeleton={<SkeletonLines lines={2} height={14} />}>
              {flat.length > 0 ? (
                <Box
                  sx={{
                    alignItems: { sm: 'center', xs: 'flex-start' },
                    display: 'flex',
                    flexDirection: { sm: 'row', xs: 'column' },
                    gap: 2,
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ color: 'text.secondary', fontSize: typeScale.body.size }}>
                    Showing {Math.min(10, flat.length)} of {flat.length} total transactions
                  </Typography>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => navigate('/desktop/wallet/transactions')}
                  >
                    View all transactions
                  </Button>
                </Box>
              ) : (
                <EmptyState
                  compact
                  icons={[ReceiptText, ArrowLeftRight, Activity]}
                  title="No activity yet"
                  description="Transfers, trades and leases made from this address will be counted here."
                />
              )}
            </SkeletonSwap>
          </CardContent>
        </Card>
      </Box>
    </PageFrame>
  );
};
