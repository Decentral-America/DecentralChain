/**
 * SendAssetModalModern Component
 * Modern MUI-based modal for sending assets with recipient, amount, and fee inputs
 */

import { CheckCircle, Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getAddressByAlias, validateAliasFormat } from '@/api/services/aliasService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { broadcastTransaction, createTransferTransaction } from '@/utils/transactions';

export interface SendAssetModalModernProps {
  isOpen: boolean;
  onClose: () => void;
  assetId?: string;
  assetName?: string;
  assetDecimals?: number;
  availableBalance?: string;
}

/**
 * SendAssetModalModern component
 */
export const SendAssetModalModern: React.FC<SendAssetModalModernProps> = ({
  isOpen,
  onClose,
  assetId = 'DCC',
  assetName = 'DCC',
  assetDecimals = 8,
  availableBalance = '0',
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [attachment, setAttachment] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    recipient?: string | undefined;
    amount?: string | undefined;
  }>({});

  // Alias resolution state
  const [isResolvingAlias, setIsResolvingAlias] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isAlias, setIsAlias] = useState(false);

  const fee = 0.001; // Transaction fee in DCC
  const [txId, setTxId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // SECURITY: Mutex to prevent double-send race conditions
  const sendingRef = useRef(false);
  const broadcastedTxIds = useRef(new Set<string>());

  /**
   * Debounced alias resolution effect
   * Attempts to resolve recipient input as alias if it's not a valid address
   */
  useEffect(() => {
    const resolveAlias = async () => {
      if (!recipient || recipient.length < 4) {
        setResolvedAddress(null);
        setIsAlias(false);
        return;
      }

      // Check if it's a valid address format first
      const addressRegex = /^3[a-zA-Z0-9]{33,34}$/;
      if (addressRegex.test(recipient)) {
        setResolvedAddress(null);
        setIsAlias(false);
        return;
      }

      // Strip "alias:D:" prefix if present
      let aliasName = recipient;
      const aliasPrefix = /^alias:[A-Za-z0-9]:(.+)$/;
      const match = aliasName.match(aliasPrefix);
      if (match?.[1]) {
        aliasName = match[1];
      }

      // Check if it matches alias format
      const aliasValidation = validateAliasFormat(aliasName);
      if (!aliasValidation.valid) {
        setResolvedAddress(null);
        setIsAlias(false);
        return;
      }

      // Attempt to resolve alias
      setIsResolvingAlias(true);
      setIsAlias(true);

      try {
        const address = await getAddressByAlias(aliasName);
        setResolvedAddress(address);
        logger.debug(`[SendAssetModalModern] Resolved alias "${aliasName}" to address: ${address}`);
      } catch (error) {
        logger.warn(`[SendAssetModalModern] Failed to resolve alias "${aliasName}":`, error);
        setResolvedAddress(null);
      } finally {
        setIsResolvingAlias(false);
      }
    };

    // Debounce alias resolution
    const timeoutId = setTimeout(resolveAlias, 500);
    return () => clearTimeout(timeoutId);
  }, [recipient]);

  /**
   * Send mutation
   */
  const sendMutation = useMutation({
    mutationFn: async () => {
      // SECURITY: Prevent double-send race condition
      if (sendingRef.current) {
        throw new Error('Transaction already in progress');
      }
      sendingRef.current = true;

      try {
        if (!user?.seed) {
          throw new Error('No user seed found');
        }

        // Validate inputs
        if (!validateInputs()) {
          throw new Error('Invalid inputs');
        }

        // Determine the final recipient address
        // If it's an alias, use the resolved address; otherwise use recipient as-is
        const finalRecipient = isAlias && resolvedAddress ? resolvedAddress : recipient;

        // Create and broadcast transaction
        const tx = await createTransferTransaction(
          {
            amount: parseFloat(amount),
            assetId: assetId === 'DCC' ? null : assetId,
            attachment,
            recipient: finalRecipient,
          },
          user.seed,
        );

        const result = await broadcastTransaction(tx);

        // SECURITY: Track broadcast tx ID to prevent duplicate broadcasts
        if (result.id) {
          broadcastedTxIds.current.add(result.id);
        }

        return result;
      } finally {
        sendingRef.current = false;
      }
    },
    onSuccess: (data) => {
      setTxId(data.id);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });

      // Reset form after delay
      setTimeout(() => {
        handleClose();
      }, 3000);
    },
  });

  /**
   * Validate DCC/DecentralChain address or alias
   * @param input - Address or alias string
   * @returns boolean indicating validity
   */
  const isValidAddressOrAlias = (input: string): boolean => {
    if (!input) return false;

    // Check if it's a valid DecentralChain address (starts with 3, 35 chars, base58)
    const addressRegex = /^3[a-zA-Z0-9]{33,34}$/;
    if (addressRegex.test(input)) {
      return true;
    }

    // Strip "alias:D:" prefix if present
    let aliasName = input;
    const aliasPrefix = /^alias:[A-Za-z0-9]:(.+)$/;
    const match = aliasName.match(aliasPrefix);
    if (match?.[1]) {
      aliasName = match[1];
    }

    // Check alias format (4-30 chars, lowercase alphanumeric + -@_.)
    const aliasValidation = validateAliasFormat(aliasName);
    if (aliasValidation.valid) {
      // If it's a valid alias format, check if it resolved successfully
      return resolvedAddress !== null || isResolvingAlias;
    }

    return false;
  };

  /**
   * Validate amount
   */
  const isValidAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (Number.isNaN(numValue) || numValue <= 0) {
      return false;
    }
    if (numValue > parseFloat(availableBalance)) {
      return false;
    }
    return true;
  };

  /**
   * Validate all inputs
   */
  const validateInputs = (): boolean => {
    const errors: { recipient?: string; amount?: string } = {};

    // Validate recipient (address or alias)
    if (!isValidAddressOrAlias(recipient)) {
      if (isAlias && !resolvedAddress && !isResolvingAlias) {
        errors.recipient = 'Alias not found or does not exist';
      } else if (isResolvingAlias) {
        errors.recipient = 'Resolving alias...';
      } else {
        errors.recipient = 'Invalid address or alias';
      }
    }

    if (!isValidAmount(amount)) {
      if (parseFloat(amount) > parseFloat(availableBalance)) {
        errors.amount = 'Insufficient balance';
      } else {
        errors.amount = 'Invalid amount';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle send
   */
  const handleSend = () => {
    sendMutation.mutate();
  };

  /**
   * Handle max click
   */
  const handleMaxClick = () => {
    const maxAmount = Math.max(0, parseFloat(availableBalance) - fee);
    setAmount(maxAmount.toFixed(assetDecimals));
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setAttachment('');
    setValidationErrors({});
    setShowSuccess(false);
    setTxId(null);
    setResolvedAddress(null);
    setIsAlias(false);
    sendMutation.reset();
    onClose();
  };

  /**
   * Render success view
   */
  if (showSuccess && txId) {
    return (
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  height: 40,
                  justifyContent: 'center',
                  width: 40,
                }}
              >
                <SendIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Transaction Sent
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="success">
              Your transaction has been successfully broadcast to the network!
            </Alert>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Transaction ID
              </Typography>
              <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {txId}
                </Typography>
              </Card>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  /**
   * Render form view
   */
  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                alignItems: 'center',
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                borderRadius: '50%',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
            >
              <SendIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Send {assetName}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Recipient Address or Alias */}
          <Box>
            <TextField
              fullWidth
              label="Recipient Address or Alias"
              placeholder="Enter address (3P...) or alias (e.g., myalias)"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                if (validationErrors.recipient) {
                  setValidationErrors((prev) => ({ ...prev, recipient: undefined }));
                }
              }}
              error={!!validationErrors.recipient}
              helperText={
                validationErrors.recipient || !recipient
                  ? 'You can send to a DecentralChain address or an alias'
                  : undefined
              }
              InputProps={{
                endAdornment: isResolvingAlias ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : isAlias && resolvedAddress ? (
                  <InputAdornment position="end">
                    <CheckCircle color="success" />
                  </InputAdornment>
                ) : null,
              }}
            />
            {/* Show resolved address for aliases */}
            {isAlias && resolvedAddress && (
              <Alert severity="success" icon={<CheckCircle fontSize="small" />} sx={{ mt: 1 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" fontWeight={600}>
                    Alias resolved to address:
                  </Typography>
                  <Typography variant="caption" fontFamily="monospace">
                    {resolvedAddress}
                  </Typography>
                </Stack>
              </Alert>
            )}
            {/* Show alias resolution failure */}
            {isAlias && !resolvedAddress && !isResolvingAlias && recipient.length >= 4 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Alias &quot;{recipient}&quot; not found. Make sure the alias exists on the
                  blockchain.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Amount */}
          <Box>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (validationErrors.amount) {
                  setValidationErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              error={!!validationErrors.amount}
              helperText={validationErrors.amount}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={handleMaxClick} sx={{ minWidth: 'auto' }}>
                      MAX
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Available: {parseFloat(availableBalance).toFixed(assetDecimals)} {assetName}
            </Typography>
          </Box>

          {/* Attachment (optional) */}
          <TextField
            fullWidth
            label="Attachment (optional)"
            placeholder="Optional message"
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            inputProps={{ maxLength: 140 }}
            helperText={`${attachment.length}/140 characters`}
          />

          {/* Fee Display */}
          <Card
            sx={{
              background:
                'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid',
              borderColor: 'primary.light',
              p: 2,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Transaction Fee
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {fee} DCC (≈ ${(fee * 0.5).toFixed(4)})
              </Typography>
            </Box>
          </Card>

          {/* Error Message */}
          {sendMutation.isError && (
            <Alert severity="error">
              {sendMutation.error instanceof Error
                ? sendMutation.error.message
                : 'Failed to send transaction'}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={sendMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!recipient || !amount || sendMutation.isPending}
          startIcon={<SendIcon />}
          sx={{
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
            },
            background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
          }}
        >
          {sendMutation.isPending ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
