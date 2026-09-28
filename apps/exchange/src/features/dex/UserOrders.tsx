/**
 * UserOrders Component
 * Displays user's active and completed orders with cancel functionality
 * Shows order history with status tracking and order management
 */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
} from '@mui/material';
import { Clock, History, ListOrdered, ReceiptText, Unplug, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useCancelOrder, useUserOrders } from '@/api/services/matcherService';
import { EmptyState } from '@/components/premium/EmptyState';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import { StatusPill, type StatusTone } from '@/components/premium/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { selectSelectedPair, useDexStore } from '@/stores/dexStore';
import { formatAmount } from '@/utils/formatters';

const OrdersContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${(p) => p.theme.colors.text};
`;

const OrdersList = styled.ul`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  scrollbar-width: thin;
`;

/*
 * A grouped inset row: side mark on the left, price and size as the primary
 * and secondary lines, fill and status on the right. The hairline is inset
 * past the mark, as in an Apple list.
 */
const OrderRow = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-variant-numeric: tabular-nums;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: color-mix(in srgb, ${(p) => p.theme.colors.text} 5%, transparent);
  }

  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 68px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
  }
`;

const SideMark = styled.span<{ $type: 'buy' | 'sell' }>`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  color: ${(p) => (p.$type === 'buy' ? p.theme.colors.buy : p.theme.colors.sell)};
  background: ${(p) =>
    `color-mix(in srgb, ${p.$type === 'buy' ? p.theme.colors.buy : p.theme.colors.sell} 12%, transparent)`};
`;

const Primary = styled.div`
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => p.theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Secondary = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Fill = styled.div`
  text-align: right;
  font-size: 13px;
  color: ${(p) => p.theme.colors.text};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/** The price and size lines; lets them ellipsize inside their grid track. */
const Lines = styled.div`
  min-width: 0;
`;

/** The text column of a loading row, taking the space between mark and pill. */
const Grow = styled.div`
  flex: 1;
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
`;

/**
 * Status badges mapping
 */
const statusTone: Record<string, StatusTone> = {
  cancelled: 'neutral',
  filled: 'success',
  partially_filled: 'accent',
  pending: 'warning',
};

const statusLabel: Record<string, string> = {
  cancelled: 'Cancelled',
  filled: 'Filled',
  partially_filled: 'Partly filled',
  pending: 'Open',
};

/**
 * UserOrders Component
 */
