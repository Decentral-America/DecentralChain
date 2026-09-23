/**
 * Where a transfer actually is.
 *
 * A spinner is the wrong component here. A deposit mints in about 75 seconds;
 * a withdrawal takes minutes, because the validators gather attestations
 * across several Solana transactions before releasing funds. An indefinite
 * spinner over that span is indistinguishable from a hang, and the one thing
 * a user in that position needs is to know the difference.
 */
import { Alert, Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useTransferStatus } from '@/hooks/useTransferStatus';
import { describeBridgeError } from '@/services/bridge/api';

interface TransferProgressProps {
  onDismiss?: () => void;
  transferId: string;
}

const STAGE_LABEL: Record<string, string> = {
  completed: 'Complete',
  failed: 'Failed',
  pending_confirmation: 'Waiting for Solana confirmations',
  pending_signatures: 'Waiting for validator signatures',
  processing: 'Settling',
};

export const TransferProgress: React.FC<TransferProgressProps> = ({ onDismiss, transferId }) => {
  const { error, isLoading, isSettled, isStranded, transfer } = useTransferStatus(transferId);

  /*
   * The error branch has to come first. While the query is failing `transfer`
   * is undefined, so a `!transfer` guard ahead of it swallows every error into
   * a bare indeterminate bar — which is exactly what a restarting dev server
   * produced: a progress bar over a transfer nobody could read, with no
   * explanation and no way to clear it.
   *
   * Polling continues underneath (`refetchInterval` is not disabled on error),
   * so this state clears itself the moment the API answers again.
   */
  if (error) {
    return (
      <Alert severity="error" onClose={onDismiss}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Could not read the status of this transfer.
        </Typography>
        <Typography variant="body2">
          {describeBridgeError(error)} Still retrying. The transfer itself is unaffected — it
          settles on chain whether or not this page can see it.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Transfer id: <code>{transferId}</code>
        </Typography>
      </Alert>
    );
  }

  if (isLoading || !transfer) {
    return (
      <Stack spacing={0.75}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Reading transfer status…
        </Typography>
        <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
      </Stack>
    );
  }

  if (isStranded) {
    return (
      /*
       * The API answers 200 with a synthesised "pending" record for an id it
       * has never seen, so this state is otherwise invisible — it looks
       * exactly like a transfer in flight, forever. Saying so is the only
       * honest option; the alternative is a progress bar that never moves.
       */
      <Alert severity="warning" onClose={onDismiss}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          This transfer has not reached the bridge.
        </Typography>
        <Typography variant="body2">
          The bridge has no record of <code>{transferId.slice(0, 16)}…</code>. If the deposit
          transaction confirmed on Solana, keep this id and contact support — it is the only handle
          on those funds.
        </Typography>
      </Alert>
    );
  }

  const confirmationProgress =
    transfer.requiredConfirmations > 0
      ? Math.min(100, (transfer.confirmations / transfer.requiredConfirmations) * 100)
      : 0;

  const signatureProgress =
    transfer.requiredSignatures > 0
      ? Math.min(100, (transfer.validatorSignatures / transfer.requiredSignatures) * 100)
      : 0;

  if (transfer.status === 'failed') {
    return (
      <Alert severity="error" onClose={onDismiss}>
        Transfer failed{transfer.error ? `: ${transfer.error}` : ''}.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Chip
          size="small"
          color={isSettled ? 'success' : 'default'}
          label={STAGE_LABEL[transfer.status] ?? transfer.status}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {transfer.amountFormatted}
        </Typography>
      </Stack>

      {!isSettled && (
        <>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Solana confirmations · {transfer.confirmations} of {transfer.requiredConfirmations}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={confirmationProgress}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Validator signatures · {transfer.validatorSignatures} of {transfer.requiredSignatures}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={signatureProgress}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
        </>
      )}

      {isSettled && transfer.destinationTxHash && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Settled in {transfer.destinationTxHash.slice(0, 16)}…
        </Typography>
      )}
    </Stack>
  );
};
