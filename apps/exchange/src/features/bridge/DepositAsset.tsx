/**
 * DepositAsset Modal Component
 * Modal dialog for depositing external assets (BTC) to DecentralChain
 * Displays deposit address with QR code, instructions, amounts, fees, and expiry countdown
 */

import { AccessTime, InfoOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGateway } from '@/hooks/useGateway';
import { logger } from '@/lib/logger';
import { type DepositDetails } from '@/services/gateway/types';
import { DepositAddress } from './DepositAddress';

interface DepositAssetProps {
  /** Asset to deposit */
  asset: {
    id: string;
    name: string;
    ticker: string;
  };
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal closes */
  onClose: () => void;
}

/**
 * Format time remaining in minutes and seconds
 */
const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

/**
 * DepositAsset modal for bridging external assets to DecentralChain
 */
export const DepositAsset: React.FC<DepositAssetProps> = ({ asset, open, onClose }) => {
  const { user } = useAuth();
  const { getDepositDetails, loading, error, clearError } = useGateway();
  const [depositDetails, setDepositDetails] = useState<DepositDetails | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  /**
   * Fetch deposit details from gateway
   */
  const loadDepositDetails = useCallback(async () => {
    if (!user?.address) return;

    try {
      const details = await getDepositDetails(asset.id, user.address);
      setDepositDetails(details);
    } catch (err) {
      logger.error('Failed to load deposit details:', err);
    }
  }, [user?.address, getDepositDetails, asset.id]);

  /**
   * Load deposit details when modal opens
   */
  useEffect(() => {
    if (open && user?.address) {
      void loadDepositDetails();
    }

    // Reset state when modal closes
    if (!open) {
      setDepositDetails(null);
      setTimeRemaining(null);
      clearError();
    }
  }, [open, user?.address, clearError, loadDepositDetails]);

  /**
   * Setup countdown timer for round-robin addresses
   */
  useEffect(() => {
    if (depositDetails?.gatewayType === 'round-robin' && depositDetails.expiry) {
      const expiryTime = depositDetails.expiry;
      // Initial calculation
      const calculateRemaining = () => {
        const remaining = expiryTime.getTime() - Date.now();
        return Math.max(0, remaining);
      };

      setTimeRemaining(calculateRemaining());

      // Update every second
      const interval = setInterval(() => {
        const remaining = calculateRemaining();
        setTimeRemaining(remaining);

        // Stop when expired
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [depositDetails]);

  /**
   * Handle modal close
   */
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
          <Typography variant="h6" component="span">
            Deposit {asset.name}
          </Typography>
          {depositDetails?.gatewayType === 'round-robin' && (
            <Chip label="Temporary" size="small" color="warning" icon={<AccessTime />} />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bridge {asset.ticker} to DecentralChain
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              justifyContent: 'center',
              py: 4,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading deposit details...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Deposit Details */}
        {depositDetails && !loading && (
          <Box>
            {/* Deposit Address with QR Code */}
            <DepositAddress address={depositDetails.address} assetName={asset.ticker} />

            <Divider sx={{ my: 3 }} />

            {/* Amount Limits and Fees */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                Transaction Limits
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Minimum:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {depositDetails.minimumAmount.toFixed()} {asset.ticker}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Maximum:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {depositDetails.maximumAmount.toFixed()} {asset.ticker}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Gateway Fee:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {depositDetails.gatewayFee.toFixed()} {asset.ticker}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Round-Robin Expiry Warning */}
            {depositDetails.gatewayType === 'round-robin' && timeRemaining !== null && (
              <Alert
                severity={timeRemaining < 300000 ? 'error' : 'warning'}
                icon={<AccessTime />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  This address expires in <strong>{formatTimeRemaining(timeRemaining)}</strong>
                </Typography>
                {timeRemaining < 300000 && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Less than 5 minutes remaining. Complete your deposit soon!
                  </Typography>
                )}
              </Alert>
            )}

            {/* Instructions */}
            <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 2 }}>
              <Typography variant="body2">
                Send {asset.ticker} to the address above. Your wrapped tokens will appear in your
                DecentralChain wallet after network confirmations.
              </Typography>
            </Alert>

            {/* Recovery Information */}
            {depositDetails.minRecoveryAmount && depositDetails.recoveryFee && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Recovery available for amounts above {depositDetails.minRecoveryAmount.toFixed()}{' '}
                  {asset.ticker} (fee: {depositDetails.recoveryFee.toFixed()} {asset.ticker})
                </Typography>
              </Box>
            )}

            {/* Support Contact */}
            {depositDetails.supportEmail && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Need help? Contact{' '}
                <Link href={`mailto:${depositDetails.supportEmail}`}>
                  {depositDetails.supportEmail}
                </Link>
              </Typography>
            )}

            {/* Gateway Terms */}
            {depositDetails.disclaimerLink && (
              <Typography variant="caption" color="text.secondary" display="block">
                By using this gateway, you agree to the{' '}
                <Link
                  href={depositDetails.disclaimerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </Link>
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
