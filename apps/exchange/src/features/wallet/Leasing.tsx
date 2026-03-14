/**
 * Leasing Component
 * Interface for staking DCC with nodes and viewing active leases
 * Allows users to create lease transactions and cancel active leases
 */
import { MouseEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  RefreshOutlined,
  TrendingUpOutlined,
  ShieldOutlined,
  HistoryOutlined,
  CancelScheduleSendOutlined,
  PlayArrowRounded,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ds from 'data-service';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { LeasingChart } from './LeasingChart';
import { formatDcc, shortenAddress, toTimestamp } from '@/utils/formatters';
import {
  createLeaseTransaction,
  createCancelLeaseTransaction,
  broadcastTransaction,
} from '@/utils/transactions';

const DCC_DECIMALS = 1e8;
const LEASE_FEE_DCC = 0.001;

/**
 * Active lease data
 */
interface Lease {
  id: string;
  type: number;
  sender: string;
  recipient: string;
  amount: number;
  height: number;
  timestamp: number | string | Date;
  status?: 'active' | 'cancelled' | 'canceled';
  typeName?: string;
  // Additional fields may be returned from recent transactions API
  [key: string]: unknown;
}

/**
 * Filter options for lease list
 */
type LeaseFilter = 'all' | 'active' | 'canceled';

/**
 * Leasing Component
 */
export const Leasing = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'canceled'>('all');

  // Use balance watcher hook for real-time balance updates
  const {
    balances,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching,
    error: balanceError,
    forceRefresh: refetchBalance,
  } = useBalanceWatcher({
    interval: 3000, // Poll every 3 seconds
    enabled: Boolean(user?.address),
  });

  const {
    data: activeLeases,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching,
    error: activeError,
    refetch: refetchActiveLeases,
  } = useQuery<Lease[], Error>({
    queryKey: ['active-leases', user?.address],
    enabled: Boolean(user?.address),
    refetchInterval: 3000,
    staleTime: 1000,
    queryFn: async () => {
      if (!user?.address) throw new Error('No address');
      const response = await fetch(`${ds.config.get('node')}/leasing/active/${user.address}`);
      if (!response.ok) throw new Error('Failed to fetch active leases');
      const data = await response.json();
      return data.map((lease: Lease) => ({ ...lease, status: 'active' as const }));
    },
  });

  const {
    data: recentTxs,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<unknown[], Error>({
    queryKey: ['lease-transactions', user?.address],
    enabled: Boolean(user?.address),
    refetchInterval: 3000,
    staleTime: 1000,
    queryFn: async () => {
      if (!user?.address) throw new Error('No address');
      return ds.api.transactions.list(user.address, 500, '');
    },
  });

  const leaseMutation = useMutation<{ id: string }, Error>({
    mutationFn: async () => {
      if (!user?.address) throw new Error('Not authenticated');
      if (!user?.seed) throw new Error('Seed not available. Please log in again.');

      const amountInWavelets = Math.floor(parseFloat(amount) * DCC_DECIMALS);
      const tx = await createLeaseTransaction({ recipient, amount: amountInWavelets }, user.seed);

      return broadcastTransaction(tx);
    },
    onSuccess: () => {
      setRecipient('');
      setAmount('');
      setRecipientError(null);
      setAmountError(null);

      queryClient.invalidateQueries({ queryKey: ['balances', user?.address] });
      queryClient.invalidateQueries({ queryKey: ['active-leases', user?.address] });
      queryClient.invalidateQueries({ queryKey: ['lease-transactions', user?.address] });
    },
    onError: (error) => {
      alert(`Lease failed: ${error.message}`);
    },
  });

  const cancelLeaseMutation = useMutation<{ id: string }, Error, string>({
    mutationFn: async (leaseId: string) => {
      if (!user?.address) throw new Error('Not authenticated');
      if (!user?.seed) throw new Error('Seed not available. Please log in again.');
      const tx = await createCancelLeaseTransaction(leaseId, user.seed);
      return broadcastTransaction(tx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances', user?.address] });
      queryClient.invalidateQueries({ queryKey: ['active-leases', user?.address] });
      queryClient.invalidateQueries({ queryKey: ['lease-transactions', user?.address] });
    },
    onError: (error) => {
      alert(`Cancel lease failed: ${error.message}`);
    },
  });

  // Extract balance values from balance watcher
  // 'regular' is the total spendable balance (not leased out)
  // 'generating' is the amount currently leased out
  // 'available' is regular balance minus any pending transactions
  const regularBalance = balances?.regular ?? 0; // Spendable balance
  const leasedBalance = balances?.generating ?? 0; // Currently leased out
  const availableBalance = balances?.available ?? regularBalance; // Available for transactions

  const balanceInDcc = regularBalance / DCC_DECIMALS; // Spendable in DCC
  const leasedInDcc = leasedBalance / DCC_DECIMALS; // Leased out in DCC
  const availableInDcc = availableBalance / DCC_DECIMALS; // Available for new leases

  const allLeasingTxs = useMemo(() => {
    if (!recentTxs) return [];

    const LEASE_TYPES = ['lease-in', 'lease-out', 'cancel-leasing'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = (recentTxs as any[]).filter((tx) => LEASE_TYPES.includes(tx.typeName));

    if (!activeLeases?.length) return filtered;

    const idHash = filtered.reduce(
      (acc, tx) => {
        acc[tx.id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const merged = [...filtered];
    activeLeases.forEach((tx) => {
      if (!idHash[tx.id]) {
        merged.push(tx as unknown as Lease);
      }
    });

    return merged;
  }, [recentTxs, activeLeases]);

  const leases = useMemo(() => {
    const list = allLeasingTxs ?? [];
    switch (filter) {
      case 'active':
        return list.filter((tx: Lease) => (tx.status ?? tx.typeName) === 'active');
      case 'canceled':
        return list.filter(
          (tx: Lease) =>
            tx.status === 'cancelled' ||
            tx.status === 'canceled' ||
            tx.typeName === 'cancel-leasing'
        );
      case 'all':
      default:
        return list;
    }
  }, [allLeasingTxs, filter]);

  const tableRows = useMemo(() => {
    return (leases as Lease[]).map((lease) => {
      const rawAmount = (() => {
        if (typeof lease.amount === 'number') {
          return lease.amount;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokens = (lease as any).transfer?.amount?.getTokens?.()?.toNumber?.();
        return (tokens as number | undefined) ?? 0;
      })();
      const recipientValue =
        lease.recipient ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((lease as any).transfer?.recipient as string | undefined) ||
        '';
      const status: 'active' | 'cancelled' | 'pending' = (():
        | 'active'
        | 'cancelled'
        | 'pending' => {
        if (lease.status === 'active') return 'active';
        if (
          lease.status === 'cancelled' ||
          lease.status === 'canceled' ||
          lease.typeName === 'cancel-leasing'
        ) {
          return 'cancelled';
        }
        return 'pending';
      })();

      return {
        id: lease.id,
        type: lease.typeName || 'lease',
        amount: rawAmount,
        recipient: recipientValue,
        timestamp: toTimestamp(lease.timestamp),
        status,
        canCancel: status === 'active' && lease.typeName !== 'cancel-leasing',
      };
    });
  }, [leases]);

  const allCount = allLeasingTxs?.length ?? 0;
  const activeCount =
    (allLeasingTxs as Lease[] | undefined)?.filter(
      (tx) => tx.status === 'active' || tx.typeName === 'lease-out'
    ).length ?? 0;
  const canceledCount =
    (allLeasingTxs as Lease[] | undefined)?.filter((tx) => {
      const status = typeof tx.status === 'string' ? tx.status : undefined;
      return status === 'cancelled' || status === 'canceled' || tx.typeName === 'cancel-leasing';
    }).length ?? 0;

  const isRefreshing = isBalanceFetching || isActiveFetching || isHistoryFetching;
  const initialLoading = isBalanceLoading || isActiveLoading || isHistoryLoading;
  const errorMessage =
    (balanceError ? `Balance: ${balanceError.message}` : '') ||
    activeError?.message ||
    historyError?.message ||
    '';

  /**
   * Validate recipient address
   */
  const validateRecipient = (value: string) => {
    if (!value) {
      setRecipientError('Recipient address is required');
      return false;
    }

    // DCC address validation (starts with 3, 35 characters)
    const addressRegex = /^3[A-Za-z0-9]{34}$/;
    if (!addressRegex.test(value)) {
      setRecipientError('Invalid DCC address format');
      return false;
    }

    setRecipientError(null);
    return true;
  };

  /**
   * Validate amount
   */
  const validateAmount = (value: string) => {
    if (!value) {
      setAmountError('Amount is required');
      return false;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }

    // Use available balance (excludes already leased amount)
    if (numeric + LEASE_FEE_DCC > availableInDcc) {
      setAmountError(`Insufficient balance (including fee). Available: ${availableInDcc.toFixed(8)} DCC`);
      return false;
    }

    setAmountError(null);
    return true;
  };

  /**
   * Handle lease submission
   */
  const handleLease = () => {
    const isRecipientValid = validateRecipient(recipient);
    const isAmountValid = validateAmount(amount);

    if (isRecipientValid && isAmountValid) {
      leaseMutation.mutate();
    }
  };

  /**
   * Handle MAX button click
   */
  const handleMaxAmount = () => {
    // Use available balance (not leased)
    if (availableInDcc <= LEASE_FEE_DCC) {
      setAmount('');
      return;
    }

    const maxAmount = Math.max(0, availableInDcc - LEASE_FEE_DCC);
    const formatted = maxAmount.toFixed(8);
    setAmount(formatted);
    validateAmount(formatted);
  };

  /**
   * Handle cancel lease
   */
  const handleCancelLease = (leaseId: string) => {
    if (window.confirm('Are you sure you want to cancel this lease?')) {
      cancelLeaseMutation.mutate(leaseId);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (_event: MouseEvent<HTMLElement>, next: LeaseFilter | null) => {
    if (next) {
      setFilter(next);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    await Promise.allSettled([refetchBalance(), refetchActiveLeases(), refetchHistory()]);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Sign in to manage leasing for your wallet.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <div>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Leasing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Delegate your DCC to trusted nodes, monitor active leases, and cancel them any time.
            </Typography>
          </div>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Refresh leasing data">
              <span>
                <IconButton color="primary" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? <CircularProgress size={22} /> : <RefreshOutlined />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {errorMessage && (
          <Alert severity="error" variant="outlined">
            {errorMessage}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  >
                    <ShieldOutlined />
                  </Box>
                  <div>
                    <Typography variant="overline" color="text.secondary">
                      Available Balance
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {formatDcc(availableInDcc, 4)} DCC
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready for leasing
                    </Typography>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'success.main',
                      color: 'success.contrastText',
                    }}
                  >
                    <TrendingUpOutlined />
                  </Box>
                  <div>
                    <Typography variant="overline" color="text.secondary">
                      Currently Leased
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {formatDcc(leasedInDcc, 4)} DCC
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Actively earning
                    </Typography>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'info.main',
                      color: 'info.contrastText',
                    }}
                  >
                    <ShieldOutlined />
                  </Box>
                  <div>
                    <Typography variant="overline" color="text.secondary">
                      Total Balance
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {formatDcc(balanceInDcc + leasedInDcc, 4)} DCC
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available + Leased
                    </Typography>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'warning.main',
                      color: 'warning.contrastText',
                    }}
                  >
                    <HistoryOutlined />
                  </Box>
                  <div>
                    <Typography variant="overline" color="text.secondary">
                      Leasing Records
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {allCount}
                    </Typography>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader
                title="Distribution"
                subheader="Breakdown of available and leased balances"
              />
              <Divider />
              <CardContent>
                <Box sx={{ height: { xs: 320, md: 360 } }}>
                  <LeasingChart
                    available={regularBalance}
                    leasedOut={leasedBalance}
                    leasedIn={0}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader
                title="Start Leasing"
                subheader="Delegate DCC to a node and earn proportional rewards"
              />
              <Divider />
              <CardContent>
                <Stack spacing={2.5}>
                  <TextField
                    label="Node Address"
                    placeholder="3P..."
                    value={recipient}
                    onChange={(event) => {
                      setRecipient(event.target.value);
                      if (recipientError) {
                        validateRecipient(event.target.value);
                      }
                    }}
                    onBlur={() => validateRecipient(recipient)}
                    error={Boolean(recipientError)}
                    helperText={recipientError ?? 'Enter the recipient node address'}
                    fullWidth
                    disabled={leaseMutation.isPending || initialLoading}
                  />

                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <TextField
                        label="Amount (DCC)"
                        type="number"
                        placeholder="0.00000000"
                        value={amount}
                        onChange={(event) => {
                          setAmount(event.target.value);
                          if (amountError) {
                            validateAmount(event.target.value);
                          }
                        }}
                        onBlur={() => validateAmount(amount)}
                        error={Boolean(amountError)}
                        helperText={amountError ?? 'Specify the amount you want to lease'}
                        fullWidth
                        disabled={leaseMutation.isPending || initialLoading}
                        inputProps={{ min: 0, step: 0.00000001 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleMaxAmount}
                        disabled={leaseMutation.isPending || initialLoading}
                      >
                        MAX
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Available: {formatDcc(balanceInDcc, 8)} DCC · Network fee {LEASE_FEE_DCC} DCC
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label="Fixed fee 0.001 DCC"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Funds remain in your control and can be unlocked anytime.
                    </Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    startIcon={
                      leaseMutation.isPending ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <PlayArrowRounded />
                      )
                    }
                    onClick={handleLease}
                    disabled={leaseMutation.isPending || !recipient || !amount}
                    sx={{ alignSelf: 'flex-start', minWidth: 180 }}
                  >
                    {leaseMutation.isPending ? 'Leasing…' : 'Start Lease'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined">
          <CardHeader
            title="Leasing History"
            subheader="Track your active, canceled, and historical leases"
            action={
              <ToggleButtonGroup
                size="small"
                value={filter}
                exclusive
                onChange={handleFilterChange}
              >
                <ToggleButton value="all">All ({allCount})</ToggleButton>
                <ToggleButton value="active">Active ({activeCount})</ToggleButton>
                <ToggleButton value="canceled">Canceled ({canceledCount})</ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <Divider />
          <CardContent>
            {isHistoryLoading && !recentTxs ? (
              <Stack alignItems="center" py={6}>
                <CircularProgress />
              </Stack>
            ) : tableRows.length === 0 ? (
              <Box py={6} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No leasing activity yet. Start a lease to see it appear here.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Node</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((lease) => {
                    const cancelInFlight =
                      cancelLeaseMutation.isPending && cancelLeaseMutation.variables === lease.id;
                    let chipColor: 'success' | 'default' | 'warning' = 'warning';
                    if (lease.status === 'active') {
                      chipColor = 'success';
                    } else if (lease.status === 'cancelled') {
                      chipColor = 'default';
                    }
                    return (
                      <TableRow hover key={lease.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {lease.type.replace('-', ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={lease.recipient || 'Unknown'}>
                            <Typography variant="body2" color="text.secondary">
                              {shortenAddress(lease.recipient)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatDcc(lease.amount / DCC_DECIMALS, 4)} DCC
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(lease.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                            color={chipColor}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {lease.canCancel ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={
                                cancelInFlight ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CancelScheduleSendOutlined fontSize="small" />
                                )
                              }
                              onClick={() => handleCancelLease(lease.id)}
                              disabled={cancelLeaseMutation.isPending}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default Leasing;
