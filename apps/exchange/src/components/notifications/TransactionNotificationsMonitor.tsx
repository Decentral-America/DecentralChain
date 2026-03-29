/**
 * Transaction Notification Monitor
 * Listens for incoming transactions and displays toast notifications
 */
import { useCallback, useEffect } from 'react';
import { config } from '@/config';
import { useToast } from '@/contexts/ToastContext';
import {
  type TransactionNotification,
  useIncomingTransactions,
} from '@/features/wallet/useTransactionStream';
import { useAssetDetails } from '@/hooks/useAssetDetails';
import { logger } from '@/lib/logger';

/**
 * Format amount for notification display
 */
const formatNotificationAmount = (amount: number | undefined, decimals: number): string => {
  if (!amount) return '0';

  const divisor = 10 ** decimals;
  const value = amount / divisor;

  // Show up to 8 decimal places, but remove trailing zeros
  return value.toFixed(Math.min(decimals, 8)).replace(/\.?0+$/, '');
};

/**
 * Shorten address for display
 */
const shortenAddress = (address: string, length = 6): string => {
  if (address.length <= length * 2 + 3) {
    return address;
  }
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

/**
 * Transaction Notification Item Component
 * Displays details for a single incoming transaction
 */
interface TransactionNotificationItemProps {
  transaction: TransactionNotification;
}

const TransactionNotificationItem: React.FC<TransactionNotificationItemProps> = ({
  transaction,
}) => {
  // Fetch asset details if assetId is present
  const { displayName, data: assetDetails, isLoading } = useAssetDetails(transaction.assetId);

  // Get decimals (DCC = 8, custom assets = from assetDetails)
  const decimals = assetDetails?.decimals ?? 8;

  // Format amount
  const formattedAmount = formatNotificationAmount(transaction.amount, decimals);

  // Loading state - show asset ID temporarily
  if (isLoading && transaction.assetId) {
    return (
      <div>
        <strong>Incoming Transaction</strong>
        <div>
          {formattedAmount} {transaction.assetId.slice(0, 8)}...
        </div>
        <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
          From: {shortenAddress(transaction.sender)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <strong>Received {displayName}</strong>
      <div style={{ fontSize: '1.1em', fontWeight: 600 }}>
        +{formattedAmount} {displayName}
      </div>
      <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
        From: {shortenAddress(transaction.sender)}
      </div>
      {transaction.confirmations < 1 && (
        <div style={{ fontSize: '0.75em', marginTop: '4px', opacity: 0.6 }}>
          Pending confirmation...
        </div>
      )}
    </div>
  );
};

/**
 * Transaction Notifications Monitor
 * Global component that listens for incoming transactions
 * and shows toast notifications
 *
 * Place this component in MainLayout or App root
 */
export const TransactionNotificationsMonitor: React.FC = () => {
  const toast = useToast();

  // Handle incoming transaction
  const handleIncomingTransaction = useCallback(
    (tx: TransactionNotification) => {
      // Only show notification for confirmed transactions
      // (pending transactions will update when confirmed)
      if (tx.status === 'confirmed' && tx.confirmations >= 1) {
        // Create a custom toast with transaction details
        // Using a key based on transaction ID to prevent duplicates
        const notificationKey = `tx-${tx.id}`;

        // Check if we've already shown this notification (simple deduplication)
        const shownKey = `__shown_${notificationKey}`;
        const windowWithFlags = window as unknown as Window & { [key: string]: boolean };
        if (windowWithFlags[shownKey]) {
          return;
        }
        windowWithFlags[shownKey] = true;

        // Show toast notification
        toast.showSuccess(
          (<TransactionNotificationItem transaction={tx} />) as unknown as string,
          8000, // Show for 8 seconds
        );

        // Play a subtle notification sound if enabled
        try {
          // Browser notification sound (optional)
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Silently fail if audio playback is not allowed
          });
        } catch {
          // Ignore audio errors
        }
      }
    },
    [toast],
  );

  // Subscribe to incoming transactions
  const { isListening } = useIncomingTransactions(handleIncomingTransaction);

  // Log listening status in development
  useEffect(() => {
    if (config.enableDebug) {
      logger.debug('[TransactionNotifications] Listening:', isListening);
    }
  }, [isListening]);

  // This component doesn't render anything visible
  return null;
};
