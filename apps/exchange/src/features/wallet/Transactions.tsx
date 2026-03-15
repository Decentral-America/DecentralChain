/**
 * Transactions Component
 * Transaction history table with filtering and pagination
 */

import { useQuery } from '@tanstack/react-query';
import * as ds from 'data-service';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Select } from '@/components/atoms/Select';
import { Spinner } from '@/components/atoms/Spinner';
import { Stack } from '@/components/atoms/Stack';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const TransactionsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: ${(p) => p.theme.spacing.sm};
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;

  th,
  td {
    padding: ${(p) => p.theme.spacing.md} ${(p) => p.theme.spacing.sm};
    text-align: left;
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    min-width: 560px;

    th,
    td {
      padding: ${(p) => p.theme.spacing.sm};
      font-size: 0.8rem;
    }
  }

  th {
    font-weight: ${(p) => p.theme.fontWeights.semibold};
    color: ${(p) => p.theme.colors.text};
    background-color: ${(p) => p.theme.colors.background};
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr {
    transition: ${(p) => p.theme.transitions.fast};
    cursor: pointer;

    &:hover {
      background-color: ${(p) => p.theme.colors.hover};
    }
  }
`;

const TransactionType = styled.span<{ $type: string }>`
  padding: 4px 8px;
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  background-color: ${(p) => {
    switch (p.$type) {
      case 'transfer':
      case 'send':
        return `${p.theme.colors.error}20`;
      case 'receive':
        return `${p.theme.colors.success}20`;
      case 'exchange':
      case 'swap':
        return `${p.theme.colors.info}20`;
      case 'lease':
        return `${p.theme.colors.secondary}20`;
      default:
        return `${p.theme.colors.disabled}20`;
    }
  }};
  color: ${(p) => {
    switch (p.$type) {
      case 'transfer':
      case 'send':
        return p.theme.colors.error;
      case 'receive':
        return p.theme.colors.success;
      case 'exchange':
      case 'swap':
        return p.theme.colors.info;
      case 'lease':
        return p.theme.colors.secondary;
      default:
        return p.theme.colors.disabled;
    }
  }};
`;

const Amount = styled.span<{ $positive: boolean }>`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => (p.$positive ? p.theme.colors.success : p.theme.colors.error)};
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const ErrorMessage = styled.div`
  padding: ${(p) => p.theme.spacing.lg};
  text-align: center;
  color: ${(p) => p.theme.colors.error};
  background-color: ${(p) => p.theme.colors.error}10;
  border-radius: ${(p) => p.theme.radii.md};
`;

const EmptyState = styled.div`
  padding: ${(p) => p.theme.spacing.xl};
  text-align: center;
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  flex-wrap: wrap;
  gap: ${(p) => p.theme.spacing.sm};

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
`;

const PageInfo = styled.span`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
`;

export interface Transaction {
  id: string;
  type: 'transfer' | 'receive' | 'send' | 'exchange' | 'swap' | 'lease' | 'cancel_lease';
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
  typeName: string;
  sender: string;
  recipient?: string;
  amount?: { getTokens: () => { toNumber: () => number } };
  totalAmount?: { getTokens: () => { toNumber: () => number } };
  fee: { getTokens: () => { toNumber: () => number } };
  timestamp: number;
  assetId?: string;
  status: string;
}

const TX_TYPE_MAP: Record<string, Transaction['type']> = {
  cancelLeasing: 'cancel_lease',
  exchange: 'exchange',
  lease: 'lease',
};

function mapBlockchainTransaction(tx: unknown, userAddress: string): Transaction {
  const d = tx as RawTxData;
  let amount = d.amount?.getTokens?.().toNumber() ?? d.totalAmount?.getTokens?.().toNumber() ?? 0;
  const isIncoming = d.recipient === userAddress;
  let txType: Transaction['type'] = TX_TYPE_MAP[d.typeName] ?? 'transfer';

  if (d.typeName === 'transfer') {
    txType = isIncoming ? 'receive' : 'send';
    amount = isIncoming ? Math.abs(amount) : -Math.abs(amount);
  } else if (d.typeName === 'lease') {
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
    status: d.status === 'confirmed' ? 'confirmed' : 'pending',
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

  if (isLoading) {
    return (
      <TransactionsContainer>
        <LoadingWrapper>
          <Spinner size="lg" />
        </LoadingWrapper>
      </TransactionsContainer>
    );
  }

  if (error) {
    return (
      <TransactionsContainer>
        <ErrorMessage>
          Failed to load transactions. Please try again later.
          {error instanceof Error && <div>{error.message}</div>}
        </ErrorMessage>
      </TransactionsContainer>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <TransactionsContainer>
        <Card>
          <EmptyState>No transactions found in your wallet.</EmptyState>
        </Card>
      </TransactionsContainer>
    );
  }

  return (
    <TransactionsContainer>
      <Stack gap="1rem">
        {/* Filters */}
        <FilterBar>
          <Select
            value={limit.toString()}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            options={[
              { label: 'Last 50', value: '50' },
              { label: 'Last 100', value: '100' },
              { label: 'Last 500', value: '500' },
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All Types', value: 'all' },
              { label: 'Send', value: 'send' },
              { label: 'Receive', value: 'receive' },
              { label: 'Exchange', value: 'exchange' },
              { label: 'Lease', value: 'lease' },
            ]}
          />

          <Select
            value={assetFilter}
            onChange={(e) => {
              setAssetFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All Assets', value: 'all' },
              ...uniqueAssets.map((asset) => ({
                label: asset,
                value: asset,
              })),
            ]}
          />

          <Button onClick={handleExport} disabled={isExporting} variant="secondary">
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </FilterBar>

        {/* Transactions Table */}
        <Card>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Asset</th>
                  <th>Fee</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions?.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <TransactionType $type={tx.type}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </TransactionType>
                    </td>
                    <td>
                      <Amount $positive={tx.amount >= 0}>
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount.toFixed(8)}
                      </Amount>
                    </td>
                    <td>{tx.asset}</td>
                    <td>{tx.fee.toFixed(8)}</td>
                    <td>{new Date(tx.timestamp).toLocaleString()}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PageInfo>
                Page {currentPage} of {totalPages} ({filteredTransactions?.length} transactions)
              </PageInfo>
              <PaginationButtons>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </PaginationButtons>
            </Pagination>
          )}
        </Card>
      </Stack>
    </TransactionsContainer>
  );
};
