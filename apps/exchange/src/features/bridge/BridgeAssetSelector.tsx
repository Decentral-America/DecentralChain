/**
 * BridgeAssetSelector Component
 * Displays available gateway assets with deposit/withdraw action buttons
 * Filters assets to only show those with gateway support
 */

import { BigNumber } from '@decentralchain/bignumber';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Avatar, Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
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
  const gatewayAssets: GatewayAsset[] = Object.keys(gateway || {}).map((assetId) => {
    const assetInfo: { displayName?: string; name?: string; ticker?: string; precision?: number; icon?: string; [key: string]: unknown } =
      (assets as unknown as Record<string, { displayName?: string; name?: string; ticker?: string; precision?: number; icon?: string; [key: string]: unknown }>)[assetId] || {};
    const balance = balances[assetId] || new BigNumber(0);

    return {
      assetId,
      name: String(assetInfo.displayName || assetInfo.name || 'Unknown Asset'),
      ticker: String(assetInfo.ticker || assetId.substring(0, 8)),
      decimals: Number(assetInfo.precision || 8),
      icon: assetInfo.icon,
      balance,
      hasDeposit: true, // All gateway assets support deposit
      hasWithdraw: true, // All gateway assets support withdraw
    };
  });

  // Handle case where no gateway assets are configured
  if (gatewayAssets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Gateway Assets Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gateway assets are not configured for this network
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {gatewayAssets.map((asset) => (
        <Grid
          key={asset.assetId}
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              {/* Asset Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={asset.icon}
                  sx={{
                    mr: 2,
                    width: 48,
                    height: 48,
                    bgcolor: 'primary.main',
                  }}
                >
                  {asset.ticker[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {asset.ticker}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {asset.name}
                  </Typography>
                </Box>
              </Box>

              {/* Balance Display */}
              <Box
                sx={{
                  bgcolor: 'background.default',
                  p: 1.5,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Your Balance
                </Typography>
                <Typography variant="h6" component="div">
                  {asset.balance.toFixed()} {asset.ticker}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1}>
                {asset.hasDeposit && (
                  <Button
                    variant="outlined"
                    size="medium"
                    fullWidth
                    startIcon={<ArrowDownward />}
                    onClick={() => onDeposit(asset)}
                    sx={{
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        borderColor: 'success.dark',
                        bgcolor: 'success.light',
                      },
                    }}
                  >
                    Deposit
                  </Button>
                )}
                {asset.hasWithdraw && (
                  <Button
                    variant="outlined"
                    size="medium"
                    fullWidth
                    startIcon={<ArrowUpward />}
                    onClick={() => onWithdraw(asset)}
                    disabled={asset.balance.lte(0)}
                    sx={{
                      borderColor: 'warning.main',
                      color: 'warning.main',
                      '&:hover': {
                        borderColor: 'warning.dark',
                        bgcolor: 'warning.light',
                      },
                      '&:disabled': {
                        borderColor: 'grey.300',
                        color: 'grey.400',
                      },
                    }}
                  >
                    Withdraw
                  </Button>
                )}
              </Stack>

              {/* Zero Balance Hint */}
              {asset.balance.lte(0) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block', textAlign: 'center' }}
                >
                  Deposit {asset.ticker} to enable withdrawals
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
