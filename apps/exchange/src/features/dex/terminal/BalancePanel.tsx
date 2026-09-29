import { Box, Typography, useTheme } from '@mui/material';
import { useAssetBalance } from '@/api/services/assetsService';
import { useAuth } from '@/contexts/AuthContext';
import { coinsToTokens } from '@/features/dex/orderScaling';
import { usePairDecimals } from '@/features/dex/usePairDecimals';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { selectSelectedPair, useDexStore } from '@/stores/dexStore';
import { tokens } from '@/theme/tokens/semantic';
import { NUM } from './terminalTokens';

const isDcc = (id?: string) => !id || id === 'DCC';

/**
 * What the account holds of the two assets on this market.
 *
 * The tab used to show open orders under the word "Balance". These are the
 * same reads the order forms make to compute what is spendable, so the figure
 * here and the "Available" line in the form can never disagree.
 */
export function BalancePanel() {
  const t = tokens(useTheme().palette.mode);
  const { isAuthenticated, user } = useAuth();
  const pair = useDexStore(selectSelectedPair);
  const { amountDecimals, priceDecimals } = usePairDecimals(pair);

  const amountId = pair?.amountAsset ?? '';
  const priceId = pair?.priceAsset ?? '';
  const needDcc = isDcc(amountId) || isDcc(priceId);

  const { balances: dcc } = useBalanceWatcher({ enabled: isAuthenticated && needDcc });
  const { data: amountBal } = useAssetBalance(user?.address ?? '', amountId, {
    enabled: isAuthenticated && !isDcc(amountId) && !!user?.address && !!amountId,
  });
  const { data: priceBal } = useAssetBalance(user?.address ?? '', priceId, {
    enabled: isAuthenticated && !isDcc(priceId) && !!user?.address && !!priceId,
  });

  const rows = [
    {
      coins: isDcc(amountId) ? (dcc?.available ?? 0) : (amountBal?.balance ?? 0),
      decimals: amountDecimals,
      id: amountId,
      name: pair?.amountAssetName || amountId,
    },
    {
      coins: isDcc(priceId) ? (dcc?.available ?? 0) : (priceBal?.balance ?? 0),
      decimals: priceDecimals,
      id: priceId,
      name: pair?.priceAssetName || priceId,
    },
  ];

  if (!isAuthenticated) {
    return (
      <Typography sx={{ color: t.text.secondary, fontSize: 13, px: 2, py: 5, textAlign: 'center' }}>
        Sign in to see balances.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 320px))',
        p: 2,
      }}
    >
      {rows.map((r) => (
        <Box
          key={r.id}
          sx={{
            border: `1px solid ${t.border.subtle}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              color: t.text.tertiary,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Available
          </Typography>
          <Typography sx={{ ...NUM, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {coinsToTokens(r.coins, r.decimals).toLocaleString('en-US', {
              maximumFractionDigits: Math.min(r.decimals, 8),
            })}
            <Box
              component="span"
              sx={{ color: t.text.secondary, fontSize: 13, fontWeight: 500, ml: 0.75 }}
            >
              {r.name}
            </Box>
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
