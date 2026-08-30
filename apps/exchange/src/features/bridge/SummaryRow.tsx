/**
 * One line of a transfer summary.
 *
 * `tone` marks the lines that are a cost or a caveat rather than a plain fact,
 * so the fee and the decimal truncation read differently from the amount.
 */
import { Stack, Typography } from '@mui/material';

export const SummaryRow: React.FC<{
  emphasis?: boolean;
  label: string;
  note?: string | undefined;
  tone?: 'default' | 'good' | 'warn';
  value: React.ReactNode;
}> = ({ emphasis = false, label, note, tone = 'default', value }) => (
  <Stack sx={{ py: 0.75 }}>
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
    >
      <Typography
        variant="body2"
        sx={{
          color: emphasis ? 'text.primary' : 'text.secondary',
          fontWeight: emphasis ? 600 : 400,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color:
            tone === 'warn' ? 'warning.main' : tone === 'good' ? 'success.main' : 'text.primary',
          fontWeight: emphasis ? 600 : 500,
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    </Stack>
    {note && (
      <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
        {note}
      </Typography>
    )}
  </Stack>
);
