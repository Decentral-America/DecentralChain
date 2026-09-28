/**
 * Transactions
 *
 * History as a grouped list by day, the way Wallet shows it: a direction glyph,
 * what happened and with whom, and the amount on the right. Amounts are
 * coloured only when colour means something (money in is green; money out
 * stays in the text colour), loading draws skeleton rows shaped like the list,
 * and an empty account gets an empty state that says what will appear.
 */

import { Alert, Box, Button, MenuItem, Pagination, Select } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import * as ds from 'data-service';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  Lock,
  LockOpen,
  Receipt,
} from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { EmptyState } from '@/components/premium/EmptyState';
import {
  InsetGroup,
  InsetRow,
  InsetRowSkeleton,
  TokenAvatar,
} from '@/components/premium/InsetList';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { formatAmount } from '@/utils/formatters';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const DayLabel = styled.h3`
  margin: 20px 4px 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:first-of-type {
    margin-top: 0;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-variant-numeric: tabular-nums;
`;

const TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'send' },
  { label: 'Received', value: 'receive' },
  { label: 'Exchange', value: 'exchange' },
  { label: 'Lease', value: 'lease' },
];

const TYPE_LABEL: Record<string, string> = {
  cancel_lease: 'Lease cancelled',
  exchange: 'Exchange',
  lease: 'Leased',
  receive: 'Received',
  send: 'Sent',
  swap: 'Swap',
  transfer: 'Transfer',
};

function typeIcon(type: string): ReactNode {
  switch (type) {
    case 'receive':
      return <ArrowDownLeft />;
    case 'send':
    case 'transfer':
      return <ArrowUpRight />;
    case 'exchange':
    case 'swap':
      return <ArrowLeftRight />;
    case 'lease':
      return <Lock />;
    case 'cancel_lease':
      return <LockOpen />;
    default:
      return <Receipt />;
  }
}

