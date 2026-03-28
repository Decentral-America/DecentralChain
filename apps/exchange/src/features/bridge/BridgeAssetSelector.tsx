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
  const gatewayAssets: GatewayAsset[] = Object.keys(gateway ?? {}).map((assetId) => {
    const assetInfo: {
      displayName?: string;
      name?: string;
      ticker?: string;
      precision?: number;
      icon?: string;
      [key: string]: unknown;
    } =
      (
        assets as unknown as Record<
          string,
          {
            displayName?: string;
            name?: string;
            ticker?: string;
            precision?: number;
            icon?: string;
            [key: string]: unknown;
          }
        >
      )[assetId] ?? {};
    const balance = balances[assetId] ?? new BigNumber(0);

    return {
      assetId,
      balance,
      decimals: Number(assetInfo.precision ?? 8),
      hasDeposit: true, // All gateway assets support deposit
      hasWithdraw: true, // All gateway assets support withdraw
      icon: assetInfo.icon,
      name: String(assetInfo.displayName ?? assetInfo.name ?? 'Unknown Asset'),
      ticker: String(assetInfo.ticker ?? assetId.substring(0, 8)),
    };
  });

  // Handle case where no gateway assets are configured
  if (gatewayAssets.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
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
            md: 4,
            sm: 6,
            xs: 12,
          }}
        >
          <Card
            sx={{
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-4px)',
              },
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              {/* Asset Header */}
              <Box sx={{ alignItems: 'center', display: 'flex', mb: 2 }}>
                <Avatar
                  src={asset.icon}
                  sx={{
                    bgcolor: 'primary.main',
                    height: 48,
                    mr: 2,
                    width: 48,
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
                  borderRadius: 1,
                  mb: 2,
                  p: 1.5,
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
                      '&:hover': {
                        bgcolor: 'success.light',
                        borderColor: 'success.dark',
                      },
                      borderColor: 'success.main',
                      color: 'success.main',
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
                      '&:disabled': {
                        borderColor: 'grey.300',
                        color: 'grey.400',
                      },
                      '&:hover': {
                        bgcolor: 'warning.light',
                        borderColor: 'warning.dark',
                      },
                      borderColor: 'warning.main',
                      color: 'warning.main',
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
                  sx={{ display: 'block', mt: 1, textAlign: 'center' }}
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
