/**
 * UserOrders Component
 * Displays user's active and completed orders with cancel functionality
 * Shows order history with status tracking and order management
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { useCancelOrder, useUserOrders } from '@/api/services/matcherService';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/organisms/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useDexStore } from '@/stores/dexStore';

/**
 * Container
 */
const OrdersContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${(p) => p.theme.colors.background};
`;

/**
 * Header
 */
const Header = styled.div`
  padding: ${(p) => p.theme.spacing.md};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

/**
 * Title
 */
const Title = styled.h3`
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  margin: 0 0 ${(p) => p.theme.spacing.sm} 0;
`;

/**
 * Tab navigation
 */
const Tabs = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
`;

/**
 * Tab button
 */
const Tab = styled.button<{ $isActive: boolean }>`
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => (p.$isActive ? p.theme.colors.primary : p.theme.colors.text)};
  background: ${(p) => (p.$isActive ? `${p.theme.colors.primary}15` : 'transparent')};
  border: none;
  border-bottom: 2px solid ${(p) => (p.$isActive ? p.theme.colors.primary : 'transparent')};
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${(p) => (p.$isActive ? 1 : 0.7)};

  &:hover {
    opacity: 1;
    background: ${(p) => p.theme.colors.primary}15;
  }
`;

/**
 * Orders list
 */
const OrdersList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${(p) => p.theme.spacing.sm};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${(p) => p.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.border};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(p) => p.theme.colors.primary};
  }
`;

/**
 * Order row
 */
const OrderRow = styled.div<{ $type: 'buy' | 'sell' }>`
  display: grid;
  grid-template-columns: 80px 1fr 1fr 1fr 80px 100px;
  gap: ${(p) => p.theme.spacing.sm};
  align-items: center;
  padding: ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.secondary};
  border-left: 3px solid
    ${(p) => (p.$type === 'buy' ? p.theme.colors.success : p.theme.colors.error)};
  border-radius: ${(p) => p.theme.radii.sm};
  margin-bottom: ${(p) => p.theme.spacing.sm};
  font-size: ${(p) => p.theme.fontSizes.sm};

  &:hover {
    background: ${(p) => p.theme.colors.secondary}cc;
  }
`;

/**
 * Order label
 */
const OrderLabel = styled.div`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  margin-bottom: 2px;
`;

/**
 * Order value
 */
const OrderValue = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  font-family: ${(p) => p.theme.fonts.mono};
`;

/**
 * Empty state
 */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${(p) => p.theme.spacing.xl};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
  font-size: ${(p) => p.theme.fontSizes.sm};
  text-align: center;
`;

/**
 * Loading state
 */
const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(p) => p.theme.spacing.xl};
`;

/**
 * Error state
 */
const ErrorState = styled.div`
  padding: ${(p) => p.theme.spacing.md};
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
  text-align: center;
`;

/**
 * Order type badge
 */
const OrderTypeBadge = styled.span<{ $type: 'buy' | 'sell' }>`
  padding: 2px 8px;
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.background};
  background: ${(p) => (p.$type === 'buy' ? p.theme.colors.success : p.theme.colors.error)};
  border-radius: ${(p) => p.theme.radii.sm};
  text-transform: uppercase;
`;

const ConfirmBody = styled.div`
  padding: 16px;
`;

const ConfirmText = styled.p`
  margin-bottom: 16px;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

/**
 * Status badges mapping
 */
const statusColors: Record<string, 'primary' | 'success' | 'error' | 'warning'> = {
  cancelled: 'error',
  filled: 'success',
  partially_filled: 'primary',
  pending: 'warning',
};

/**
 * UserOrders Component
 */
export const UserOrders: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { selectedPair } = useDexStore();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  /**
   * Fetch user orders using real API with polling
   */
  const {
    data: apiOrders,
    isLoading,
    error,
  } = useUserOrders(user?.address || '', selectedPair?.amountAsset, selectedPair?.priceAsset, {
    enabled: isAuthenticated && !!user?.address,
    refetchInterval: 10000,
  });

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
          <Title>Your Orders</Title>
        </Header>
        <EmptyState>Please connect your wallet to view orders</EmptyState>
      </OrdersContainer>
    );
  }

  if (isLoading) {
    return (
      <OrdersContainer>
        <Header>
          <Title>Your Orders</Title>
        </Header>
        <LoadingState>
          <Spinner size="md" />
        </LoadingState>
      </OrdersContainer>
    );
  }

  if (error) {
    return (
      <OrdersContainer>
        <Header>
          <Title>Your Orders</Title>
        </Header>
        <ErrorState>Failed to load orders. Please try again.</ErrorState>
      </OrdersContainer>
    );
  }

  return (
    <OrdersContainer>
      {/* Header with Tabs */}
      <Header>
        <Title>Your Orders</Title>
        <Tabs>
          <Tab $isActive={activeTab === 'active'} onClick={() => setActiveTab('active')}>
            Active ({activeOrders.length})
          </Tab>
          <Tab $isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            History ({historyOrders.length})
          </Tab>
        </Tabs>
      </Header>

      {/* Orders List */}
      <OrdersList>
        {displayOrders.length === 0 ? (
          <EmptyState>
            {activeTab === 'active' ? 'No active orders' : 'No order history'}
          </EmptyState>
        ) : (
          displayOrders.map((order) => (
            <OrderRow key={order.id} $type={order.type}>
              <OrderTypeBadge $type={order.type}>{order.type}</OrderTypeBadge>

              <div>
                <OrderLabel>Price</OrderLabel>
                <OrderValue>{parseFloat(order.price).toFixed(8)}</OrderValue>
              </div>

              <div>
                <OrderLabel>Amount</OrderLabel>
                <OrderValue>{parseFloat(order.amount).toFixed(8)}</OrderValue>
              </div>

              <div>
                <OrderLabel>Filled</OrderLabel>
                <OrderValue>
                  {order.filled
                    ? `${((parseFloat(order.filled) / parseFloat(order.amount)) * 100).toFixed(1)}%`
                    : '0%'}
                </OrderValue>
              </div>

              <div>
                <Badge
                  variant={
                    statusColors[order.status] as 'primary' | 'success' | 'error' | 'warning'
                  }
                  label={order.status}
                />
              </div>

              <div>
                {activeTab === 'active' &&
                  (order.status === 'pending' || order.status === 'partially_filled') && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleCancelOrder(order.id)}
                      isLoading={cancelOrderMutation.isPending && cancellingOrderId === order.id}
                      disabled={cancelOrderMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
              </div>
            </OrderRow>
          ))
        )}
      </OrdersList>

      {/* Cancel Confirmation Modal */}
      {cancellingOrderId && (
        <Modal
          isOpen={!!cancellingOrderId}
          onClose={() => setCancellingOrderId(null)}
          title="Cancel Order"
        >
          <ConfirmBody>
            <ConfirmText>
              Are you sure you want to cancel this order? This action cannot be undone.
            </ConfirmText>
            <ConfirmActions>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCancellingOrderId(null)}
                disabled={cancelOrderMutation.isPending}
              >
                Keep Order
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={confirmCancel}
                isLoading={cancelOrderMutation.isPending}
              >
                Cancel Order
              </Button>
            </ConfirmActions>
          </ConfirmBody>
        </Modal>
      )}
    </OrdersContainer>
  );
};