function shortAddress(a?: string) {
  if (!a) return '';
  return a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

/** "Today", "Yesterday", or the date, for a day heading. */
function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

/** "Send", "Set Asset Script": the display form of a transaction type. */
function typeLabel(type: string): string {
  return (
    TYPE_LABEL[type] ??
    type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

/**
 * One transaction as a list row: direction, counterparty and time, amount.
 * The whole row is a button that opens the transaction's full record.
 */
function TxRow({
  tx,
  assetName,
  onOpen,
}: {
  tx: Transaction;
  assetName: string;
  onOpen: () => void;
}) {
  const incoming = tx.amount > 0 && tx.type === 'receive';
  let counterparty = '';
  if (tx.type === 'receive') counterparty = `From ${shortAddress(tx.sender)}`;
  else if (tx.recipient) counterparty = `To ${shortAddress(tx.recipient)}`;
  const time = new Date(tx.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  let sign = '';
  if (tx.amount > 0) sign = '+';
  else if (tx.amount < 0) sign = '−';
  return (
    <InsetRow
      onClick={onOpen}
      aria-label={`Show details for this ${tx.type.replace(/_/g, ' ')} transaction`}
      leading={<TokenAvatar icon={typeIcon(tx.type)} />}
      title={typeLabel(tx.type)}
      subtitle={[counterparty, time, tx.status === 'pending' ? 'Pending' : '']
        .filter(Boolean)
        .join(' · ')}
      value={`${sign}${formatAmount(Math.abs(tx.amount))}`}
      valueTone={incoming ? 'buy' : undefined}
      valueSub={`${assetName} · fee ${formatAmount(tx.fee)}`}
    />
  );
}

export interface Transaction {
  id: string;
  type:
    | 'transfer'
    | 'receive'
    | 'send'
    | 'exchange'
    | 'swap'
    | 'lease'
    | 'cancel_lease'
    | 'issue'
    | 'reissue'
    | 'burn'
    | 'data'
    | 'set_script'
    | 'set_asset_script'
    | 'mass_transfer'
    | 'create_alias'
    | 'invoke_script'
    | 'update_asset_info'
    | 'sponsorship'
    | 'genesis'
    | 'payment'
    | 'ethereum_tx'
    | 'unknown';
  typeName?: string;
  amount: number;
  asset: string;
  assetId: string;
  timestamp: number;
  fee: number;
  recipient?: string;
  sender?: string;
  status: 'confirmed' | 'pending' | 'failed';
}

const ITEMS_PER_PAGE = 10;

interface RawTxData {
  id: string;
  type: number;
  sender: string;
  recipient?: string;
  amount?: { getTokens: () => { toNumber: () => number } };
  totalAmount?: { getTokens: () => { toNumber: () => number } };
  fee: { getTokens: () => { toNumber: () => number } };
  timestamp: number;
  assetId?: string;
  isUTX: boolean;
}

// Maps numeric transaction type → display type. Source: TRANSACTION_TYPE_NUMBER constants.
const TX_TYPE_MAP: Record<number, Transaction['type']> = {
  1: 'genesis',
  2: 'transfer', // SEND_OLD → handled below as send/receive
  3: 'issue',
  4: 'transfer', // handled below → send/receive
  5: 'reissue',
  6: 'burn',
  7: 'exchange',
  8: 'lease',
  9: 'cancel_lease',
  10: 'create_alias',
  11: 'mass_transfer',
  12: 'data',
  13: 'set_script',
  14: 'sponsorship',
  15: 'set_asset_script',
  16: 'invoke_script',
  17: 'update_asset_info',
  18: 'ethereum_tx',
};

function mapBlockchainTransaction(tx: unknown, userAddress: string): Transaction {
  const d = tx as RawTxData;
  let amount = d.amount?.getTokens?.().toNumber() ?? d.totalAmount?.getTokens?.().toNumber() ?? 0;
  const isIncoming = d.recipient === userAddress;
  let txType: Transaction['type'] = TX_TYPE_MAP[d.type] ?? 'unknown';

  if (d.type === 4 || d.type === 2) {
    txType = isIncoming ? 'receive' : 'send';
    amount = isIncoming ? Math.abs(amount) : -Math.abs(amount);
  } else if (d.type === 8) {
    amount = -Math.abs(amount);
  }

  const assetId = d.assetId || 'DCC';
  return {
    amount,
    asset: assetId === 'DCC' ? 'DCC' : assetId,
    assetId,
    fee: d.fee.getTokens().toNumber(),
    id: d.id,
    recipient: d.recipient ?? '',
    sender: d.sender,
    status: d.isUTX ? 'pending' : 'confirmed',
    timestamp: d.timestamp,
    type: txType,
  };
}

export const Transactions = () => {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  /*
   * The rows have carried `cursor: pointer` and a hover state since this table
   * was written, with nothing behind them. The id of the row someone actually
   * opened lives here; the dialog fetches the full record for it.
   */
  const [openTxId, setOpenTxId] = useState<string | null>(null);

  // Fetch transactions from blockchain with React Query
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery<Transaction[]>({
    enabled: !!user?.address,
    queryFn: async () => {
      if (!user?.address) return [];

      // Fetch transactions from blockchain (ds.api.transactions.list)
      // after parameter is optional - empty string for first page
      const txList = await ds.api.transactions.list(user.address, limit, '');

      // Map blockchain transactions to our Transaction interface
      return txList.map((tx: unknown) => mapBlockchainTransaction(tx, user.address));
    },
    queryKey: ['transactions', user?.address, limit],
    refetchInterval: 4000, // Refetch every 4 seconds (matches Angular)
    staleTime: 3000, // Consider data fresh for 3 seconds
  });

  // Filter transactions
  const filteredTransactions = transactions?.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (assetFilter !== 'all' && tx.assetId !== assetFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil((filteredTransactions?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Get unique assets for filter
  const uniqueAssets = Array.from(new Set(transactions?.map((tx) => tx.assetId) || []));

  // Resolve asset names for non-DCC assets
  const nonDccAssetIds = uniqueAssets.filter((id) => id !== 'DCC');
  const { data: assetDetails } = useMultipleAssetDetails(nonDccAssetIds);
  const assetNameMap = useMemo(() => {
    const map: Record<string, string> = { DCC: 'DCC' };
    assetDetails?.forEach((d) => {
      if (d?.assetId && d?.name) map[d.assetId] = d.name;
    });
    return map;
  }, [assetDetails]);

  // CSV Export Handler
  const handleExport = useCallback(async () => {
    if (!user?.address || isExporting) return;

    setIsExporting(true);

    try {
      const allTransactions: Array<{
        id: string;
        typeName: string;
        amount: number;
        assetId: string;
        fee: number;
        timestamp: number;
        sender: string;
        recipient?: string;
      }> = [];
      const MAX_LIMIT = 1000;
      const MAX_TOTAL = 10000;
      let after = '';

      // Fetch all transactions in batches
      while (allTransactions.length < MAX_TOTAL) {
        const txList = await ds.api.transactions.list(user.address, MAX_LIMIT, after);

        const mapped = txList.map((tx: unknown) => {
          const txData = tx as {
            id: string;
            typeName: string;
            sender: string;
            recipient?: string;
            amount?: { getTokens: () => { toNumber: () => number } };
            totalAmount?: { getTokens: () => { toNumber: () => number } };
            fee: { getTokens: () => { toNumber: () => number } };
            timestamp: number;
            assetId?: string;
          };

          let amount = 0;
          if (txData.amount?.getTokens) {
            amount = txData.amount.getTokens().toNumber();
          } else if (txData.totalAmount?.getTokens) {
            amount = txData.totalAmount.getTokens().toNumber();
          }

          return {
            amount,
            assetId: txData.assetId || 'DCC',
            fee: txData.fee.getTokens().toNumber(),
            id: txData.id,
            sender: txData.sender,
            timestamp: txData.timestamp,
            typeName: txData.typeName,
            ...(txData.recipient != null && { recipient: txData.recipient }),
          };
        });

        allTransactions.push(...mapped);

        if (txList.length < MAX_LIMIT) break;
        after = (txList[txList.length - 1] as { id: string }).id;
      }

      if (allTransactions.length === 0) {
        alert('No transactions to export');
        setIsExporting(false);
        return;
      }

      // Generate CSV
      const headers = ['Date', 'Type', 'Amount', 'Asset', 'Fee', 'Sender', 'Recipient', 'ID'];
      const rows = allTransactions.map((tx) => [
        new Date(tx.timestamp).toISOString(),
        tx.typeName,
        tx.amount.toFixed(8),
        tx.assetId,
        tx.fee.toFixed(8),
        tx.sender || '-',
        tx.recipient || '-',
        tx.id,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${user.address}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`Exported ${allTransactions.length} transactions`);
    } catch (error) {
      logger.error('[Transactions] Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [user?.address, isExporting]);

  const groups = useMemo(() => {
    const out: { label: string; items: Transaction[] }[] = [];
    for (const tx of paginatedTransactions ?? []) {
      const label = dayLabel(tx.timestamp);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(tx);
      else out.push({ items: [tx], label });
    }
    return out;
  }, [paginatedTransactions]);

  if (isLoading) {
    return (
      <Box aria-busy="true" aria-label="Loading transactions">
        <InsetGroup>
          <InsetRowSkeleton rows={6} />
        </InsetGroup>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load transactions. Please try again later.
        {error instanceof Error && <div>{error.message}</div>}
      </Alert>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <InsetGroup>
        <EmptyState
          icons={[ArrowDownLeft, Receipt, ArrowUpRight]}
          title="No transactions yet"
          description="Transfers, exchanges and leases on this account will be listed here by day as they confirm."
        />
      </InsetGroup>
    );
  }

  return (
    <Box>
      <Toolbar>
        <SegmentedControl
          size="sm"
          label="Transaction type"
          options={TYPE_OPTIONS}
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setCurrentPage(1);
          }}
        />
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Select
            size="small"
            value={assetFilter}
            inputProps={{ 'aria-label': 'Asset' }}
            onChange={(e) => {
              setAssetFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <MenuItem value="all">All assets</MenuItem>
            {uniqueAssets.map((asset) => (
              <MenuItem key={asset} value={asset}>
                {assetNameMap[asset] ?? asset}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={limit.toString()}
            inputProps={{ 'aria-label': 'How many to load' }}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <MenuItem value="50">Last 50</MenuItem>
            <MenuItem value="100">Last 100</MenuItem>
            <MenuItem value="500">Last 500</MenuItem>
          </Select>
          <Button
            variant="outlined"
            onClick={handleExport}
            disabled={isExporting}
            startIcon={<Download size={16} />}
          >
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Box>
      </Toolbar>

      {groups.length === 0 ? (
        <InsetGroup>
          <EmptyState
            compact
            icons={[Receipt]}
            title="Nothing matches these filters"
            description="Try another type or asset."
          />
        </InsetGroup>
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <DayLabel>{group.label}</DayLabel>
            <InsetGroup>
              {group.items.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  assetName={assetNameMap[tx.assetId] ?? tx.assetId}
                  onOpen={() => setOpenTxId(tx.id)}
                />
              ))}
            </InsetGroup>
          </section>
        ))
      )}

      {totalPages > 1 && (
        <Footer>
          <span>
            Page {currentPage} of {totalPages} · {filteredTransactions?.length} transactions
          </span>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, p) => setCurrentPage(p)}
            shape="rounded"
            size="small"
          />
        </Footer>
      )}

      {openTxId && <TransactionDetailsDialog txId={openTxId} onClose={() => setOpenTxId(null)} />}
    </Box>
  );
};
