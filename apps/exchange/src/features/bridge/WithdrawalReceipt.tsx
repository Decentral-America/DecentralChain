/**
 * A submitted withdrawal.
 *
 * Deliberately not polled. A withdrawal's only client-side handle is the
 * DecentralChain burn transaction id, and `GET /transfer/:id` indexes bridge
 * transfer ids — it does not recognise a DCC txid and answers with its
 * unknown-placeholder forever. Polling it produced a permanent "this transfer
 * has not reached the bridge" warning on a withdrawal that had in fact
 * completed, which is worse than showing nothing.
 *
 * So this states what is actually known: the burn is on chain, here is the
 * transaction, and release takes a few minutes.
 */
import { Alert, Link, Stack, Typography } from '@mui/material';
import { ExplorerLinkService } from '@/services/explorerLinks';

interface WithdrawalReceiptProps {
  amount: string;
  onDismiss: () => void;
  tokenName: string;
  txId: string;
}

export const WithdrawalReceipt: React.FC<WithdrawalReceiptProps> = ({
  amount,
  onDismiss,
  tokenName,
  txId,
}) => {
  let explorerUrl: string | null = null;
  try {
    explorerUrl = ExplorerLinkService.getTransactionLink(txId);
  } catch {
    // No explorer configured for this network — the id alone is still useful.
    explorerUrl = null;
  }

  return (
    <Alert severity="success" onClose={onDismiss}>
      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Burned {amount} {tokenName} on DecentralChain.
        </Typography>
        <Typography variant="body2">
          The validators gather attestations across several Solana transactions before releasing
          funds, so expect a few minutes. Release happens whether or not this page stays open.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Burn transaction:{' '}
          {explorerUrl ? (
            <Link href={explorerUrl} target="_blank" rel="noopener noreferrer">
              {txId.slice(0, 20)}…
            </Link>
          ) : (
            <code>{txId}</code>
          )}
        </Typography>
      </Stack>
    </Alert>
  );
};
