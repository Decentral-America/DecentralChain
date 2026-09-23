/**
 * Bridge Page
 * Cross-chain bridge interface for gateway operations
 * Enables deposits (external → DecentralChain) and withdrawals (DecentralChain → external)
 */

import { BigNumber } from '@decentralchain/bignumber';
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
import bnbIcon from 'cryptocurrency-icons/svg/color/bnb.svg';
// Crypto logos
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import ethIcon from 'cryptocurrency-icons/svg/color/eth.svg';
import solIcon from 'cryptocurrency-icons/svg/color/sol.svg';
import { useMemo, useState } from 'react';
import { BRIDGE_SUPPORTED } from '@/config/bridge';
import { useAuth } from '@/contexts/AuthContext';
import { BridgeAssetSelector } from '@/features/bridge/BridgeAssetSelector';
import { DepositAsset } from '@/features/bridge/DepositAsset';
import { SolanaBridgePanel } from '@/features/bridge/SolanaBridgePanel';
import { WithdrawAsset } from '@/features/bridge/WithdrawAsset';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useGatewayTransaction } from '@/hooks/useGatewayTransaction';
import { PageFrame } from '@/layouts/PageFrame';
import { networkBrandColor } from '@/styles/brandMarks';

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
    available: true,
    color: networkBrandColor.btc,
    icon: btcIcon,
    id: 'BTC',
    name: 'Bitcoin',
    ticker: 'BTC',
  },
  {
    // Live: the Solana bridge contracts and validators are deployed on
    // mainnet. Unlike the BTC gateway below, this path talks to the bridge
    // API and the Solana program directly — see features/bridge/SolanaBridge.
    //
    // Offered on mainnet builds only. Every address in config/bridge.ts is a
    // mainnet address regardless of VITE_NETWORK, so on testnet or stagenet
    // this entry would handed the user the mainnet contracts from a test-chain
    // UI. Shown as coming soon there rather than hidden, so the surface is
    // visibly accounted for instead of silently missing.
    available: BRIDGE_SUPPORTED,
    color: networkBrandColor.sol,
    ...(BRIDGE_SUPPORTED ? {} : { comingSoon: true }),
    icon: solIcon,
    id: 'SOL',
    name: 'Solana',
    ticker: 'SOL',
  },
  {
    available: false,
    color: networkBrandColor.eth,
    comingSoon: true,
    icon: ethIcon,
    id: 'ETH',
    name: 'Ethereum',
    ticker: 'ETH',
  },
  {
    available: false,
    color: networkBrandColor.bnb,
    comingSoon: true,
    icon: bnbIcon,
    id: 'BSC',
    name: 'BNB Smart Chain',
    ticker: 'BNB',
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

  // Live wallet balances — polled every 5 s while page is open
  const { balances: rawBalances } = useBalanceWatcher({
    enabled: !!user?.address,
    interval: 5000,
  });

  /**
   * The bridge works in raw integer units — BigInt, not BigNumber — because
   * every amount it handles is base units and float error is unacceptable at
   * a balance. The gateway path below keeps its BigNumber view.
   */
  const solanaBalancesRaw = useMemo((): Record<string, bigint> => {
    if (!rawBalances?.assets) return {};
    return Object.fromEntries(
      Object.entries(rawBalances.assets).map(([assetId, amount]) => [
        assetId,
        BigInt(Math.trunc(Number(amount))),
      ]),
    );
  }, [rawBalances]);

  const dccBalanceRaw = useMemo(
    (): bigint => BigInt(Math.trunc(Number(rawBalances?.balance ?? 0))),
    [rawBalances],
  );

  // Convert number → BigNumber for BridgeAssetSelector
  const balances = useMemo((): Record<string, BigNumber> => {
    if (!rawBalances?.assets) return {};
    return Object.fromEntries(
      Object.entries(rawBalances.assets).map(([assetId, amount]) => [
        assetId,
        new BigNumber(amount),
      ]),
    );
  }, [rawBalances]);

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
      amount,
      assetId: selectedAsset.assetId,
      attachment,
      gatewayAddress: '3P...', // This comes from getWithdrawDetails in WithdrawAsset modal
      targetAddress,
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
      <Box
        sx={{
          bgcolor: 'background.default',
          minHeight: '100svh',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Login sx={{ color: 'primary.main', fontSize: 64, mb: 2 }} />
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 600,
              }}
            >
              Authentication Required
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 3,
              }}
            >
              Please log in to access the cross-chain bridge. You need an active wallet to transfer
              assets between DecentralChain and external blockchains.
            </Typography>
            <Button variant="contained" size="large" href="/wallet">
              Go to Wallet
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <PageFrame
      title="Cross-Chain Bridge"
      subtitle="Transfer assets between DecentralChain and external blockchains securely through our gateway infrastructure."
    >
      <Container maxWidth="xl">
        {/* Network Selector */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Network
          </Typography>
          <Grid container spacing={1}>
            {SUPPORTED_NETWORKS.map((network) => (
              <Grid
                key={network.id}
                size={{
                  md: 'auto',
                  sm: 3,
                  xs: 6,
                }}
              >
                <Card
                  onClick={() => network.available && setSelectedNetwork(network.id)}
                  sx={{
                    '&:hover': network.available
                      ? {
                          boxShadow: 1,
                        }
                      : {},
                    border: 1,
                    borderColor: selectedNetwork === network.id ? network.color : 'transparent',
                    cursor: network.available ? 'pointer' : 'not-allowed',
                    opacity: network.available ? 1 : 0.6,
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent
                    sx={{
                      '&:last-child': { pb: 1 },
                      alignItems: 'center',
                      display: 'flex',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={network.icon}
                      alt=""
                      aria-hidden
                      sx={{ display: 'block', flexShrink: 0, height: 20, width: 20 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {network.name}
                    </Typography>
                    {selectedNetwork === network.id && network.available && (
                      <CheckCircle
                        sx={{
                          color: network.color,
                          fontSize: 16,
                          position: 'static',
                          right: 8,
                          top: 8,
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

        {/* Mode Toggle — gateway networks only; Solana owns its own. */}
        {selectedNetwork !== 'SOL' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={handleModeChange}
              aria-label="Bridge mode"
              sx={{
                '& .MuiToggleButton-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
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
        )}

        {/* Info Alert — same reason as the toggle above. */}
        {selectedNetwork !== 'SOL' && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ maxWidth: 800, mb: 4, mx: 'auto' }}>
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
        )}

        {/*
          Solana and the BTC gateway are different systems that happen to share
          this page. The gateway path reads its assets from network config;
          Solana reads them from the bridge API, which is the only source that
          knows what is currently safe to offer.
        */}
        {selectedNetwork === 'SOL' ? (
          /*
            The Solana panel carries its own direction toggle — the page's
            deposit/withdraw switch belongs to the BTC gateway, which has a
            different flow on each side.
          */
          <SolanaBridgePanel
            assetBalancesRaw={solanaBalancesRaw}
            dccAddress={user.address}
            dccBalanceRaw={dccBalanceRaw}
          />
        ) : (
          <BridgeAssetSelector
            balances={balances}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
        )}

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
              decimals: selectedAsset.decimals,
              id: selectedAsset.assetId,
              name: selectedAsset.name,
              ticker: selectedAsset.ticker,
            }}
            balance={selectedAsset.balance}
            open={withdrawOpen}
            onClose={handleWithdrawClose}
            onWithdraw={handleWithdrawSubmit}
          />
        )}
      </Container>
    </PageFrame>
  );
};
