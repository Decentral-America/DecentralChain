/**
 * Bridge Page
 * Cross-chain bridge interface for gateway operations
 * Enables deposits (external → DecentralChain) and withdrawals (DecentralChain → external)
 */

import { BigNumber } from '@decentralchain/bignumber';
import { InfoOutlined } from '@mui/icons-material';
import { Alert, Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import bnbIcon from 'cryptocurrency-icons/svg/color/bnb.svg';
// Crypto logos
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import ethIcon from 'cryptocurrency-icons/svg/color/eth.svg';
import solIcon from 'cryptocurrency-icons/svg/color/sol.svg';
import { Check, KeyRound, Link2, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { EmptyState } from '@/components/premium/EmptyState';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import { BRIDGE_SUPPORTED } from '@/config/bridge';
import { useAuth } from '@/contexts/AuthContext';
import { BridgeAssetSelector } from '@/features/bridge/BridgeAssetSelector';
import { DepositAsset } from '@/features/bridge/DepositAsset';
import { SolanaBridgePanel } from '@/features/bridge/SolanaBridgePanel';
import { WithdrawAsset } from '@/features/bridge/WithdrawAsset';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useGatewayTransaction } from '@/hooks/useGatewayTransaction';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';
import { networkBrandColor } from '@/styles/brandMarks';
import { radii } from '@/styles/tokens';

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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <PageFrame
        title="Cross-Chain Bridge"
        subtitle="Transfer assets between DecentralChain and external blockchains securely through our gateway infrastructure."
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: radii.cards,
            maxWidth: 520,
            mx: 'auto',
            width: '100%',
          }}
        >
          <EmptyState
            icons={[Wallet, KeyRound, Link2]}
            title="Authentication Required"
            description="Please log in to access the cross-chain bridge. You need an active wallet to transfer assets between DecentralChain and external blockchains."
            action={
              <Button variant="contained" component={RouterLink} to="/wallet">
                Go to Wallet
              </Button>
            }
          />
        </Box>
      </PageFrame>
    );
  }

  const network = SUPPORTED_NETWORKS.find((n) => n.id === selectedNetwork);

  return (
    <PageFrame
      title="Cross-Chain Bridge"
      subtitle="Transfer assets between DecentralChain and external blockchains securely through our gateway infrastructure."
    >
      <Stack spacing={pageRhythm}>
        {/* Network selector: one card per chain, a single selection. */}
        <Box component="section" aria-labelledby="bridge-network">
          <Typography
            id="bridge-network"
            variant="h6"
            sx={{ fontSize: 17, fontWeight: 600, mb: 1.5 }}
          >
            Select network
          </Typography>
          <Box
            role="radiogroup"
            aria-labelledby="bridge-network"
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                md: 'repeat(4, minmax(0, 1fr))',
                xs: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {SUPPORTED_NETWORKS.map((n) => {
              const selected = selectedNetwork === n.id && n.available;
              return (
                <ButtonBase
                  key={n.id}
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={!n.available || undefined}
                  disabled={!n.available}
                  onClick={() => n.available && setSelectedNetwork(n.id)}
                  sx={(theme) => ({
                    '&:active': n.available ? { transform: 'scale(0.97)' } : {},
                    '&:hover': n.available ? { bgcolor: 'action.hover' } : {},
                    '&.Mui-focusVisible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                    },
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: radii.cards,
                    boxShadow: selected
                      ? `inset 0 0 0 2px ${theme.palette.primary.main}`
                      : theme.palette.mode === 'dark'
                        ? `inset 0 0 0 1px ${theme.palette.divider}`
                        : 'var(--shadow-sm)',
                    display: 'flex',
                    gap: 1.5,
                    justifyContent: 'flex-start',
                    minHeight: 72,
                    px: 2,
                    py: 1.5,
                    textAlign: 'left',
                    transition: 'background-color 160ms, box-shadow 160ms, transform 160ms',
                  })}
                >
                  <Box
                    component="img"
                    src={n.icon}
                    alt=""
                    aria-hidden
                    sx={{
                      filter: n.available ? 'none' : 'grayscale(1)',
                      flexShrink: 0,
                      height: 40,
                      opacity: n.available ? 1 : 0.45,
                      width: 40,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: n.available ? 'text.primary' : 'text.secondary',
                        fontSize: 15,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {n.comingSoon ? 'Coming Soon' : n.ticker}
                    </Typography>
                  </Box>
                  {selected ? (
                    <Box
                      aria-hidden
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        color: 'primary.contrastText',
                        display: 'flex',
                        flexShrink: 0,
                        height: 20,
                        justifyContent: 'center',
                        width: 20,
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </Box>
                  ) : null}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        {/* Mode — gateway networks only; Solana owns its own. */}
        {selectedNetwork !== 'SOL' && (
          <Box>
            <SegmentedControl
              label="Bridge mode"
              value={mode}
              onValueChange={setMode}
              options={[
                { label: 'Deposit to DecentralChain', value: 'deposit' },
                { label: 'Withdraw to External', value: 'withdraw' },
              ]}
            />
          </Box>
        )}

        {/* Info Alert — same reason as the mode control above. */}
        {selectedNetwork !== 'SOL' && (
          <Alert severity="info" icon={<InfoOutlined />}>
            {mode === 'deposit' ? (
              <>
                <strong>Deposit Mode:</strong> Send {network?.name} assets to the gateway address.
                You&apos;ll receive wrapped tokens on DecentralChain after network confirmations.
              </>
            ) : (
              <>
                <strong>Withdraw Mode:</strong> Send wrapped tokens from DecentralChain to the
                gateway. You&apos;ll receive native {network?.name} assets after processing.
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
      </Stack>
    </PageFrame>
  );
};
