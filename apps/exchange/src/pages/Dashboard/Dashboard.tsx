/**
 * Dashboard Page
 * Overview page with portfolio summary, recent activity, and quick actions
 * Matches landing page styling with modern cards and gradients
 */

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
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
import { useNavigate } from 'react-router-dom';
import { useAddressTransactions } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { AssetNameDisplay } from '@/components/common/AssetNameDisplay';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { useAuth } from '@/contexts/AuthContext';
import { SendAssetModalModern } from '@/features/wallet/SendAssetModalModern';
import { useAliases } from '@/hooks/useAliases';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { landingTheme } from '@/theme/landingTheme';
import { formatAmount } from '@/utils/formatters';

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
        assetId: 'DCC',
        amount: balances.available,
        name: 'DecentralChain',
        decimals: 8,
        isBaseAsset: true,
      });
    }

    // Add all other tokens
    if (balances?.assets && assetDetails) {
      const tokenAssets = Object.entries(balances.assets).map(([assetId, amount]) => {
        const details = assetDetails.find((d) => d.assetId === assetId);
        return {
          assetId,
          amount: amount as number,
          name: details?.name || `${assetId.substring(0, 8)}...`,
          decimals: details?.decimals || 8,
          isBaseAsset: false,
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
      assetId: asset.assetId === 'DCC' ? 'DCC' : asset.assetId,
      assetName: asset.name,
      assetDecimals: asset.decimals,
      availableBalance: amount.toString(),
    });
    setSendModalOpen(true);
  };

  // Process recent transactions
  const recentActivity = useMemo(() => {
    if (!transactionsData || !user?.address) return [];

    // Flatten the nested array structure
    const flatTransactions = transactionsData.flat();

    return flatTransactions.slice(0, 3).map((tx: { type?: number; recipient?: string; amount?: number; assetId?: string | null; timestamp?: number; id?: string; [key: string]: unknown }) => {
      const isReceived = tx.recipient === user.address;

      let type = 'Transaction';
      let amount = '';
      let assetId: string | null = null;
      const status = 'completed';

      // Determine transaction type and amount
      if (tx.type === 4) {
        // Transfer
        type = isReceived ? 'Received' : 'Sent';
        const txAmount = tx.amount ? tx.amount / 10 ** 8 : 0;
        assetId = tx.assetId || null;
        amount = `${isReceived ? '+' : '-'}${formatAmount(txAmount)}`;
      } else if (tx.type === 7) {
        // Exchange (Swap)
        type = 'Swap';
        amount = 'Token Exchange';
      } else if (tx.type === 8) {
        // Lease
        type = 'Leased';
        const txAmount = tx.amount ? tx.amount / 10 ** 8 : 0;
        amount = `${formatAmount(txAmount)} DCC`;
      } else if (tx.type === 9) {
        // Lease Cancel
        type = 'Lease Cancelled';
        amount = 'Lease Return';
      }

      // Calculate time ago
      const time = tx.timestamp
        ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })
        : 'Unknown time';

      return {
        type,
        amount,
        assetId,
        time,
        status,
        isReceived,
        txId: tx.id as string,
      };
    });
  }, [transactionsData, user?.address]);

  // Quick action cards
  const quickActions = [
    {
      icon: <SendIcon sx={{ fontSize: 32 }} />,
      title: 'Send',
      description: 'Transfer assets',
      action: () => navigate('/desktop/wallet/portfolio'),
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      icon: <SwapHorizIcon sx={{ fontSize: 32 }} />,
      title: 'Swap',
      description: 'Exchange tokens',
      action: () => navigate('/desktop/dex'),
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: <BadgeIcon sx={{ fontSize: 32 }} />,
      title: 'Create Alias',
      description: `${aliases.length} ${aliases.length === 1 ? 'alias' : 'aliases'}`,
      action: () => setCreateAliasOpen(true),
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      icon: <TokenIcon sx={{ fontSize: 32 }} />,
      title: 'Create Token',
      description: 'Issue new asset',
      action: () => navigate('/desktop/create-token'),
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      icon: <ShowChartIcon sx={{ fontSize: 32 }} />,
      title: 'Analytics',
      description: 'View insights',
      action: () => navigate('/desktop/analytics'),
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  return (
    <ThemeProvider theme={landingTheme}>
      <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
            Welcome back, {user?.name || 'Trader'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here&apos;s an overview of your portfolio and recent activity
          </Typography>
        </Box>

        {/* Portfolio Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Balance Card */}
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Card
              sx={{
                background: 'white',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Total Portfolio Value
                      </Typography>
                      <Select
                        value={displayCurrency}
                        onChange={(e) => setDisplayCurrency(e.target.value)}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider',
                          },
                        }}
                      >
                        {availableCurrencies.map((currency) => (
                          <MenuItem key={currency.id} value={currency.id}>
                            {currency.id}
                          </MenuItem>
                        ))}
                      </Select>
                    </Stack>
                    <Typography variant="h3" fontWeight={700} color="text.primary">
                      {isLoading ? '...' : formatAmount(portfolioValueInDCC, 8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {displayCurrency}
                    </Typography>
                  </Box>
                  <AccountBalanceWalletIcon
                    sx={{ fontSize: 40, color: 'primary.main', opacity: 0.2 }}
                  />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`${totalAssets} ${totalAssets === 1 ? 'asset' : 'assets'}`}
                    size="small"
                    sx={{
                      bgcolor: '#ECFDF5',
                      color: 'primary.main',
                      fontWeight: 600,
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Assets Count Card */}
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Card
              sx={{
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} fontWeight={500}>
                  Total Assets
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary">
                  {totalAssets}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Different tokens in your wallet
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/desktop/wallet/portfolio')}
                  sx={{ mt: 2, px: 0, color: 'primary.main', fontWeight: 600 }}
                >
                  View Portfolio →
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Transactions Card */}
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Card
              sx={{
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} fontWeight={500}>
                  Recent Transactions
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary">
                  {recentActivity.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  In the last 24 hours
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/desktop/wallet/transactions')}
                  sx={{ mt: 2, px: 0, color: 'primary.main', fontWeight: 600 }}
                >
                  View All →
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Left Column - Quick Actions & Top Assets */}
          <Grid
            size={{
              xs: 12,
              lg: 8,
            }}
          >
            {/* Quick Actions */}
            <Card
              sx={{
                mb: 3,
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: 'text.primary' }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  {quickActions.map((action) => (
                    <Grid
                      key={action.title}
                      size={{
                        xs: 6,
                        sm: 3,
                      }}
                    >
                      <Card
                        sx={{
                          background: 'white',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            borderColor: 'primary.main',
                          },
                        }}
                        onClick={action.action}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                          <Box sx={{ color: 'primary.main', mb: 1 }}>{action.icon}</Box>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{ color: 'text.primary' }}
                          >
                            {action.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {action.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* All Assets with Filters */}
            <Card
              sx={{
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    My Assets
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/desktop/wallet/portfolio')}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    View Portfolio
                  </Button>
                </Stack>

                {/* Filter Tabs */}
                <Tabs
                  value={tokenFilter}
                  onChange={(_, newValue) => setTokenFilter(newValue)}
                  sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label={`All (${allAssets.length})`} value="all" sx={{ fontWeight: 600 }} />
                  <Tab
                    label="Verified"
                    value="verified"
                    icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                  <Tab
                    label="My Tokens"
                    value="my"
                    icon={<PersonIcon sx={{ fontSize: 16 }} />}
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                </Tabs>

                <Stack spacing={2}>
                  {filteredAssets.map((asset) => {
                    const amount = asset.amount / 10 ** asset.decimals;
                    return (
                      <Box
                        key={asset.assetId}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'background.default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: asset.isBaseAsset ? 'primary.main' : 'secondary.main',
                              color: 'white',
                            }}
                          >
                            {asset.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {asset.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {asset.isBaseAsset
                                ? 'Native Token'
                                : `${asset.assetId.substring(0, 8)}...`}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {formatAmount(amount, 8)}
                            </Typography>
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
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
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
                    <Box sx={{ textAlign: 'center', py: 4 }}>
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
          </Grid>

          {/* Right Column - Recent Activity */}
          <Grid
            size={{
              xs: 12,
              lg: 4,
            }}
          >
            <Card
              sx={{
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: 'text.primary' }}>
                  Recent Activity
                </Typography>
                <Stack spacing={2}>
                  {recentActivity.map((activity) => (
                    <Box
                      key={activity.txId}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        bgcolor: '#F9FAFB',
                        borderLeft: '3px solid',
                        borderColor: activity.type === 'Received' ? 'success.main' : 'primary.main',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                            {activity.type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {activity.amount}{' '}
                            {activity.type === 'Received' || activity.type === 'Sent' ? (
                              <AssetNameDisplay assetId={activity.assetId} />
                            ) : null}
                          </Typography>
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
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
                        sx={{ mt: 1, display: 'block' }}
                      >
                        {activity.time}
                      </Typography>
                      <Chip
                        label={activity.status}
                        size="small"
                        color="success"
                        sx={{ mt: 1, height: 20, fontSize: 10 }}
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
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Portfolio Breakdown
                </Typography>

                {/* Total Portfolio Value */}
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Value
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {formatAmount(portfolioValueInDCC, 8)} {displayCurrency}
                    </Typography>
                  </Stack>
                </Box>

                {/* Individual Assets Breakdown */}
                <Stack spacing={1.5}>
                  {allAssets.map((asset) => {
                    const amount = asset.amount / 10 ** asset.decimals;
                    return (
                      <Box
                        key={asset.assetId}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: 'background.default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: asset.isBaseAsset ? 'primary.main' : 'secondary.main',
                              fontSize: '0.875rem',
                            }}
                          >
                            {asset.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {asset.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {asset.isBaseAsset
                                ? 'Native Token'
                                : `${asset.assetId.substring(0, 6)}...`}
                            </Typography>
                          </Box>
                        </Stack>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {formatAmount(amount, 8)}
                          </Typography>
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
          </Grid>
        </Grid>
      </Box>
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
