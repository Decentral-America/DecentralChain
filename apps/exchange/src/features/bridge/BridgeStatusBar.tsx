/**
 * Vault health, along the foot of the page.
 *
 * Every figure is read from `GET /stats`; nothing is derived or assumed. The
 * collateralisation ratio is the one worth watching — it is what says the
 * wrapped supply is actually backed.
 */
import { Box, Stack, Typography } from '@mui/material';
import { useBridgeStats } from '@/hooks/useBridgeStats';

const Figure: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline' }}>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography variant="caption" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Stack>
);

export const BridgeStatusBar: React.FC = () => {
  const { data: stats } = useBridgeStats();

  if (!stats) return null;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        justifyContent: 'space-between',
        px: 2,
        py: 1,
      }}
    >
      <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
        <Figure label="TVL:" value={`${stats.vaultBalance} SOL`} />
        <Figure label="wSOL Supply:" value={stats.wsolSupply} />
        <Figure label="Ratio:" value={stats.collateralizationRatio} />
      </Stack>
      <Figure label="Validators:" value={`${stats.activeValidators} active`} />
    </Box>
  );
};
