/**
 * Withdraw a wrapped asset back to Solana.
 *
 * Everything the user is charged is shown before they sign. The 0.25% bridge
 * fee comes out of the amount; the 0.009 DCC transaction fee comes out of
 * their DCC balance, which is the one that strands people — an account can
 * hold plenty of wrapped USDC and still be unable to broadcast, and the node's
 * refusal says nothing about why.
 */
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { WITHDRAW_TX_FEE } from '@/config/bridge';
import { useBridgeWithdraw } from '@/hooks/useBridgeWithdraw';
import { humanToRaw, rawToHuman } from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';
import { isValidSolanaAddress, withdrawBreakdown } from '@/services/bridge/withdraw';

interface SolanaWithdrawFormProps {
  /** Wrapped-asset balance in raw units. */
  balanceRaw: bigint;
  /** DCC balance in wavelets, for the fee pre-flight. */
  dccBalanceRaw: bigint;
  onSubmitted: (txId: string, amount: string) => void;
  token: BridgeToken;
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {value}
    </Typography>
  </Stack>
);

export const SolanaWithdrawForm: React.FC<SolanaWithdrawFormProps> = ({
  balanceRaw,
  dccBalanceRaw,
  onSubmitted,
  token,
}) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const { error, isSubmitting, withdraw } = useBridgeWithdraw();

  const canPayFee = dccBalanceRaw >= BigInt(WITHDRAW_TX_FEE);
  const recipientValid = recipient === '' || isValidSolanaAddress(recipient);

  /**
   * `humanToRaw` throws on over-precise input rather than rounding, because
   * rounding an amount is losing the user's money quietly. Surface that as a
   * field error instead of letting it reach the submit handler.
   */
  const parsed = useMemo(() => {
    if (amount === '') return { error: null, raw: null };

    try {
      return { error: null, raw: humanToRaw(amount, token.dccDecimals) };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : 'Invalid amount', raw: null };
    }
  }, [amount, token.dccDecimals]);

  const overBalance = parsed.raw !== null && parsed.raw > balanceRaw;
  const breakdown = parsed.raw !== null ? withdrawBreakdown(parsed.raw) : null;

  const submittable =
    parsed.raw !== null &&
    parsed.raw > 0n &&
    !overBalance &&
    recipient !== '' &&
    recipientValid &&
    canPayFee &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (parsed.raw === null) return;

    const txId = await withdraw({
      amountRaw: parsed.raw,
      dccBalanceRaw,
      solanaRecipient: recipient,
      token,
    });

    onSubmitted(txId, amount);
    setAmount('');
    setRecipient('');
  };

  return (
    <Stack spacing={2}>
      {!canPayFee && (
        <Alert severity="warning">
          Withdrawing costs {WITHDRAW_TX_FEE / 1e8} DCC in transaction fees, and this account does
          not hold it. Wrapped assets cannot pay their own withdrawal fee.
        </Alert>
      )}

      <TextField
        label={`Amount (${token.name})`}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        error={Boolean(parsed.error) || overBalance}
        helperText={
          parsed.error ??
          (overBalance
            ? `Balance is ${rawToHuman(balanceRaw, token.dccDecimals)} ${token.name}`
            : `Available: ${rawToHuman(balanceRaw, token.dccDecimals)} ${token.name}`)
        }
        disabled={isSubmitting}
        fullWidth
      />

      <TextField
        label="Solana recipient address"
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        error={!recipientValid}
        helperText={
          recipientValid
            ? 'The base58 Solana address that receives the released funds'
            : 'Not a Solana address. A DecentralChain address is 26 bytes; a Solana one is 32.'
        }
        disabled={isSubmitting}
        fullWidth
      />

      {breakdown && (
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2 }}>
          <Stack spacing={0.5}>
            <Row
              label="You burn"
              value={`${rawToHuman(breakdown.burnedRaw, token.dccDecimals)} ${token.name}`}
            />
            <Row
              label="Bridge fee (0.25%)"
              value={`${rawToHuman(breakdown.bridgeFeeRaw, token.dccDecimals)} ${token.name}`}
            />
            <Row
              label="You receive on Solana"
              value={`${rawToHuman(breakdown.receivedRaw, token.dccDecimals)} ${token.name}`}
            />
            <Row label="Transaction fee" value={`${breakdown.txFee / 1e8} DCC`} />
          </Stack>
        </Box>
      )}

      <Alert severity="info">
        Settlement takes a few minutes. The validators gather attestations across several Solana
        transactions before releasing funds.
      </Alert>

      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="contained" size="large" disabled={!submittable} onClick={handleSubmit}>
        {isSubmitting ? 'Submitting…' : 'Withdraw to Solana'}
      </Button>
    </Stack>
  );
};
