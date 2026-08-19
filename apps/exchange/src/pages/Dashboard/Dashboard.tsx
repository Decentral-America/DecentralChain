/**
 * Dashboard Page
 * Overview page with portfolio summary, recent activity, and quick actions
 * Flat cards, hairline dividers, and tabular figures throughout.
 */

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SendIcon from '@mui/icons-material/Send';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TokenIcon from '@mui/icons-material/Token';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAddressTransactions } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { StatCard } from '@/components/atoms/StatCard';
import { AssetNameDisplay } from '@/components/common/AssetNameDisplay';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { useAuth } from '@/contexts/AuthContext';
import { SendAssetModalModern } from '@/features/wallet/SendAssetModalModern';
import { useAliases } from '@/hooks/useAliases';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';
import { radii } from '@/styles/tokens';
import { landingTheme } from '@/theme/landingTheme';
import { formatAmount } from '@/utils/formatters';

interface DashboardTx {
  type?: number;
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  timestamp?: number;
  id?: string;
  [key: string]: unknown;
}

const TX_DISPLAY: Record<
  number,
  { type: string; getAmount: (tx: DashboardTx, received: boolean) => string }
> = {
  4: {
    getAmount: (tx, received) =>
      `${received ? '+' : '-'}${formatAmount(tx.amount ? tx.amount / 10 ** 8 : 0)}`,
    type: 'transfer',
  },
  7: { getAmount: () => 'Token Exchange', type: 'Swap' },
  8: {
    getAmount: (tx) => `${formatAmount(tx.amount ? tx.amount / 10 ** 8 : 0)} DCC`,
    type: 'Leased',
  },
  9: { getAmount: () => 'Lease Return', type: 'Lease Cancelled' },
};