export const UserOrders: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const selectedPair = useDexStore(selectSelectedPair);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  /**
   * Fetch user orders using real API with polling
   */
  const {
    data: apiOrders,
    isLoading,
    error,
  } = useUserOrders(
    user?.publicKey || '',
    user?.matcherSign,
    selectedPair?.amountAsset,
    selectedPair?.priceAsset,
    {
      enabled: isAuthenticated && !!user?.publicKey && !!user?.matcherSign?.signature,
      refetchInterval: 10000,
    },
  );

  /**
   * Transform API orders to component format
   */
  const allOrders = React.useMemo(() => {
    if (!apiOrders) return [];
    return apiOrders.map((order) => ({
      amount: order.amount.toString(),
      filled: order.filled.toString(),
      id: order.id,
      price: order.price.toString(),
      status:
        order.status === 'Accepted'
          ? ('pending' as const)
          : order.status === 'PartiallyFilled'
            ? ('partially_filled' as const)
            : order.status === 'Filled'
              ? ('filled' as const)
              : ('cancelled' as const),
      timestamp: order.timestamp,
      type: order.type,
    }));
  }, [apiOrders]);

  /**
   * Filter orders by tab
   */
  const activeOrders = allOrders.filter(
    (order) => order.status === 'pending' || order.status === 'partially_filled',
  );
  const historyOrders = allOrders.filter(
    (order) => order.status === 'filled' || order.status === 'cancelled',
  );

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  /**
   * Cancel order mutation using real API
   */
  const cancelOrderMutation = useCancelOrder();

  /**
   * Handle cancel order
   */
  const handleCancelOrder = (orderId: string) => {
    setCancellingOrderId(orderId);
  };

  /**
   * Confirm cancel
   * SECURITY: Order cancellation requires a valid signature.
   * Without transaction signing support, cancellation is blocked to
   * prevent sending unsigned requests to the matcher.
   */
  const confirmCancel = () => {
    if (cancellingOrderId && user?.address) {
      // Block unsigned cancel — matcher should reject empty signatures,
      // but we enforce it client-side as defense in depth
      logger.error(
        'Order cancellation blocked: transaction signing not yet implemented. ' +
          'Cannot send unsigned cancel requests to matcher.',
      );
      setCancellingOrderId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <OrdersContainer>
        <Header>
          <Title>Your orders</Title>
        </Header>
        <EmptyState
          compact
          icons={[Wallet]}
          title="Please connect your wallet to view orders"
          description="Your open and filled orders for this pair appear here."
        />
      </OrdersContainer>
    );
  }

  if (isLoading) {
    return (
      <OrdersContainer aria-busy="true">
        <Header>
          <Title>Your orders</Title>
        </Header>
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i}>
            <Skeleton variant="circular" width={40} height={40} />
            <Grow>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="25%" />
            </Grow>
            <Skeleton variant="text" width={56} />
          </SkeletonRow>
        ))}
      </OrdersContainer>
    );
  }

  if (error) {
    return (
      <OrdersContainer>
        <Header>
          <Title>Your orders</Title>
        </Header>
        <EmptyState
          compact
          icons={[Unplug]}
          title="Failed to load orders. Please try again."
          description="The matcher did not answer. This list retries on its own."
        />
      </OrdersContainer>
    );
  }

  const quote = selectedPair?.priceAssetName ?? '';
  const base = selectedPair?.amountAssetName ?? '';

  return (
    <OrdersContainer>
      <Header>
        <Title>Your orders</Title>
        <SegmentedControl
          size="sm"
          label="Order status"
          value={activeTab}
          onValueChange={setActiveTab}
          options={[
            { label: `Active (${activeOrders.length})`, value: 'active' },
            { label: `History (${historyOrders.length})`, value: 'history' },
          ]}
        />
      </Header>

      {displayOrders.length === 0 ? (
        <EmptyState
          compact
          icons={activeTab === 'active' ? [ListOrdered, Clock, ReceiptText] : [History]}
          title={activeTab === 'active' ? 'No active orders' : 'No order history'}
          description={
            activeTab === 'active'
              ? 'Orders you place that have not filled yet wait here.'
              : 'Filled and cancelled orders are listed here.'
          }
        />
      ) : (
        <OrdersList>
          {displayOrders.map((order) => (
            <OrderRow key={order.id}>
              <SideMark $type={order.type}>{order.type}</SideMark>

              <Lines>
                <Primary>
                  {formatAmount(parseFloat(order.amount))} {base}
                </Primary>
                <Secondary>
                  at {formatAmount(parseFloat(order.price))} {quote}
                </Secondary>
              </Lines>

              <Fill>
                {order.filled
                  ? `${((parseFloat(order.filled) / parseFloat(order.amount)) * 100).toFixed(1)}%`
                  : '0%'}
                <Secondary>filled</Secondary>
              </Fill>

              <Actions>
                <StatusPill tone={statusTone[order.status] ?? 'neutral'}>
                  {statusLabel[order.status] ?? order.status}
                </StatusPill>
                {activeTab === 'active' &&
                  (order.status === 'pending' || order.status === 'partially_filled') && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancelOrderMutation.isPending}
                    >
                      {cancelOrderMutation.isPending && cancellingOrderId === order.id
                        ? 'Cancelling'
                        : 'Cancel'}
                    </Button>
                  )}
              </Actions>
            </OrderRow>
          ))}
        </OrdersList>
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setCancellingOrderId(null)}
            disabled={cancelOrderMutation.isPending}
          >
            Keep Order
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmCancel}
            disabled={cancelOrderMutation.isPending}
          >
            Cancel Order
          </Button>
        </DialogActions>
      </Dialog>
    </OrdersContainer>
  );
};
