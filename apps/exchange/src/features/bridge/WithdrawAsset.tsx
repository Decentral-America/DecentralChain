/**
 * WithdrawAsset Modal Component
 * Modal dialog for withdrawing wrapped assets from DecentralChain to external blockchain
 * Includes address validation, amount input with min/max checks, and transaction preview
 */

import { BigNumber } from '@decentralchain/bignumber';
import { InfoOutlined, WarningAmberOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGateway } from '@/hooks/useGateway';
import { logger } from '@/lib/logger';
import { type WithdrawDetails } from '@/services/gateway/types';
import { AddressInput } from './AddressInput';

interface WithdrawAssetProps {
  /** Asset to withdraw */
  asset: {
    id: string;
    name: string;
    ticker: string;
    decimals: number;
  };
  /** Current asset balance */
  balance: BigNumber;
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback to execute withdrawal transaction */
  onWithdraw: (amount: BigNumber, targetAddress: string, attachment: string) => Promise<void>;
}

/**
 * WithdrawAsset modal for bridging assets from DecentralChain to external blockchain
 */
export const WithdrawAsset: React.FC<WithdrawAssetProps> = ({
  asset,
  balance,
  open,
  onClose,
  onWithdraw,
}) => {
  const { user } = useAuth();
  const { getWithdrawDetails, loading, error, clearError } = useGateway();

  // Form state
  const [targetAddress, setTargetAddress] = useState('');
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  // Withdrawal details from gateway
  const [withdrawDetails, setWithdrawDetails] = useState<WithdrawDetails | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch withdrawal details from gateway
   */
  const loadWithdrawDetails = useCallback(async () => {
    if (!user?.address) return;

    try {
      const details = await getWithdrawDetails(asset.id, targetAddress);
      setWithdrawDetails(details);
    } catch (err) {
      logger.error('Failed to load withdraw details:', err);
    }
  }, [user?.address, getWithdrawDetails, asset.id, targetAddress]);

  /**
   * Load withdraw details when address is valid
   */
  useEffect(() => {
    if (open && isAddressValid && targetAddress) {
      void loadWithdrawDetails();
    } else {
      setWithdrawDetails(null);
    }
  }, [open, targetAddress, isAddressValid, loadWithdrawDetails]);

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!open) {
      setTargetAddress('');
      setIsAddressValid(false);
      setAmount('');
      setAmountError('');
      setWithdrawDetails(null);
      setSubmitting(false);
      clearError();
    }
  }, [open, clearError]);

  /**
   * Validate amount input
   */
  const validateAmount = (value: string): boolean => {
    if (!value || !withdrawDetails) {
      setAmountError('');
      return false;
    }

    const amountBN = new BigNumber(value);

    // Check if valid number
    if (amountBN.isNaN() || amountBN.lte(0)) {
      setAmountError('Invalid amount');
      return false;
    }

    // Convert to token units (without decimals)
    const amountInTokens = amountBN.mul(10 ** asset.decimals);

    // Check minimum
    if (amountInTokens.lt(withdrawDetails.minimumAmount)) {
      const minDisplay = withdrawDetails.minimumAmount.div(10 ** asset.decimals).toFixed();
      setAmountError(`Minimum: ${minDisplay} ${asset.ticker}`);
      return false;
    }

    // Check maximum
    if (amountInTokens.gt(withdrawDetails.maximumAmount)) {
      const maxDisplay = withdrawDetails.maximumAmount.div(10 ** asset.decimals).toFixed();
      setAmountError(`Maximum: ${maxDisplay} ${asset.ticker}`);
      return false;
    }

    // Check balance
    const balanceInTokens = balance.mul(10 ** asset.decimals);
    if (amountInTokens.gt(balanceInTokens)) {
      setAmountError('Insufficient balance');
      return false;
    }

    setAmountError('');
    return true;
  };

  /**
   * Handle amount input change
   */
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setAmountError('');
    }
  };

  /**
   * Set maximum amount
   */
  const handleMaxClick = () => {
    const maxAmount = balance.toFixed();
    setAmount(maxAmount);
    validateAmount(maxAmount);
  };

  /**
   * Handle withdrawal submission
   */
  const handleWithdraw = async () => {
    if (!withdrawDetails || !amount || !isAddressValid || !validateAmount(amount)) {
      return;
    }

    const amountBN = new BigNumber(amount).mul(10 ** asset.decimals);

    setSubmitting(true);
    try {
      // Call parent's onWithdraw with gateway address and attachment
      await onWithdraw(amountBN, targetAddress, withdrawDetails.attachment);
      onClose();
    } catch (err) {
      logger.error('Withdrawal failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Check if form is valid
   */
  const isFormValid =
    isAddressValid && amount && !amountError && withdrawDetails && !submitting && !loading;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Withdraw {asset.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bridge {asset.ticker} from DecentralChain to external blockchain
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          {/* Destination Address */}
          <AddressInput
            assetId={asset.id}
            value={targetAddress}
            onChange={(value, valid) => {
              setTargetAddress(value);
              setIsAddressValid(valid);
            }}
            label="Destination Address"
            placeholder={`Enter ${asset.ticker} address`}
            disabled={submitting}
          />

          {/* Loading State */}
          {loading && (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                py: 2,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading withdrawal details...
              </Typography>
            </Box>
          )}

          {/* Withdrawal Details */}
          {withdrawDetails && !loading && (
            <>
              {/* Amount Input */}
              <Box>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={handleAmountChange}
                  error={!!amountError}
                  helperText={amountError || `Available: ${balance.toFixed()} ${asset.ticker}`}
                  disabled={submitting}
                  inputProps={{
                    min: 0,
                    step: 'any',
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={handleMaxClick}
                          disabled={submitting}
                          sx={{ minWidth: 'auto' }}
                        >
                          MAX
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Divider />

              {/* Transaction Details */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                  Transaction Details
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Minimum:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {withdrawDetails.minimumAmount.div(10 ** asset.decimals).toFixed()}{' '}
                      {asset.ticker}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Maximum:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {withdrawDetails.maximumAmount.div(10 ** asset.decimals).toFixed()}{' '}
                      {asset.ticker}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Gateway Fee:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {withdrawDetails.gatewayFee.div(10 ** asset.decimals).toFixed()}{' '}
                      {asset.ticker}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Confirmation Alert */}
              {isAddressValid && targetAddress && (
                <Alert severity="info" icon={<InfoOutlined />}>
                  <Typography variant="body2">Your {asset.ticker} will be sent to:</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      mt: 0.5,
                      wordBreak: 'break-all',
                    }}
                  >
                    {targetAddress}
                  </Typography>
                </Alert>
              )}

              {/* Warning */}
              <Alert severity="warning" icon={<WarningAmberOutlined />}>
                <Typography variant="body2">
                  Double-check the destination address. Transactions cannot be reversed.
                </Typography>
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleWithdraw}
          disabled={!isFormValid}
          startIcon={submitting && <CircularProgress size={16} />}
        >
          {submitting ? 'Processing...' : 'Withdraw'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
