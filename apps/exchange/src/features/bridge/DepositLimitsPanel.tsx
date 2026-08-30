/**
 * What will actually stop this deposit, and why.
 *
 * `GET /deposit/limits` returns every bound the bridge applies, each flagged
 * with whether it binds. Showing the binding one matters most for the daily
 * cap, which is a single counter shared across all seventeen tokens: a user
 * can be refused a perfectly ordinary amount because someone else consumed the
 * budget. "Amount too large" would be a false explanation, and the user would
 * spend their time shrinking an amount that was never the problem.
 */
import { Alert, Box, LinearProgress, Stack, Typography } from '@mui/material';
import { useDepositLimits } from '@/hooks/useDepositLimits';

interface DepositLimitsPanelProps {
  splMint: string | null;
  tokenName: string;
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

export const DepositLimitsPanel: React.FC<DepositLimitsPanelProps> = ({ splMint, tokenName }) => {
  const { data: limits, isLoading } = useDepositLimits(splMint);

  if (!splMint || isLoading || !limits) return null;

  const used = Number(limits.limits.daily.used.human);
  const max = Number(limits.limits.daily.max.human);
  const percentUsed = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const nearlyFull = percentUsed > 80;

  return (
    <Stack spacing={1.5}>
      {limits.degraded && (
        <Alert severity="warning">
          The bridge is running in a degraded state. Settlement may take longer than usual.
        </Alert>
      )}

      {limits.warnings.map((warning) => (
        <Alert key={warning} severity="info">
          {warning}
        </Alert>
      ))}

      <Row label={`Minimum (${tokenName})`} value={limits.minDeposit} />
      <Row label={`Maximum (${tokenName})`} value={limits.maxDeposit} />
      <Row label="Confirmations required" value={String(limits.solanaConfirmations)} />
      <Row label="Typical mint time" value={limits.estimatedMintTime} />

      <Box>
        <Row
          label="Daily capacity remaining"
          value={`${limits.limits.daily.remaining.human} of ${limits.limits.daily.max.human}`}
        />
        <LinearProgress
          variant="determinate"
          value={percentUsed}
          color={nearlyFull ? 'warning' : 'primary'}
          sx={{ borderRadius: 1, height: 6, mt: 0.5 }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Shared across every asset on the bridge, not just {tokenName}.
        </Typography>
      </Box>

      {nearlyFull && (
        <Alert severity="warning">
          Most of today's bridge capacity is used. This limit is shared across all assets, so a
          deposit can be refused even at a normal amount.
        </Alert>
      )}
    </Stack>
  );
};
