/**
 * Leasing Component
 * Interface for staking DCC with nodes and viewing active leases
 * Allows users to create lease transactions and cancel active leases
 */

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ds from 'data-service';
import { History, Lock, LockOpen, RefreshCw, Server } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import styled from 'styled-components';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { AmountField } from '@/components/premium/AmountField';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { EmptyState } from '@/components/premium/EmptyState';
import { HoldToConfirm } from '@/components/premium/HoldToConfirm';
import { InsetLabelField } from '@/components/premium/InsetLabelField';
import {
  DetailGroup,
  DetailRow,
  InsetGroup,
  InsetGroupHeader,
  InsetRow,
  InsetRowSkeleton,
  TokenAvatar,
} from '@/components/premium/InsetList';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { chrome } from '@/styles/tokens';
import { formatAmount, formatDcc, shortenAddress, toTimestamp } from '@/utils/formatters';
import {
  broadcastTransaction,
  createCancelLeaseTransaction,
  createLeaseTransaction,
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
  /** Present on lease-cancel transactions from the recent-tx API */
  transfer?: unknown;
  // Additional fields may be returned from recent transactions API
  [key: string]: unknown;
}

/**
 * Filter options for lease list
 */
type LeaseFilter = 'all' | 'active' | 'canceled';

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Figure = styled.div`
  strong {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: ${({ theme }) => theme.colors.text};
  }

  strong small {
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  > span {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Dot = styled.i<{ $tone: 'accent' | 'muted' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $tone }) => ($tone === 'accent' ? theme.colors.primary : theme.colors.textSubtle)};
`;

/** Available against leased, as one bar; an empty account draws the bare track. */
const Allocation = styled.div`
  display: flex;
  gap: 2px;
  height: 8px;
  margin-top: 20px;
  border-radius: 4px;
  overflow: hidden;
  background: ${({ theme }) => chrome[theme.mode].fill};

  i {
    display: block;
    height: 100%;
    transition: flex-grow 420ms cubic-bezier(0.32, 0.72, 0, 1);
  }
`;

const Columns = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;

  @media (min-width: 1100px) {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  }
`;

const FormTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text};
`;

