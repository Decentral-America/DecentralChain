/**
 * Create Alias Modal
 * Modal for creating a new alias for the user's address
 */

import CloseIcon from '@mui/icons-material/Close';
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
import * as ds from 'data-service';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAliases } from '@/hooks/useAliases';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { logger } from '@/lib/logger';

interface CreateAliasModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (alias: string) => void;
}

const MIN_ALIAS_LENGTH = 4;
const MAX_ALIAS_LENGTH = 30;
const ALIAS_PATTERN = /^[a-z0-9-@_.]*$/;
const ALIAS_FEE = 100000; // 0.001 DCC in wavelets

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
  // DCC is the native token, stored in balances.regular or balances.available (in wavelets)
  // Convert wavelets to DCC tokens: 1 DCC = 100,000,000 wavelets (10^8)
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
      // Create the transaction
      const fee = await ds.moneyFromCoins(ALIAS_FEE, 'DCC');
      const signedTx = await signAlias({
        alias,
        fee,
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Create Alias
          </Typography>
          <IconButton onClick={handleClose} disabled={isCreating} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a custom alias for your address. Aliases are shorter and easier to remember
              than full addresses.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Fee: <strong>0.001 DCC</strong>
              </Typography>
            </Alert>

            {hasInsufficientBalance && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Insufficient balance. You need at least 0.001 DCC to create an alias.
                  <br />
                  Current balance: <strong>{dccBalance.toFixed(8)} DCC</strong>
                </Typography>
              </Alert>
            )}
          </Box>

          <TextField
            label="Alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value.toLowerCase())}
            placeholder="myalias"
            fullWidth
            disabled={isCreating}
            error={!!validationError}
            helperText={
              validationError ||
              `${alias.length}/${MAX_ALIAS_LENGTH} characters (minimum ${MIN_ALIAS_LENGTH})`
            }
            InputProps={{
              endAdornment: isValidating && <CircularProgress size={20} />,
            }}
          />

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {user?.userType === 'ledger' && isCreating && (
            <Alert severity="info">Please confirm the transaction on your Ledger device</Alert>
          )}

          {user?.userType === 'keeper' && isCreating && (
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
          startIcon={isCreating && <CircularProgress size={16} />}
        >
          {isCreating ? 'Creating...' : 'Create Alias'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
