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
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { DEPOSIT_FEE_RATE } from '@/config/bridge';
import { useDepositLimits } from '@/hooks/useDepositLimits';
import { useSolanaDeposit } from '@/hooks/useSolanaDeposit';
import { hasDecimalGap, humanToRaw, rawToHuman, solanaToDcc } from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';
import { SummaryRow } from './SummaryRow';

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
   * The bridge's cut, as basis points on the raw amount.
   *
   * Integer arithmetic throughout — scaling a fee in floating point is the same
   * class of mistake as parsing an amount with `Math.round`, and this figure is
   * shown to a user as money.
   */
  const depositFeeRaw =
    parsed.raw === null
      ? 0n
      : (parsed.raw * BigInt(Math.round(DEPOSIT_FEE_RATE * 10_000))) / 10_000n;

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
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Token &amp; amount
        </Typography>
        <TextField
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={Boolean(parsed.error) || Boolean(violated)}
          disabled={isSubmitting}
          fullWidth
          placeholder="0.00"
          slotProps={{
            input: {
              endAdornment: (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {token.name}
                </Typography>
              ),
            },
          }}
        />

        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mt: 0.75 }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {limits
              ? `Limits: ${limits.limits.min.human} – ${limits.limits.max.human} ${token.name}`
              : ' '}
          </Typography>
          {limits && (
            <Typography
              variant="caption"
              onClick={() => setAmount(limits.limits.max.human)}
              sx={{ color: 'primary.main', cursor: 'pointer' }}
            >
              Use max
            </Typography>
          )}
        </Stack>

        {limits && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Daily capacity left: {limits.limits.daily.remaining.human} of{' '}
            {limits.limits.daily.max.human} — shared across every asset
          </Typography>
        )}

        {(parsed.error || violated) && (
          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
            {parsed.error ?? violated}
          </Typography>
        )}
      </Box>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          DecentralChain recipient
        </Typography>
        <TextField fullWidth size="small" value={dccRecipient} disabled />
      </Box>

      {conversion && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <SummaryRow label="You deposit" value={`${amount} ${token.name}`} />
          <SummaryRow
            label={`Bridge fee (${(DEPOSIT_FEE_RATE * 100).toFixed(2)}%)`}
            note="Retained by the bridge"
            tone="warn"
            value={`−${rawToHuman(depositFeeRaw, token.solDecimals)} ${token.name}`}
          />

          <Divider sx={{ my: 1 }} />

          <SummaryRow
            emphasis
            label="You receive"
            value={`${rawToHuman(conversion.dccRaw, token.dccDecimals)} ${token.name}.DCC`}
          />
          {hasDecimalGap(token) && (
            <SummaryRow
              label="Decimal conversion"
              tone="warn"
              value={`${token.solDecimals}→${token.dccDecimals} dec`}
              note={
                conversion.dustRaw > 0n
                  ? `${rawToHuman(conversion.dustRaw, token.solDecimals)} truncated on chain, not refunded`
                  : undefined
              }
            />
          )}
          {limits && (
            <>
              <SummaryRow
                label="Confirmations required"
                value={String(limits.solanaConfirmations)}
              />
              <SummaryRow label="Estimated time" value={limits.estimatedMintTime} />
            </>
          )}
        </Paper>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="contained" size="large" disabled={!submittable} onClick={handleSubmit}>
        {isSubmitting ? 'Confirm in your wallet…' : `Deposit ${token.name}`}
      </Button>
    </Stack>
  );
};
