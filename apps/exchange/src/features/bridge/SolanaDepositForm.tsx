/**
 * Lock an asset on Solana to mint its wrapped form on DecentralChain.
 *
 * Two things are checked before the wallet prompt, because both fail in ways
 * that name the wrong cause afterwards:
 *
 *   - the amount against the *binding* limit, which for the daily cap is a
 *     counter shared across every token — a refusal there has nothing to do
 *     with the amount being large
 *   - the precision, since SOL and JitoSOL hold one fewer decimal wrapped than
 *     on Solana, and the difference is truncated on chain and never refunded
 */
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useDepositLimits } from '@/hooks/useDepositLimits';
import { useSolanaDeposit } from '@/hooks/useSolanaDeposit';
import { humanToRaw, rawToHuman, solanaToDcc } from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';

interface SolanaDepositFormProps {
  /** The user's DecentralChain address — where the wrapped asset is minted. */
  dccRecipient: string;
  onSubmitted: (transferId: string, amount: string) => void;
  token: BridgeToken;
}

export const SolanaDepositForm: React.FC<SolanaDepositFormProps> = ({
  dccRecipient,
  onSubmitted,
  token,
}) => {
  const [amount, setAmount] = useState('');
  const { data: limits } = useDepositLimits(token.splMint);
  const { deposit, error, isSubmitting } = useSolanaDeposit();

  const parsed = useMemo(() => {
    if (amount === '') return { error: null, raw: null };

    try {
      return { error: null, raw: humanToRaw(amount, token.solDecimals) };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : 'Invalid amount', raw: null };
    }
  }, [amount, token.solDecimals]);

  const conversion = parsed.raw !== null ? solanaToDcc(parsed.raw, token) : null;

  /**
   * `sources` marks which bound actually binds. Reporting that one — rather
   * than a generic range — is the difference between "reduce your amount" and
   * "the bridge is full until tomorrow".
   */
  const violated = useMemo(() => {
    if (!limits || parsed.raw === null) return null;

    const min = BigInt(limits.limits.min.raw);
    const max = BigInt(limits.limits.max.raw);
    const dailyRemaining = BigInt(limits.limits.daily.remaining.raw);

    if (parsed.raw < min) {
      return `Minimum deposit is ${limits.limits.min.human} ${token.name}.`;
    }
    if (parsed.raw > max) {
      return `Maximum deposit is ${limits.limits.max.human} ${token.name}.`;
    }
    if (parsed.raw > dailyRemaining) {
      return (
        `Only ${limits.limits.daily.remaining.human} of today's bridge capacity is left, and ` +
        'that allowance is shared across every asset — not just this one.'
      );
    }
    return null;
  }, [limits, parsed.raw, token.name]);

  const submittable =
    parsed.raw !== null && parsed.raw > 0n && !violated && !parsed.error && !isSubmitting;

  const handleSubmit = async () => {
    if (parsed.raw === null) return;

    const { transferId } = await deposit({
      amountRaw: parsed.raw,
      dccRecipient,
      token,
    });

    onSubmitted(transferId, amount);
    setAmount('');
  };

  return (
    <Stack spacing={2}>
      <TextField
        label={`Amount (${token.name})`}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        error={Boolean(parsed.error) || Boolean(violated)}
        helperText={parsed.error ?? violated ?? `Minted to ${dccRecipient}`}
        disabled={isSubmitting}
        fullWidth
      />

      {conversion && conversion.dustRaw > 0n && (
        <Alert severity="warning">
          {token.name} holds {token.solDecimals} decimals on Solana and {token.dccDecimals} wrapped.
          You would receive {rawToHuman(conversion.dccRaw, token.dccDecimals)} {token.name}, and{' '}
          {rawToHuman(conversion.dustRaw, token.solDecimals)} would be truncated on chain and not
          refunded. Reduce the precision to avoid it.
        </Alert>
      )}

      {conversion && conversion.dustRaw === 0n && (
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2 }}>
          <Typography variant="body2">
            You receive {rawToHuman(conversion.dccRaw, token.dccDecimals)} wrapped {token.name}
            {limits ? ` in about ${limits.estimatedMintTime.replace('~', '')}` : ''}.
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="contained" size="large" disabled={!submittable} onClick={handleSubmit}>
        {isSubmitting ? 'Confirm in your wallet…' : `Deposit ${token.name}`}
      </Button>
    </Stack>
  );
};
