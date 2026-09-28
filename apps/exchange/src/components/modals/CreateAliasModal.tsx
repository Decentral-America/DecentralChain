/**
 * Create Alias Modal
 * Modal for creating a new alias for the user's address
 */

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DetailGroup, DetailRow } from '@/components/premium/InsetList';
import { useAuth } from '@/contexts/AuthContext';
import { useAliases } from '@/hooks/useAliases';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { logger } from '@/lib/logger';
import { formatAmount } from '@/utils/formatters';

interface CreateAliasModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (alias: string) => void;
}

const MIN_ALIAS_LENGTH = 4;
const MAX_ALIAS_LENGTH = 30;
const ALIAS_PATTERN = /^[a-z0-9-@_.]*$/;
const ALIAS_FEE = 100000; // 0.001 DCC in dcclets

const ALIAS_ERROR_PATTERNS: Array<{ test: (msg: string) => boolean; message: string }> = [
  {
    message: 'Insufficient balance. You need at least 0.001 DCC to create an alias.',
    test: (m) => m.includes('insufficient') || m.includes('not enough balance'),
  },
  {
    message: 'Unable to sign transaction. Please try logging out and back in.',
    test: (m) => m.includes('seed') || m.includes('sign'),
  },
  {
    message: 'Network error. Please check your connection and try again.',
    test: (m) => m.includes('network') || m.includes('timeout'),
  },
  {
    message: 'This alias is already taken by someone else. Please choose a different one.',
    test: (m) =>
      m.includes('alias') &&
      (m.includes('already') || m.includes('claimed') || m.includes('exists')),
  },
];

function mapAliasError(err: unknown): string {
  if (!(err instanceof Error)) return 'Failed to create alias. Please try again.';
  const msg = err.message.toLowerCase();
  return (
    ALIAS_ERROR_PATTERNS.find((p) => p.test(msg))?.message ??
    `Failed to create alias: ${err.message}`
  );
}

export const CreateAliasModal = ({ open, onClose, onSuccess }: CreateAliasModalProps) => {
  const { user } = useAuth();
  const { checkAvailability, fetchAliases } = useAliases();
  const { signAlias } = useTransactionSigning();
  const { broadcast } = useBroadcast();
  const { balances } = useBalanceWatcher();

  const [alias, setAlias] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if user has enough balance
  // DCC is the native token, stored in balances.regular or balances.available (in dcclets)
  // Convert dcclets to DCC tokens: 1 DCC = 100,000,000 dcclets (10^8)
  // Debug logging
  useEffect(() => {
    if (balances) {
      logger.debug('[CreateAliasModal] Balance data:', {
        address: balances.address,
        available: balances.available,
        balance: balances.balance,
        regular: balances.regular,
      });
    }
  }, [balances]);

  // Use 'available' or 'regular' field (not 'balance' which may not exist in DCC node response)
  const dccBalance =
    (balances?.available ?? balances?.regular ?? balances?.balance ?? 0) / 100000000;
  const hasInsufficientBalance = dccBalance < 0.001;

  // Validation timeout
  useEffect(() => {
    if (!alias) {
      setValidationError(null);
      return;
    }

    // Basic validation
    if (alias.length < MIN_ALIAS_LENGTH) {
      setValidationError(`Alias must be at least ${MIN_ALIAS_LENGTH} characters`);
      return;
    }

    if (alias.length > MAX_ALIAS_LENGTH) {
      setValidationError(`Alias must be at most ${MAX_ALIAS_LENGTH} characters`);
      return;
    }

    if (!ALIAS_PATTERN.test(alias)) {
      setValidationError('Only lowercase letters, numbers, and -@_. are allowed');
      return;
    }

    // Check availability with debounce
    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const result = await checkAvailability(alias);
        if (!result.available) {
          setValidationError(result.error || 'This alias is not available');
        }
      } catch {
        setValidationError('Failed to validate alias');
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [alias, checkAvailability]);

  const handleCreate = async () => {
    if (!user?.address || !alias || validationError || isValidating) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const signedTx = await signAlias({
        alias,
        fee: ALIAS_FEE,
      });

      logger.debug(`[CreateAliasModal] Broadcasting transaction for alias: ${alias}`);

      // Broadcast the transaction
      await broadcast(signedTx);

      logger.debug(`[CreateAliasModal] Transaction broadcast successful for alias: ${alias}`);

      // Success! Just like Angular - add to local list and show success
      // NO POLLING - Angular doesn't poll either
      onSuccess?.(alias);
      setAlias('');
      onClose();
    } catch (err: unknown) {
      logger.error('[CreateAliasModal] Error creating alias:', err);

      // Refresh alias list in case it was actually created
      await fetchAliases().catch((e) => logger.error('Failed to refresh aliases:', e));

      setError(mapAliasError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setAlias('');
      setError(null);
      setValidationError(null);
      onClose();
    }
  };

  const isValid = alias && !validationError && !isValidating && !hasInsufficientBalance;

  const available = Boolean(alias) && !validationError && !isValidating;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        Create alias
        <IconButton onClick={handleClose} disabled={isCreating} size="small" aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            A short name anyone can send to instead of your full address. Aliases are permanent.
          </Typography>

          <TextField
            label="Alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value.toLowerCase())}
            placeholder="myalias"
            fullWidth
            autoFocus
            disabled={isCreating}
            error={!!validationError}
            helperText={
              validationError ||
              (available
                ? 'Available'
                : `${alias.length}/${MAX_ALIAS_LENGTH} characters (minimum ${MIN_ALIAS_LENGTH})`)
            }
            slotProps={{
              formHelperText: { sx: available ? { color: 'success.main' } : {} },
              input: {
                endAdornment: isValidating ? (
                  <CircularProgress size={18} />
                ) : available ? (
                  <Box sx={{ color: 'success.main', display: 'flex' }}>
                    <Check size={18} aria-hidden />
                  </Box>
                ) : null,
              },
            }}
          />

          <DetailGroup aria-label="What will be signed">
            <DetailRow label="Alias">{alias || '—'}</DetailRow>
            <DetailRow label="Network fee">0.001 DCC</DetailRow>
            <DetailRow label="Your balance">{formatAmount(dccBalance)} DCC</DetailRow>
          </DetailGroup>

          {hasInsufficientBalance && (
            <Alert severity="warning">You need at least 0.001 DCC to create an alias.</Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {user?.userType === 'ledger' && isCreating && (
            <Alert severity="info">Please confirm the transaction on your Ledger device</Alert>
          )}

          {user?.userType === 'cubensisConnect' && isCreating && (
            <Alert severity="info">Please confirm the transaction in Cubensis Connect</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!isValid || isCreating}
          startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isCreating ? 'Creating…' : 'Create alias'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
