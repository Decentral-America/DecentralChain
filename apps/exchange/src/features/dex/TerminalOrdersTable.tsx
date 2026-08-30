/**
 * The terminal's orders table.
 *
 * One dense table for the whole bottom rail. `UserOrders` carries its own
 * heading and its own Active/History tabs, which duplicated the rail's tabs
 * and read as a card dropped into a terminal; this renders the same data as a
 * table that belongs to the surface it sits on.
 *
 * Cancelling is not offered here. It needs a signed request, and the signing
 * path for cancels does not exist yet — `UserOrders` blocks it deliberately
 * rather than sending an unsigned one. Showing a dead control would be worse
 * than not showing it.
 */
import { Search, UnfoldMore } from '@mui/icons-material';
import { Box, InputBase, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useUserOrders } from '@/api/services/matcherService';
import { useAuth } from '@/contexts/AuthContext';
import { selectSelectedPair, useDexStore } from '@/stores/dexStore';

const COLUMNS = [
  { align: 'left' as const, key: 'type', label: 'Type' },
  { align: 'left' as const, key: 'time', label: 'Time' },
  { align: 'right' as const, key: 'amount', label: 'Amount' },
  { align: 'right' as const, key: 'price', label: 'Price' },
  { align: 'right' as const, key: 'average', label: 'Average' },
  { align: 'right' as const, key: 'total', label: 'Total' },
  { align: 'right' as const, key: 'filled', label: 'Filled' },
  { align: 'right' as const, key: 'fee', label: 'Fee' },
  { align: 'left' as const, key: 'status', label: 'Status' },
];

const GRID = '150px 70px repeat(8, minmax(0, 1fr))';

interface TerminalOrdersTableProps {
  /** 'open' shows working orders; 'history' shows everything that is done. */
  scope: 'history' | 'open';
}

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      gap: 1,
      justifyContent: 'center',
      py: 6,
    }}
  >
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {message}
    </Typography>
  </Box>
);

export const TerminalOrdersTable: React.FC<TerminalOrdersTableProps> = ({ scope }) => {
  const { isAuthenticated, user } = useAuth();
  const selectedPair = useDexStore(selectSelectedPair);
  const [query, setQuery] = useState('');

  const { data: apiOrders, isLoading } = useUserOrders(
    user?.publicKey || '',
    user?.matcherSign,
    selectedPair?.amountAsset,
    selectedPair?.priceAsset,
    {
      enabled: isAuthenticated && !!user?.publicKey && !!user?.matcherSign?.signature,
      refetchInterval: 10_000,
    },
  );

  const rows = useMemo(() => {
    const orders = apiOrders ?? [];
    const working = ['Accepted', 'PartiallyFilled'];

    const inScope = orders.filter((o) =>
      scope === 'open' ? working.includes(o.status) : !working.includes(o.status),
    );

    const needle = query.trim().toLowerCase();
    if (!needle) return inScope;

    return inScope.filter((o) =>
      `${o.type} ${o.status} ${o.price} ${o.amount}`.toLowerCase().includes(needle),
    );
  }, [apiOrders, query, scope]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'grid',
          flexShrink: 0,
          gap: 1,
          gridTemplateColumns: GRID,
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.5 }}>
          <Search sx={{ color: 'text.disabled', fontSize: 16 }} />
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            sx={{ fontSize: 13 }}
            inputProps={{ 'aria-label': 'Search orders' }}
          />
        </Box>
        {COLUMNS.map((col) => (
          <Box
            key={col.key}
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 0.25,
              justifyContent: col.align === 'left' ? 'flex-start' : 'flex-end',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {col.label}
            </Typography>
            <UnfoldMore sx={{ color: 'text.disabled', fontSize: 12 }} />
          </Box>
        ))}
      </Box>

      <Box
        sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}
      >
        {!isAuthenticated && <EmptyState message="Sign in to see your orders." />}
        {isAuthenticated && isLoading && <EmptyState message="Loading…" />}
        {isAuthenticated && !isLoading && rows.length === 0 && (
          <EmptyState message="Nothing here…" />
        )}

        {rows.map((order) => (
          <Box
            key={order.id}
            sx={{
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              display: 'grid',
              gap: 1,
              gridTemplateColumns: GRID,
              px: 2,
              py: 0.75,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: order.type === 'buy' ? 'info.main' : 'error.main', fontSize: 12 }}
            >
              {order.type === 'buy' ? 'Buy' : 'Sell'}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              {new Date(order.timestamp).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, textAlign: 'right' }}>
              {order.amount}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, textAlign: 'right' }}>
              {order.price}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, textAlign: 'right' }}>
              —
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, textAlign: 'right' }}>
              {Number(order.amount) * Number(order.price)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, textAlign: 'right' }}>
              {order.filled ?? '—'}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, textAlign: 'right' }}>
              —
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              {order.status}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
