/**
 * Bridge Page
 * Cross-chain bridge interface for gateway operations
 * Enables deposits (external → DecentralChain) and withdrawals (DecentralChain → external)
 */

import { type BigNumber } from '@decentralchain/bignumber';
import { CheckCircle, InfoOutlined, Login } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import bnbIcon from 'cryptocurrency-icons/svg/color/bnb.svg';
// Crypto logos
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import ethIcon from 'cryptocurrency-icons/svg/color/eth.svg';
import solIcon from 'cryptocurrency-icons/svg/color/sol.svg';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BridgeAssetSelector } from '@/features/bridge/BridgeAssetSelector';
import { DepositAsset } from '@/features/bridge/DepositAsset';
import { WithdrawAsset } from '@/features/bridge/WithdrawAsset';
import { useGatewayTransaction } from '@/hooks/useGatewayTransaction';
import { landingTheme } from '@/theme/landingTheme';

interface SelectedAsset {
  assetId: string;
  name: string;
  ticker: string;
  decimals: number;
  icon?: string | undefined;
  balance: BigNumber;
}

interface SupportedNetwork {
  id: string;
  name: string;
  ticker: string;
  color: string;
  icon: string;
  available: boolean;
  comingSoon?: boolean;
}

// Supported networks configuration
const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    id: 'BTC',
    name: 'Bitcoin',
    ticker: 'BTC',
    color: '#F7931A',
    icon: btcIcon,
    available: true,
  },
  {
    id: 'SOL',
    name: 'Solana',
    ticker: 'SOL',
    color: '#14F195',
    icon: solIcon,
    available: false,
    comingSoon: true,
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    ticker: 'ETH',
    color: '#627EEA',
    icon: ethIcon,
    available: false,
    comingSoon: true,
  },
  {
    id: 'BSC',
    name: 'BNB Smart Chain',
    ticker: 'BNB',
    color: '#F0B90B',
    icon: bnbIcon,
    available: false,
    comingSoon: true,
  },
];

export const Bridge: React.FC = () => {
  const { user } = useAuth();
  const { withdraw } = useGatewayTransaction();

  // UI State
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('BTC');
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Balances - TODO: integrate with actual balance hook when available
  const balances: Record<string, BigNumber> = {};

  /**
   * Handle deposit button click
   */
  const handleDeposit = (asset: SelectedAsset) => {
    setSelectedAsset(asset);
    setDepositOpen(true);
  };

  /**
   * Handle withdraw button click
   */
  const handleWithdraw = (asset: SelectedAsset) => {
    setSelectedAsset(asset);
    setWithdrawOpen(true);
  };

  /**
   * Handle withdrawal transaction submission
   */
  const handleWithdrawSubmit = async (
    amount: BigNumber,
    targetAddress: string,
    attachment: string,
  ) => {
    if (!selectedAsset) return;

    // The gateway address and attachment are determined by WithdrawAsset modal
    // via getWithdrawDetails call, so we just pass them through
    await withdraw({
      assetId: selectedAsset.assetId,
      amount,
      targetAddress,
      gatewayAddress: '3P...', // This comes from getWithdrawDetails in WithdrawAsset modal
      attachment,
    });
  };

  /**
   * Close deposit modal
   */
  const handleDepositClose = () => {
    setDepositOpen(false);
    setSelectedAsset(null);
  };

  /**
   * Close withdraw modal
   */
  const handleWithdrawClose = () => {
    setWithdrawOpen(false);
    setSelectedAsset(null);
  };

  /**
   * Handle mode toggle change
   */
  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'deposit' | 'withdraw' | null,
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <ThemeProvider theme={landingTheme}>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            py: 4,
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              <Login sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Authentication Required
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please log in to access the cross-chain bridge. You need an active wallet to
                transfer assets between DecentralChain and external blockchains.
              </Typography>
              <Button variant="contained" size="large" href="/wallet">
                Go to Wallet
              </Button>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Cross-Chain Bridge
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Transfer assets between DecentralChain and external blockchains securely through our
              gateway infrastructure
            </Typography>
          </Box>

          {/* Network Selector */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
              Select Network
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {SUPPORTED_NETWORKS.map((network) => (
                <Grid
                  key={network.id}
                  size={{
                    xs: 6,
                    sm: 4,
                    md: 3,
                  }}
                >
                  <Card
                    onClick={() => network.available && setSelectedNetwork(network.id)}
                    sx={{
                      cursor: network.available ? 'pointer' : 'not-allowed',
                      opacity: network.available ? 1 : 0.6,
                      border: 2,
                      borderColor: selectedNetwork === network.id ? network.color : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative',
                      '&:hover': network.available
                        ? {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          }
                        : {},
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Box
                        component="img"
                        src={network.icon}
                        alt={`${network.name} logo`}
                        sx={{
                          width: 48,
                          height: 48,
                          mx: 'auto',
                          mb: 1,
                          display: 'block',
                        }}
                      />
                      <Typography variant="body1" fontWeight={600}>
                        {network.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {network.ticker}
                      </Typography>
                      {selectedNetwork === network.id && network.available && (
                        <CheckCircle
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: network.color,
                            fontSize: 24,
                          }}
                        />
                      )}
                      {network.comingSoon && (
                        <Chip label="Coming Soon" size="small" sx={{ mt: 1 }} variant="outlined" />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Mode Toggle */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={handleModeChange}
              aria-label="Bridge mode"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                },
              }}
            >
              <ToggleButton value="deposit" aria-label="Deposit mode">
                Deposit to DecentralChain
              </ToggleButton>
              <ToggleButton value="withdraw" aria-label="Withdraw mode">
                Withdraw to External
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Info Alert */}
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
            {mode === 'deposit' ? (
              <>
                <strong>Deposit Mode:</strong> Send{' '}
                {SUPPORTED_NETWORKS.find((n) => n.id === selectedNetwork)?.name} assets to the
                gateway address. You&apos;ll receive wrapped tokens on DecentralChain after network
                confirmations.
              </>
            ) : (
              <>
                <strong>Withdraw Mode:</strong> Send wrapped tokens from DecentralChain to the
                gateway. You&apos;ll receive native{' '}
                {SUPPORTED_NETWORKS.find((n) => n.id === selectedNetwork)?.name} assets after
                processing.
              </>
            )}
          </Alert>

          {/* Asset Selector Grid */}
          <BridgeAssetSelector
            balances={balances}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />

          {/* Deposit Modal */}
          {selectedAsset && (
            <DepositAsset
              asset={{
                id: selectedAsset.assetId,
                name: selectedAsset.name,
                ticker: selectedAsset.ticker,
              }}
              open={depositOpen}
              onClose={handleDepositClose}
            />
          )}

          {/* Withdraw Modal */}
          {selectedAsset && (
            <WithdrawAsset
              asset={{
                id: selectedAsset.assetId,
                name: selectedAsset.name,
                ticker: selectedAsset.ticker,
                decimals: selectedAsset.decimals,
              }}
              balance={selectedAsset.balance}
              open={withdrawOpen}
              onClose={handleWithdrawClose}
              onWithdraw={handleWithdrawSubmit}
            />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};
