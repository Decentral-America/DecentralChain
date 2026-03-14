/**
 * WalletActions Component
 * Action button bar with Send, Receive, and Refresh buttons for wallet operations
 * Provides quick access to core wallet functionality
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { Stack } from '@/components/atoms/Stack';
import { SendAssetModalModern } from './SendAssetModalModern';
import { ReceiveAssetModalModern } from './ReceiveAssetModalModern';

/**
 * Action bar container
 */
const ActionBar = styled.div`
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.background};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/**
 * WalletActions component
 */
export const WalletActions: React.FC = () => {
  const queryClient = useQueryClient();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Handle refresh action
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all wallet-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balances'] }),
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
      ]);
    } finally {
      // Reset loading state after a brief delay for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  /**
   * Handle send button click
   */
  const handleSendClick = () => {
    setShowSendModal(true);
  };

  /**
   * Handle receive button click
   */
  const handleReceiveClick = () => {
    setShowReceiveModal(true);
  };

  return (
    <>
      <ActionBar>
        <Stack direction="row" gap="1rem">
          <Button
            variant="primary"
            onClick={handleSendClick}
            leftIcon={<span>→</span>}
            size="large"
          >
            Send
          </Button>

          <Button
            variant="success"
            onClick={handleReceiveClick}
            leftIcon={<span>←</span>}
            size="large"
          >
            Receive
          </Button>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            loadingText="Refreshing..."
            leftIcon={!isRefreshing ? <span>↻</span> : undefined}
            size="large"
          >
            Refresh
          </Button>
        </Stack>
      </ActionBar>

      {/* Send Modal */}
      {showSendModal && (
        <SendAssetModalModern
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          assetId="DCC"
          assetName="DCC"
          assetDecimals={8}
          availableBalance="0"
        />
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <ReceiveAssetModalModern
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          assetName="DCC"
        />
      )}
    </>
  );
};
