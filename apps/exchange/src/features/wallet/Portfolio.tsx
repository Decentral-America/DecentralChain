import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import {
  SendOutlined,
  CallReceivedOutlined,
  TrendingUpOutlined,
  AccountBalanceWalletOutlined,
  ShowChartOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { waveletsToWaves } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { BalanceChart } from './BalanceChart';
import { SendAssetModalModern } from './SendAssetModalModern';
import { ReceiveAssetModalModern } from './ReceiveAssetModalModern';

const DCC_SYMBOL = 'DCC';

interface PortfolioAssetRow {
  assetId: string;
  name: string;
  amount: number;
  decimals: number;
  isBaseAsset: boolean;
}

interface SendModalState {
  assetId: string;
  assetName: string;
  assetDecimals: number;
  availableBalance: number;
}

const formatAmount = (value: number, maximumFractionDigits = 8): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
};

const shortenId = (id: string): string => {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
};

export const Portfolio = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sendModal, setSendModal] = useState<SendModalState | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const {
    balances,
    isLoading: isBalancesLoading,
    error: balancesError,
  } = useBalanceWatcher({ interval: 10000 });

  const assetEntries = useMemo(
    () => Object.entries(balances?.assets ?? {}) as Array<[string, number]>,
    [balances?.assets]
  );
  const assetIds = useMemo(() => assetEntries.map(([assetId]) => assetId), [assetEntries]);

  const {
    data: assetDetails,
    isLoading: isAssetDetailsLoading,
  } = useMultipleAssetDetails(assetIds, { enabled: assetIds.length > 0 });

  const assetDetailMap = useMemo(() => {
    if (!assetDetails) return new Map<string, { name: string; decimals: number }>();
    return new Map(
      assetDetails.map((detail) => [
        detail.assetId,
        { name: detail.name, decimals: detail.decimals },
      ])
    );
  }, [assetDetails]);

  const baseBalanceWavelets = balances?.available ?? balances?.balance ?? 0;
  const baseBalance = waveletsToWaves(baseBalanceWavelets);
  const effectiveBalance = waveletsToWaves(balances?.effective ?? balances?.balance ?? 0);
  const leasedOut = waveletsToWaves(balances?.leaseOut ?? 0);
  const leasedIn = waveletsToWaves(balances?.leaseIn ?? 0);
  const leased = Math.max(leasedOut - leasedIn, 0);

  const baseAssetRow = useMemo<PortfolioAssetRow>(
    () => ({
      assetId: DCC_SYMBOL,
      name: 'DecentralChain',
      amount: baseBalance,
      decimals: 8,
      isBaseAsset: true,
    }),
    [baseBalance]
  );

  const secondaryAssetRows = useMemo<PortfolioAssetRow[]>(() => {
    return assetEntries
      .map(([assetId, rawBalance]) => {
        const detail = assetDetailMap.get(assetId);
        const decimals = detail?.decimals ?? 8;
        const amount = rawBalance / Math.pow(10, decimals);
        return {
          assetId,
          name: detail?.name || shortenId(assetId),
          amount,
          decimals,
          isBaseAsset: false,
        } satisfies PortfolioAssetRow;
      })
      .sort((a, b) => b.amount - a.amount);
  }, [assetEntries, assetDetailMap]);

  const combinedAssets = useMemo<PortfolioAssetRow[]>(() => {
    const rows: PortfolioAssetRow[] = [];
    if (baseAssetRow.amount > 0) {
      rows.push(baseAssetRow);
    }
    rows.push(...secondaryAssetRows);

    if (!search.trim()) {
      return rows;
    }

    const query = search.toLowerCase();
    return rows.filter((row) => {
      return row.name.toLowerCase().includes(query) || row.assetId.toLowerCase().includes(query);
    });
  }, [baseAssetRow, secondaryAssetRows, search]);

  const assetCount = secondaryAssetRows.length + (baseAssetRow.amount > 0 ? 1 : 0);

  const openSendModal = (asset: PortfolioAssetRow) => {
    setSendModal({
      assetId: asset.isBaseAsset ? DCC_SYMBOL : asset.assetId,
      assetName: asset.name,
      assetDecimals: asset.decimals,
      availableBalance: asset.amount,
    });
  };

  const isLoading = isBalancesLoading || isAssetDetailsLoading;

  if (!user) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="info" sx={{ borderRadius: 2, maxWidth: 'md', mx: 'auto' }}>
          Sign in to view your portfolio and balances.
        </Alert>
      </Box>
    );
  }

  if (balancesError) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: 'md', mx: 'auto' }}>
          Failed to load wallet balances. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
            My Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your crypto assets
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'rgba(79, 70, 229, 0.2)',
                background:
                  'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(79, 70, 229, 0.4)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 32px rgba(79, 70, 229, 0.15)',
                },
              }}
            >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}
                      >
                        Total DCC Balance
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(79, 70, 229, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AccountBalanceWalletOutlined
                          sx={{ color: 'primary.main', fontSize: 22 }}
                        />
                      </Box>
                    </Stack>
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, mb: 0.5 }}
                      >
                        {formatAmount(baseBalance)}
                      </Typography>
                      <Chip
                        label={DCC_SYMBOL}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: 'primary.main',
                          color: 'white',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {secondaryAssetRows.length > 0
                        ? `+ ${secondaryAssetRows.length} other token${secondaryAssetRows.length === 1 ? '' : 's'}`
                        : 'Available funds in your wallet'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: 'rgba(6, 182, 212, 0.2)',
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(6, 182, 212, 0.4)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(6, 182, 212, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}
                      >
                        Effective Balance
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(6, 182, 212, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShowChartOutlined sx={{ color: '#06B6D4', fontSize: 22 }} />
                      </Box>
                    </Stack>
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, mb: 0.5 }}
                      >
                        {formatAmount(effectiveBalance)}
                      </Typography>
                      <Chip
                        label={DCC_SYMBOL}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: '#06B6D4',
                          color: 'white',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      For leasing and forging eligibility
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: 'rgba(245, 158, 11, 0.2)',
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 146, 60, 0.05) 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(245, 158, 11, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}
                      >
                        Leased Out
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrendingUpOutlined sx={{ color: '#F59E0B', fontSize: 22 }} />
                      </Box>
                    </Stack>
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, mb: 0.5 }}
                      >
                        {formatAmount(leased)}
                      </Typography>
                      <Chip
                        label={DCC_SYMBOL}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: '#F59E0B',
                          color: 'white',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Total balance currently delegated
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Assets List */}
          <Card
            sx={{
              borderRadius: 3,
              border: '2px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                    Your Assets
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assetCount} {assetCount === 1 ? 'asset' : 'assets'} held in this wallet
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  placeholder="Search assets..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{
                    startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                  sx={{
                    minWidth: { xs: '100%', sm: 280 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontWeight: 500,
                    },
                  }}
                />
              </Stack>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {isLoading ? (
                <Stack alignItems="center" py={8}>
                  <CircularProgress size={48} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading assets...
                  </Typography>
                </Stack>
              ) : combinedAssets.length === 0 ? (
                <Box py={8} textAlign="center">
                  <AccountBalanceWalletOutlined
                    sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                  />
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    No assets found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {search ? 'Try adjusting your search' : 'Your wallet is currently empty'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={0}>
                  {combinedAssets.map((asset, index) => (
                    <Box
                      key={`${asset.assetId}-${asset.isBaseAsset ? 'base' : 'asset'}`}
                      sx={{
                        p: 3,
                        borderBottom:
                          index < combinedAssets.length - 1
                            ? '1px solid rgba(0, 0, 0, 0.06)'
                            : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(79, 70, 229, 0.03)',
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={5}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: asset.isBaseAsset
                                  ? 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)'
                                  : `hsl(${(asset.assetId.charCodeAt(0) * 137.5) % 360}, 70%, 60%)`,
                                fontWeight: 800,
                                fontSize: 18,
                              }}
                            >
                              {asset.name.slice(0, 1).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
                                {asset.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asset.isBaseAsset
                                  ? `${DCC_SYMBOL} (base asset)`
                                  : shortenId(asset.assetId)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={3} md={4}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mb: 0.5, display: 'block' }}
                            >
                              Balance
                            </Typography>
                            <Typography variant="h6" fontWeight={700}>
                              {formatAmount(asset.amount, Math.min(asset.decimals, 8))}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3} md={3}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                          >
                            <Button
                              size="medium"
                              variant="outlined"
                              startIcon={<SendOutlined />}
                              onClick={() => openSendModal(asset)}
                              sx={{
                                borderWidth: 2,
                                fontWeight: 600,
                                '&:hover': { borderWidth: 2 },
                              }}
                            >
                              Send
                            </Button>
                            {asset.isBaseAsset && (
                              <Button
                                size="medium"
                                variant="text"
                                startIcon={<CallReceivedOutlined />}
                                onClick={() => setReceiveOpen(true)}
                                sx={{ fontWeight: 600 }}
                              >
                                Receive
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Balance Chart Card */}
          <Card
            sx={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Balance History
              </Typography>
              <BalanceChart totalBalance={baseBalance} />
            </CardContent>
          </Card>
        </Stack>

        {/* Modals */}
        {sendModal && (
          <SendAssetModalModern
            isOpen={true}
            onClose={() => setSendModal(null)}
            assetId={sendModal.assetId}
            assetName={sendModal.assetName}
            assetDecimals={sendModal.assetDecimals}
            availableBalance={formatAmount(sendModal.availableBalance, sendModal.assetDecimals)}
          />
        )}

        <ReceiveAssetModalModern
          isOpen={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          assetName={DCC_SYMBOL}
        />
      </Box>
    );
  };

export default Portfolio;
