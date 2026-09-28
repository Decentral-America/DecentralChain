/**
 * BridgeAssetSelector Component
 * Displays available gateway assets with deposit/withdraw action buttons
 * Filters assets to only show those with gateway support
 */

import { BigNumber } from '@decentralchain/bignumber';
import { Avatar, Box, Button, Card, Stack, Typography } from '@mui/material';
import { ArrowDown, ArrowLeftRight, ArrowUp, Link2, Network } from 'lucide-react';
import { EmptyState } from '@/components/premium/EmptyState';
import { useConfig } from '@/contexts/ConfigContext';

interface GatewayAsset {
  assetId: string;
  name: string;
  ticker: string;
  decimals: number;
  icon?: string | undefined;
  balance: BigNumber;
  hasDeposit: boolean;
  hasWithdraw: boolean;
}

interface BridgeAssetSelectorProps {
  /** Asset balances map (assetId -> balance) */
  balances?: Record<string, BigNumber>;
  /** Callback when deposit button is clicked */
  onDeposit: (asset: GatewayAsset) => void;
  /** Callback when withdraw button is clicked */
  onWithdraw: (asset: GatewayAsset) => void;
}

/**
 * BridgeAssetSelector component for displaying gateway-supported assets
 * Shows asset cards with deposit/withdraw actions in responsive grid
 */
export const BridgeAssetSelector: React.FC<BridgeAssetSelectorProps> = ({
  balances = {},
  onDeposit,
  onWithdraw,
}) => {
  const { gateway, assets } = useConfig();

  // Build list of gateway assets with their details
  const gatewayAssets: GatewayAsset[] = Object.keys(gateway ?? {}).map((assetId) => {
    // `assets` maps ticker → assetId; reverse-lookup to find the ticker for this assetId
    const ticker =
      Object.entries(assets).find(([, id]) => id === assetId)?.[0] ?? assetId.substring(0, 8);
    const balance = balances[assetId] ?? new BigNumber(0);

    return {
      assetId,
      balance,
      decimals: 8, // DCC-standard 8 decimal places; precision not in network config
      hasDeposit: true, // All gateway assets support deposit
      hasWithdraw: true, // All gateway assets support withdraw
      icon: undefined,
      name: ticker,
      ticker,
    };
  });

  // Handle case where no gateway assets are configured
  if (gatewayAssets.length === 0) {
    return (
      <Card>
        <EmptyState
          icons={[Link2, ArrowLeftRight, Network]}
          title="No Gateway Assets Available"
          description="Gateway assets are not configured for this network"
        />
      </Card>
    );
  }

  /*
   * One grouped inset list: token avatar, ticker and name on the left, the
   * balance right-aligned, then the two actions. Hairlines are inset past
   * the avatar.
   */
  return (
    <Card component="section" aria-label="Gateway assets" sx={{ py: 0.5 }}>
      {gatewayAssets.map((asset, index) => (
        <Box
          key={asset.assetId}
          sx={{
            '&:hover': { bgcolor: 'action.hover' },
            alignItems: 'center',
            display: 'grid',
            gap: 2,
            gridTemplateAreas: {
              sm: '"who balance actions"',
              xs: '"who balance" "actions actions" "hint hint"',
            },
            gridTemplateColumns: { sm: 'minmax(0, 1fr) auto auto', xs: 'minmax(0, 1fr) auto' },
            position: 'relative',
            px: 2.5,
            py: 1.5,
            transition: 'background-color 160ms',
            ...(index > 0
              ? {
                  '&::before': {
                    borderTop: 1,
                    borderTopColor: 'divider',
                    content: '""',
                    left: 76,
                    position: 'absolute',
                    right: 0,
                    top: 0,
                  },
                }
              : {}),
          }}
        >
          <Box
            sx={{ alignItems: 'center', display: 'flex', gap: 1.5, gridArea: 'who', minWidth: 0 }}
          >
            <Avatar
              src={asset.icon}
              sx={{
                bgcolor: 'primary.main',
                // Explicit: MUI's Avatar otherwise inks its fallback letter
                // with `background.default`, which is not a contrast-checked
                // pairing with `primary.main`.
                color: 'primary.contrastText',
                fontSize: 16,
                fontWeight: 600,
                height: 40,
                width: 40,
              }}
            >
              {asset.ticker[0]}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 15, fontWeight: 500 }}>
                {asset.ticker}
              </Typography>
              <Typography noWrap variant="body2" sx={{ color: 'text.secondary' }}>
                {asset.name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ gridArea: 'balance', textAlign: 'right' }}>
            <Typography sx={{ fontSize: 15, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              {asset.balance.toFixed()} {asset.ticker}
            </Typography>
            {/* On phones the zero-balance hint takes its own full-width line below. */}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              <Box component="span" sx={{ display: { sm: 'none', xs: 'inline' } }}>
                Your Balance
              </Box>
              <Box component="span" sx={{ display: { sm: 'inline', xs: 'none' } }}>
                {asset.balance.lte(0)
                  ? `Deposit ${asset.ticker} to enable withdrawals`
                  : 'Your Balance'}
              </Box>
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ gridArea: 'actions' }}>
            {asset.hasDeposit && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ArrowDown size={16} />}
                onClick={() => onDeposit(asset)}
                sx={{ flex: { sm: 'none', xs: 1 } }}
              >
                Deposit
              </Button>
            )}
            {asset.hasWithdraw && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowUp size={16} />}
                onClick={() => onWithdraw(asset)}
                disabled={asset.balance.lte(0)}
                sx={{ flex: { sm: 'none', xs: 1 } }}
              >
                Withdraw
              </Button>
            )}
          </Stack>

          {asset.balance.lte(0) ? (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: { sm: 'none', xs: 'block' },
                gridArea: 'hint',
                textAlign: 'center',
              }}
            >
              Deposit {asset.ticker} to enable withdrawals
            </Typography>
          ) : null}
        </Box>
      ))}
    </Card>
  );
};