const FormNote = styled.p`
  margin: 4px 0 20px;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** Filled chip colour per lease status; see the note where it is drawn. */
const STATUS_CHIP_COLOR = {
  active: 'success',
  cancelled: 'default',
  pending: 'warning',
} as const;

const TYPE_LABEL: Record<string, string> = {
  'cancel-leasing': 'Lease cancelled',
  lease: 'Lease',
  'lease-in': 'Lease in',
  'lease-out': 'Lease out',
};

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
  const [cancelLeaseId, setCancelLeaseId] = useState<string | null>(null);

  // Use balance watcher hook for real-time balance updates
  const {
    balances,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching,
    error: balanceError,
    forceRefresh: refetchBalance,
  } = useBalanceWatcher({
    enabled: Boolean(user?.address),
    interval: 3000, // Poll every 3 seconds
  });

  const {
    data: activeLeases,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching,
    error: activeError,
    refetch: refetchActiveLeases,
  } = useQuery<Lease[], Error>({
    enabled: Boolean(user?.address),
    queryFn: async () => {
      if (!user?.address) throw new Error('No address');
      const response = await fetch(`${ds.config.get('node')}/leasing/active/${user.address}`);
      if (!response.ok) throw new Error('Failed to fetch active leases');
      const data = await response.json();
      return data.map((lease: Lease) => ({ ...lease, status: 'active' as const }));
    },
    queryKey: ['active-leases', user?.address],
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const {
    data: recentTxs,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<unknown[], Error>({
    enabled: Boolean(user?.address),
    queryFn: async () => {
      if (!user?.address) throw new Error('No address');
      return ds.api.transactions.list(user.address, 500, '');
    },
    queryKey: ['lease-transactions', user?.address],
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const leaseMutation = useMutation<{ id: string }, Error>({
    mutationFn: async () => {
      if (!user?.address) throw new Error('Not authenticated');
      if (!user?.seed) throw new Error('Seed not available. Please log in again.');

      const amountInWavelets = Math.floor(parseFloat(amount) * DCC_DECIMALS);
      const tx = await createLeaseTransaction({ amount: amountInWavelets, recipient }, user.seed);

      return broadcastTransaction(tx);
    },
    onError: (error) => {
      alert(`Lease failed: ${error.message}`);
    },
    onSuccess: () => {
      setRecipient('');
      setAmount('');
      setRecipientError(null);
      setAmountError(null);

      void queryClient.invalidateQueries({ queryKey: ['balances', user?.address] });
      void queryClient.invalidateQueries({ queryKey: ['active-leases', user?.address] });
      void queryClient.invalidateQueries({ queryKey: ['lease-transactions', user?.address] });
    },
  });

  const cancelLeaseMutation = useMutation<{ id: string }, Error, string>({
    mutationFn: async (leaseId: string) => {
      if (!user?.address) throw new Error('Not authenticated');
      if (!user?.seed) throw new Error('Seed not available. Please log in again.');
      const tx = await createCancelLeaseTransaction(leaseId, user.seed);
      return broadcastTransaction(tx);
    },
    onError: (error) => {
      alert(`Cancel lease failed: ${error.message}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['balances', user?.address] });
      void queryClient.invalidateQueries({ queryKey: ['active-leases', user?.address] });
      void queryClient.invalidateQueries({ queryKey: ['lease-transactions', user?.address] });
    },
  });

  // Extract balance values from balance watcher
  // 'regular' is everything this address owns, leased or not.
  // 'available' is regular minus what is leased out: what can be leased now.
  // 'leaseOut' is derived by the address service (the node omits it).
  // 'generating' is the forging balance and says nothing about leases.
  const regularBalance = balances?.regular ?? 0; // Total owned
  const leasedBalance = balances?.leaseOut ?? 0; // Currently leased out
  const availableBalance = balances?.available ?? regularBalance; // Available for new leases

  const balanceInDcc = regularBalance / DCC_DECIMALS; // Total owned in DCC
  const leasedInDcc = leasedBalance / DCC_DECIMALS; // Leased out in DCC
  const availableInDcc = availableBalance / DCC_DECIMALS; // Available for new leases

  const allLeasingTxs = useMemo(() => {
    if (!recentTxs) return [];

    const LEASE_TYPES = ['lease-in', 'lease-out', 'cancel-leasing'];
    const filtered = (recentTxs as Lease[]).filter((tx) => LEASE_TYPES.includes(tx.typeName ?? ''));

    if (!activeLeases?.length) return filtered;

    const idHash = filtered.reduce(
      (acc, tx) => {
        acc[tx.id] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    const merged = [...filtered];
    activeLeases.forEach((tx) => {
      if (!idHash[tx.id]) {
        merged.push(tx);
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
            tx.typeName === 'cancel-leasing',
        );
      default:
        return list;
    }
  }, [allLeasingTxs, filter]);

  const tableRows = useMemo(() => {
    return (leases as Lease[]).map((lease) => {
      const transfer = lease.transfer as
        | { amount?: { getTokens?: () => { toNumber?: () => number } }; recipient?: string }
        | undefined;
      const rawAmount = (() => {
        if (typeof lease.amount === 'number') {
          return lease.amount;
        }

        const tokens = transfer?.amount?.getTokens?.()?.toNumber?.();
        return (tokens as number | undefined) ?? 0;
      })();
      const recipientValue = lease.recipient || (transfer?.recipient as string | undefined) || '';
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
        amount: rawAmount,
        canCancel: status === 'active' && lease.typeName !== 'cancel-leasing',
        id: lease.id,
        recipient: recipientValue,
        status,
        timestamp: toTimestamp(lease.timestamp),
        type: lease.typeName || 'lease',
      };
    });
  }, [leases]);

  const allCount = allLeasingTxs?.length ?? 0;
  const activeCount =
    (allLeasingTxs as Lease[] | undefined)?.filter(
      (tx) => tx.status === 'active' || tx.typeName === 'lease-out',
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
      setAmountError(
        `Insufficient balance (including fee). Available: ${formatAmount(availableInDcc)} DCC`,
      );
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
    setCancelLeaseId(leaseId);
  };

  const handleConfirmCancel = () => {
    if (cancelLeaseId) {
      cancelLeaseMutation.mutate(cancelLeaseId);
    }
    setCancelLeaseId(null);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    await Promise.allSettled([refetchBalance(), refetchActiveLeases(), refetchHistory()]);
  };

  if (!user) {
    return (
      <Alert severity="info" sx={{ maxWidth: 'md', mx: 'auto', my: 8 }}>
        Sign in to manage leasing for your wallet.
      </Alert>
    );
  }

  // Leased DCC is still owned, so the total is regular, not regular + leased.
  const totalInDcc = balanceInDcc;
  const busy = leaseMutation.isPending || initialLoading;

  const figure = (value: number, label: ReactNode) => (
    <Figure>
      <strong>
        {isBalanceLoading ? (
          <Skeleton width={140} height={34} />
        ) : (
          <>
            <AnimatedNumber value={value} decimals={4} />
            <small>DCC</small>
          </>
        )}
      </strong>
      <span>{label}</span>
    </Figure>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Card sx={{ p: 3 }}>
        <Summary>
          {figure(
            availableInDcc,
            <>
              <Dot $tone="accent" aria-hidden />
              Available to lease
            </>,
          )}
          {figure(
            leasedInDcc,
            <>
              <Dot $tone="muted" aria-hidden />
              Leased to nodes
            </>,
          )}
          {figure(totalInDcc, 'Total, available and leased')}
        </Summary>
        <Allocation
          role="img"
          aria-label={
            totalInDcc > 0
              ? `${Math.round((leasedInDcc / totalInDcc) * 100)}% of your DCC is leased`
              : 'No DCC to lease yet'
          }
        >
          {totalInDcc > 0 ? (
            <>
              <i style={{ background: 'var(--color-indigo-ink)', flexGrow: availableInDcc }} />
              <i style={{ background: 'var(--text-subtle)', flexGrow: leasedInDcc }} />
            </>
          ) : null}
        </Allocation>
      </Card>

      <Columns>
        <Card sx={{ p: 3 }}>
          <FormTitle>Start a lease</FormTitle>
          <FormNote>
            Delegate DCC to a node. The funds stay in your wallet and you can cancel the lease at
            any time.
          </FormNote>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <InsetLabelField
              label="Node address"
              placeholder="3P…"
              mono
              spellCheck={false}
              autoComplete="off"
              value={recipient}
              onChange={(value) => {
                setRecipient(value);
                if (recipientError) {
                  validateRecipient(value);
                }
              }}
              onBlur={() => validateRecipient(recipient)}
              invalid={Boolean(recipientError)}
              hint={recipientError ?? undefined}
              disabled={busy}
            />

            <AmountField
              label="Amount to lease"
              symbol="DCC"
              value={amount}
              onChange={(value) => {
                setAmount(value);
                if (amountError) {
                  validateAmount(value);
                }
              }}
              onBlur={() => validateAmount(amount)}
              available={`${formatDcc(availableInDcc, 8)} DCC`}
              onMax={handleMaxAmount}
              error={amountError}
              disabled={busy}
            />

            <DetailGroup>
              <DetailRow label="Node">{recipient ? shortenAddress(recipient) : '—'}</DetailRow>
              <DetailRow label="Amount">{amount ? `${amount} DCC` : '—'}</DetailRow>
              <DetailRow label="Network fee">{LEASE_FEE_DCC} DCC</DetailRow>
            </DetailGroup>

            <HoldToConfirm
              fullWidth
              onConfirm={handleLease}
              pending={leaseMutation.isPending}
              pendingLabel="Leasing…"
              confirmLabel="Signing"
              disabled={leaseMutation.isPending || !recipient || !amount}
            >
              Hold to start lease
            </HoldToConfirm>
          </Box>
        </Card>

        <section aria-labelledby="lease-history">
          <InsetGroupHeader
            id="lease-history"
            title="History"
            count={allCount}
            trailing={
              <>
                <SegmentedControl
                  size="sm"
                  label="Filter leases"
                  value={filter}
                  onValueChange={(v) => setFilter(v as LeaseFilter)}
                  options={[
                    { label: 'All', value: 'all' },
                    { label: `Active ${activeCount}`, value: 'active' },
                    { label: `Canceled ${canceledCount}`, value: 'canceled' },
                  ]}
                />
                <Tooltip title="Refresh leasing data">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Refresh leasing data"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw size={16} />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            }
          />
          <InsetGroup>
            {isHistoryLoading && !recentTxs ? (
              <InsetRowSkeleton rows={3} />
            ) : tableRows.length === 0 ? (
              <EmptyState
                icons={[Server, Lock, History]}
                title="No leases yet"
                description="Start a lease and it will be listed here, with a way to cancel it."
              />
            ) : (
              tableRows.map((lease) => {
                const cancelInFlight =
                  cancelLeaseMutation.isPending && cancelLeaseMutation.variables === lease.id;
                return (
                  <InsetRow
                    key={lease.id}
                    leading={
                      <TokenAvatar icon={lease.status === 'cancelled' ? <LockOpen /> : <Lock />} />
                    }
                    title={TYPE_LABEL[lease.type] ?? lease.type.replace('-', ' ')}
                    subtitle={
                      <>
                        {/* The full node address stays one hover away. */}
                        <Tooltip title={lease.recipient || 'Unknown'}>
                          <span>{shortenAddress(lease.recipient) || 'Unknown node'}</span>
                        </Tooltip>
                        {' · '}
                        {new Date(lease.timestamp).toLocaleString(undefined, {
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                        })}
                      </>
                    }
                    value={`${formatDcc(lease.amount / DCC_DECIMALS, 4)} DCC`}
                    valueSub={
                      /*
                       * Filled, not a tint. Intent-coloured ink on a light
                       * wash (an outlined chip on a hover fill, or a 10% tint
                       * of itself) measured under the 4.5:1 AA floor for
                       * warning and success in light mode. A filled chip
                       * carries its own `intent.*` fill with the matching
                       * verified `intent.on*` ink, so whatever sits under the
                       * row stops mattering.
                       *
                       * The fill is restated here because the theme's
                       * `MuiChip.filled` override repaints every filled chip
                       * with the neutral translucent `chrome.fill`, coloured
                       * ones included, which left the `intent.on*` ink on a
                       * grey wash (1.15:1 light, 1.65:1 dark).
                       */
                      <Chip
                        size="small"
                        label={lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                        color={STATUS_CHIP_COLOR[lease.status]}
                        sx={
                          STATUS_CHIP_COLOR[lease.status] === 'default'
                            ? undefined
                            : { bgcolor: `${STATUS_CHIP_COLOR[lease.status]}.main` }
                        }
                      />
                    }
                    accessory={
                      lease.canCancel ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          // The theme's outlined button paints its own
                          // translucent `chrome.fill`, and `intent.danger` on
                          // it is under 4.5:1 (3.75:1 dark at rest, 4.32:1
                          // light on hover). The alert set's deeper danger
                          // ink keeps the red and clears AA on both fills.
                          sx={(theme) => ({ color: chrome[theme.palette.mode].alert.error.fg })}
                          onClick={() => handleCancelLease(lease.id)}
                          disabled={cancelLeaseMutation.isPending}
                          startIcon={
                            cancelInFlight ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : undefined
                          }
                        >
                          Cancel
                        </Button>
                      ) : undefined
                    }
                  />
                );
              })
            )}
          </InsetGroup>
        </section>
      </Columns>

      <ConfirmDialog
        open={!!cancelLeaseId}
        onClose={() => setCancelLeaseId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Lease"
        message="Are you sure you want to cancel this lease?"
        confirmText="Cancel Lease"
        destructive
      />
    </Box>
  );
};
