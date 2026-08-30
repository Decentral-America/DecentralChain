/**
 * The assets the Solana bridge will accept.
 *
 * Sourced entirely from `GET /tokens` rather than a hardcoded list. Four
 * assets are disabled on chain because offering them loses user funds, and the
 * API stops listing them within 30 seconds of that changing; a list compiled
 * here would keep offering them. Three more are filtered in `services/bridge`
 * because they report enabled but cannot succeed at any realistic amount.
 */
import { Alert, Box, Card, CardContent, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { useBridgeStats } from '@/hooks/useBridgeStats';
import { useBridgeTokens } from '@/hooks/useBridgeTokens';
import { hasDecimalGap } from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';

interface SolanaAssetListProps {
  onSelect: (token: BridgeToken) => void;
  selectedMint: string | null;
}

const AssetCard: React.FC<{
  onSelect: () => void;
  selected: boolean;
  token: BridgeToken;
}> = ({ onSelect, selected, token }) => (
  <Card
    onClick={onSelect}
    sx={{
      '&:hover': { borderColor: 'primary.light' },
      borderColor: selected ? 'primary.main' : 'divider',
      borderStyle: 'solid',
      borderWidth: 1,
      cursor: 'pointer',
      transition: 'border-color 120ms',
    }}
  >
    <CardContent>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {token.name}
        </Typography>
        {hasDecimalGap(token) && (
          /*
           * SOL and JitoSOL hold 9 decimals on Solana and 8 wrapped. The ninth
           * is truncated on deposit and never refunded, so the asymmetry is
           * worth stating before the user picks an amount rather than after.
           */
          <Chip
            size="small"
            variant="outlined"
            label={`${token.solDecimals}→${token.dccDecimals} decimals`}
          />
        )}
      </Stack>
    </CardContent>
  </Card>
);

export const SolanaAssetList: React.FC<SolanaAssetListProps> = ({ onSelect, selectedMint }) => {
  const { data: tokens, error, isLoading } = useBridgeTokens();
  const { data: stats } = useBridgeStats();

  if (isLoading) {
    return (
      <Stack spacing={1}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Could not reach the bridge API. If this is a local build, the app's origin may not be on the
        bridge's allowed-origins list — that failure surfaces here as a plain network error.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {stats?.bridgePaused && (
        <Alert severity="warning">
          The bridge is paused. Deposits and withdrawals are refused until it resumes.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { md: 'repeat(3, 1fr)', sm: 'repeat(2, 1fr)', xs: '1fr' },
        }}
      >
        {tokens?.map((token) => (
          <AssetCard
            key={token.splMint}
            onSelect={() => onSelect(token)}
            selected={token.splMint === selectedMint}
            token={token}
          />
        ))}
      </Box>

      {tokens?.length === 0 && (
        <Alert severity="info">The bridge is not currently accepting any asset.</Alert>
      )}
    </Stack>
  );
};