function mapTxToActivity(tx: DashboardTx, userAddress: string) {
  const isReceived = tx.recipient === userAddress;
  const display = TX_DISPLAY[tx.type ?? 0];
  const type = display
    ? tx.type === 4
      ? isReceived
        ? 'Received'
        : 'Sent'
      : display.type
    : 'Transaction';
  const amount = display?.getAmount(tx, isReceived) ?? '';
  const time = tx.timestamp
    ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })
    : 'Unknown time';

  return {
    amount,
    // biome-ignore lint/nursery/useNullishCoalescing: assetId='' means native DCC asset — semantic || fallback to null is intentional
    assetId: tx.assetId || null,
    isReceived,
    status: 'completed',
    time,
    txId: tx.id as string,
    type,
  };
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balances, isLoading } = useBalanceWatcher({ interval: 30000 });
  const { aliases } = useAliases();
  const [createAliasOpen, setCreateAliasOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string>('DCC'); // Currency to display values in
  const [tokenFilter, setTokenFilter] = useState<'all' | 'verified' | 'my'>('all'); // Token filter
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    assetId: string;
    assetName: string;
    assetDecimals: number;
    availableBalance: string;
  } | null>(null);

  // Fetch recent transactions (last 10)
  const { data: transactionsData } = useAddressTransactions(user?.address || '', 10, {
    enabled: !!user?.address,
  });

  // Calculate values
  const assetCount = balances?.assets ? Object.keys(balances.assets).length : 0;
  // Only count DCC if there's a balance, or if there are other assets
  const hasDCCBalance = balances?.available && balances.available > 0;
  const totalAssets = assetCount + (hasDCCBalance || assetCount > 0 ? 1 : 0);

  // Get DCC balance with full precision
  const dccBalance = balances?.available ? balances.available / 10 ** 8 : 0;

  // Calculate total portfolio value in selected currency
  const portfolioValueInDCC = useMemo(() => {
    const total = dccBalance;

    // For now, we'll just show DCC value
    // In the future, this could convert to USD or other currencies via price API
    return total;
  }, [dccBalance]);

  // Get available currencies for the selector (tokens with balance)
  const availableCurrencies = useMemo(() => {
    const currencies = [{ id: 'DCC', name: 'DecentralChain (DCC)' }];
    // Could add other tokens here if we implement token-to-token valuation
    return currencies;
  }, []);

  // Get ALL asset IDs for fetching details
  const allAssetIds = useMemo(() => {
    if (!balances?.assets) return [];
    return Object.keys(balances.assets);
  }, [balances?.assets]);

  // Fetch asset details for ALL assets
  const { data: assetDetails } = useMultipleAssetDetails(allAssetIds, {
    enabled: allAssetIds.length > 0,
  });

  // Map ALL assets with details
  const allAssets = useMemo(() => {
    const assets = [];

    // Add DCC as the first asset if there's a balance
    if (balances?.available && balances.available > 0) {
      assets.push({
        amount: balances.available,
        assetId: 'DCC',
        decimals: 8,
        isBaseAsset: true,
        name: 'DecentralChain',
      });
    }

    // Add all other tokens
    if (balances?.assets && assetDetails) {
      const tokenAssets = Object.entries(balances.assets).map(([assetId, amount]) => {
        const details = assetDetails.find((d) => d.assetId === assetId);
        return {
          amount: amount as number,
          assetId,
          decimals: details?.decimals || 8,
          isBaseAsset: false,
          name: details?.name || `${assetId.substring(0, 8)}...`,
        };
      });

      // Sort by amount descending
      tokenAssets.sort((a, b) => {
        const aValue = a.amount / 10 ** a.decimals;
        const bValue = b.amount / 10 ** b.decimals;
        return bValue - aValue;
      });

      assets.push(...tokenAssets);
    }

    return assets;
  }, [balances, assetDetails]);

  // Filter assets based on selected filter
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      if (tokenFilter === 'all') return true;
      // For 'verified' and 'my', we would need additional data from the API
      // For now, show all - this can be enhanced with oracle data and creator info
      if (tokenFilter === 'verified') {
        // Would need to check oracle verification status
        return true; // Placeholder
      }
      if (tokenFilter === 'my') {
        // Would need to check if user created this token
        return asset.isBaseAsset; // Placeholder - only show DCC for now
      }
      return true;
    });
  }, [allAssets, tokenFilter]);

  // Handler to open send modal with selected asset
  const handleSendAsset = (asset: (typeof allAssets)[0]) => {
    const amount = asset.amount / 10 ** asset.decimals;
    setSelectedAsset({
      assetDecimals: asset.decimals,
      assetId: asset.assetId === 'DCC' ? 'DCC' : asset.assetId,
      assetName: asset.name,
      availableBalance: amount.toString(),
    });
    setSendModalOpen(true);
  };

  // Process recent transactions
  const recentActivity = useMemo(() => {
    if (!transactionsData || !user?.address) return [];
    return transactionsData
      .flat()
      .slice(0, 3)
      .map(
        (tx: {
          type?: number;
          recipient?: string;
          amount?: number;
          assetId?: string | null;
          timestamp?: number;
          id?: string;
          [key: string]: unknown;
        }) => mapTxToActivity(tx, user.address),
      );
  }, [transactionsData, user?.address]);

  // Quick action cards
  const quickActions = [
    {
      action: () => navigate('/desktop/wallet/portfolio'),
      description: 'Transfer assets',
      icon: <SendIcon sx={{ fontSize: 32 }} />,
      title: 'Send',
    },
    {
      action: () => navigate('/desktop/dex'),
      description: 'Exchange tokens',
      icon: <SwapHorizIcon sx={{ fontSize: 32 }} />,
      title: 'Swap',
    },
    {
      action: () => setCreateAliasOpen(true),
      description: `${aliases.length} ${aliases.length === 1 ? 'alias' : 'aliases'}`,
      icon: <BadgeIcon sx={{ fontSize: 32 }} />,
      title: 'Create Alias',
    },
    {
      action: () => navigate('/desktop/create-token'),
      description: 'Issue new asset',
      icon: <TokenIcon sx={{ fontSize: 32 }} />,
      title: 'Create Token',
    },
    {
      action: () => navigate('/desktop/analytics'),
      description: 'View insights',
      icon: <ShowChartIcon sx={{ fontSize: 32 }} />,
      title: 'Analytics',
    },
  ];

  return (
    <ThemeProvider theme={landingTheme}>
      <PageFrame
        fit
        title={`Welcome back, ${user?.name || 'Trader'}`}
        subtitle="Here's an overview of your portfolio and recent activity"
      >
        {/* Portfolio Summary Cards */}
        <Grid container spacing={pageRhythm} sx={{ flexShrink: 0, mb: pageRhythm }}>
          {/* Total Balance Card */}
          <Grid size={{ md: 4, xs: 12 }}>
            <StatCard
              icon={<AccountBalanceWalletIcon />}
              label="Total portfolio value"
              value={isLoading ? '—' : formatAmount(portfolioValueInDCC, 8)}
              caption={displayCurrency}
              adornment={
                <Select
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value)}
                  size="small"
                  aria-label="Display currency"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                    fontSize: '0.75rem',
                  }}
                >
                  {availableCurrencies.map((currency) => (
                    <MenuItem key={currency.id} value={currency.id}>
                      {currency.id}
                    </MenuItem>
                  ))}
                </Select>
              }
              action={
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${totalAssets} ${totalAssets === 1 ? 'asset' : 'assets'}`}
                  size="small"
                  sx={{ bgcolor: 'action.selected', color: 'primary.main' }}
                />
              }
            />
          </Grid>

          <Grid size={{ md: 4, sm: 6, xs: 12 }}>
            <StatCard
              icon={<Inventory2OutlinedIcon />}
              tone="positive"
              label="Total assets"
              value={totalAssets}
              caption="Different tokens in your wallet"
              action={
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/desktop/wallet/portfolio')}
                  sx={{ color: 'primary.main', px: 0 }}
                >
                  View portfolio →
                </Button>
              }
            />
          </Grid>

          <Grid size={{ md: 4, sm: 6, xs: 12 }}>
            <StatCard
              icon={<ReceiptLongIcon />}
              tone="notice"
              label="Recent transactions"
              value={recentActivity.length}
              caption="In the last 24 hours"
              action={
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/desktop/wallet/transactions')}
                  sx={{ color: 'primary.main', px: 0 }}
                >
                  View all →
                </Button>
              }
            />
          </Grid>
        </Grid>

        {/*
          One grid, not two stacks.
          The two columns used to be independent: each card followed whatever
          was above it in its own column, so from the second row down nothing
          lined up — a 239px card beside a 183px one put the next pair 57px out
          of step. Placing all four in a single grid makes each row resolve to
          one height, which is the whole difference between a dashboard and
          four cards that happen to be near each other.
        */}
        <Box
          sx={{
            display: 'grid',
            flex: 1,
            gap: pageRhythm,
            gridTemplateColumns: { lg: 'minmax(0, 2fr) minmax(0, 1fr)', xs: 'minmax(0, 1fr)' },
            // The lists in the second row take the room that is left and scroll
            // inside their cards, so the dashboard is one screen.
            gridTemplateRows: { lg: 'auto minmax(0, 1fr)' },
            minHeight: 0,
          }}
        >
          {/* Quick Actions */}
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              gridColumn: { lg: 1 },
              gridRow: { lg: 1 },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 3 }}>
                Quick Actions
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  /*
                   * Column count follows the width available rather than a
                   * fixed twelve-column split, so five tiles fill the row
                   * instead of leaving one stranded underneath. 128px is the
                   * widest minimum that still fits five across the 754px this
                   * column gets at 1512, measured rather than guessed; below
                   * that width it falls to four and wraps, which is correct.
                   */
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(128px, 100%), 1fr))',
                }}
              >
                {quickActions.map((action) => (
                  <Card
                    key={action.title}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                      cursor: 'pointer',
                      height: '100%',
                      transition: 'background-color 150ms ease, border-color 150ms ease',
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ '&:last-child': { pb: 2.5 }, p: 2.5 }}>
                      {/* The same tinted plate the summary figures carry. */}
                      <Box
                        aria-hidden="true"
                        sx={{
                          '& svg': { fontSize: 18 },
                          alignItems: 'center',
                          bgcolor: 'action.selected',
                          borderRadius: radii.md,
                          color: 'primary.main',
                          display: 'flex',
                          height: 34,
                          justifyContent: 'center',
                          mb: 1.5,
                          width: 34,
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Typography sx={{ color: 'text.primary', fontSize: 15 }}>
                        {action.title}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.25 }}>
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* All Assets with Filters */}
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              gridColumn: { lg: 1 },
              gridRow: { lg: 2 },
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
              >
                <Typography variant="h6" color="text.primary">
                  My Assets
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/desktop/wallet/portfolio')}
                  sx={{
                    borderRadius: '4px',
                  }}
                >
                  View Portfolio
                </Button>
              </Stack>

              {/* Filter Tabs */}
              <Tabs
                value={tokenFilter}
                onChange={(_, newValue) => setTokenFilter(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label={`All (${allAssets.length})`} value="all" />
                <Tab
                  label="Verified"
                  value="verified"
                  icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                />
                <Tab
                  label="My Tokens"
                  value="my"
                  icon={<PersonIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                />
              </Tabs>

              <Stack spacing={2}>
                {filteredAssets.map((asset) => {
                  const amount = asset.amount / 10 ** asset.decimals;
                  return (
                    <Box
                      key={asset.assetId}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)',
                        },
                        alignItems: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 2,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: asset.isBaseAsset ? 'primary.main' : 'secondary.main',
                            // `secondary.main` (accent.muted) is light in light
                            // mode; a hardcoded 'white' is unreadable there
                            // (~1.2:1). See task-2-report.md, Fix round 2.
                            color: asset.isBaseAsset
                              ? 'primary.contrastText'
                              : 'secondary.contrastText',
                            height: 40,
                            width: 40,
                          }}
                        >
                          {asset.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">{asset.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.isBaseAsset
                              ? 'Native Token'
                              : `${asset.assetId.substring(0, 8)}...`}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle2">{formatAmount(amount, 8)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.isBaseAsset ? 'DCC' : asset.name}
                          </Typography>
                        </Box>
                        <Tooltip title={`Send ${asset.name}`}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSendAsset(asset)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                            }}
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  );
                })}
                {allAssets.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No assets found</Typography>
                    <Button
                      variant="contained"
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/desktop/wallet/portfolio')}
                    >
                      View Portfolio
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
          {/* Recent Activity */}
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              gridColumn: { lg: 2 },
              gridRow: { lg: 1 },
            }}
          >
            {/*
              The row is as tall as the widest card in it, so the trailing
              action is pushed to the bottom rather than leaving the remainder
              as dead space under a short list.
            */}
            <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 3 }}>
                Recent Activity
              </Typography>
              <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {recentActivity.length === 0 ? (
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                    Nothing yet. Transfers, orders and leases will appear here as they confirm.
                  </Typography>
                ) : null}
                {recentActivity.map((activity) => (
                  <Box
                    key={activity.txId}
                    sx={{
                      bgcolor: 'action.hover',
                      borderColor: activity.type === 'Received' ? 'success.main' : 'primary.main',
                      borderLeft: '3px solid',
                      borderRadius: '4px',
                      p: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.primary">
                          {activity.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {activity.amount}{' '}
                          {activity.type === 'Received' || activity.type === 'Sent' ? (
                            <AssetNameDisplay assetId={activity.assetId} />
                          ) : null}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        {activity.type === 'Received' ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                      </Stack>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {activity.time}
                    </Typography>
                    <Chip
                      label={activity.status}
                      size="small"
                      color="success"
                      sx={{ fontSize: 10, height: 20, mt: 1 }}
                    />
                  </Box>
                ))}
              </Stack>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 3 }}
                onClick={() => navigate('/desktop/wallet/transactions')}
                startIcon={<ReceiptLongIcon />}
              >
                View All Transactions
              </Button>
            </CardContent>
          </Card>

          {/* Portfolio Breakdown Card */}
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              gridColumn: { lg: 2 },
              gridRow: { lg: 2 },
            }}
          >
            <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Portfolio Breakdown
              </Typography>

              {/* Total Portfolio Value */}
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  color: 'primary.contrastText',
                  mb: 2,
                  p: 2,
                }}
              >
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Value
                  </Typography>
                  <Typography variant="h6">
                    {formatAmount(portfolioValueInDCC, 8)} {displayCurrency}
                  </Typography>
                </Stack>
              </Box>

              {/* Individual Assets Breakdown */}
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {allAssets.map((asset) => {
                  const amount = asset.amount / 10 ** asset.decimals;
                  return (
                    <Box
                      key={asset.assetId}
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 1.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: asset.isBaseAsset ? 'primary.main' : 'secondary.main',
                            // Without an explicit `color`, MUI's Avatar default
                            // ink is `background.default`, which is unreadable
                            // on `secondary.main` in both modes (~1.1-1.9:1).
                            // See task-2-report.md, Fix round 2.
                            color: asset.isBaseAsset
                              ? 'primary.contrastText'
                              : 'secondary.contrastText',
                            fontSize: '0.875rem',
                            height: 32,
                            width: 32,
                          }}
                        >
                          {asset.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{asset.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.isBaseAsset
                              ? 'Native Token'
                              : `${asset.assetId.substring(0, 6)}...`}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">{formatAmount(amount, 8)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.isBaseAsset ? 'DCC' : asset.name}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 3 }}
                onClick={() => navigate('/desktop/wallet/portfolio')}
                startIcon={<AccountBalanceWalletIcon />}
              >
                View Full Portfolio
              </Button>
            </CardContent>
          </Card>
        </Box>
      </PageFrame>
      <CreateAliasModal
        open={createAliasOpen}
        onClose={() => setCreateAliasOpen(false)}
        onSuccess={() => {
          setCreateAliasOpen(false);
        }}
      />
      {/* Send Asset Modal */}
      {selectedAsset && (
        <SendAssetModalModern
          isOpen={sendModalOpen}
          onClose={() => {
            setSendModalOpen(false);
            setSelectedAsset(null);
          }}
          assetId={selectedAsset.assetId}
          assetName={selectedAsset.assetName}
          assetDecimals={selectedAsset.assetDecimals}
          availableBalance={selectedAsset.availableBalance}
        />
      )}
    </ThemeProvider>
  );
};
