import {
  AccountBalanceWalletOutlined,
  CallReceivedOutlined,
  SearchOutlined,
  SendOutlined,
  ShowChartOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { waveletsToCoins } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { BalanceChart } from './BalanceChart';
import { ReceiveAssetModalModern } from './ReceiveAssetModalModern';
import { SendAssetModalModern } from './SendAssetModalModern';

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
    maximumFractionDigits,
    minimumFractionDigits: 0,
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
    [balances?.assets],
  );
  const assetIds = useMemo(() => assetEntries.map(([assetId]) => assetId), [assetEntries]);

  const { data: assetDetails, isLoading: isAssetDetailsLoading } = useMultipleAssetDetails(
    assetIds,
    { enabled: assetIds.length > 0 },
  );

  const assetDetailMap = useMemo(() => {
    if (!assetDetails) return new Map<string, { name: string; decimals: number }>();
    return new Map(
      assetDetails.map((detail) => [
        detail.assetId,
        { decimals: detail.decimals, name: detail.name },
      ]),
    );
  }, [assetDetails]);

  const baseBalanceWavelets = balances?.available ?? balances?.balance ?? 0;
  const baseBalance = waveletsToCoins(baseBalanceWavelets);
  const effectiveBalance = waveletsToCoins(balances?.effective ?? balances?.balance ?? 0);
  const leasedOut = waveletsToCoins(balances?.leaseOut ?? 0);
  const leasedIn = waveletsToCoins(balances?.leaseIn ?? 0);
  const leased = Math.max(leasedOut - leasedIn, 0);

  const baseAssetRow = useMemo<PortfolioAssetRow>(
    () => ({
      amount: baseBalance,
      assetId: DCC_SYMBOL,
      decimals: 8,
      isBaseAsset: true,
      name: 'DecentralChain',
    }),
    [baseBalance],
  );

  const secondaryAssetRows = useMemo<PortfolioAssetRow[]>(() => {
    return assetEntries
      .map(([assetId, rawBalance]) => {
        const detail = assetDetailMap.get(assetId);
        const decimals = detail?.decimals ?? 8;
        const amount = rawBalance / 10 ** decimals;
        return {
          amount,
          assetId,
          decimals,
          isBaseAsset: false,
          name: detail?.name || shortenId(assetId),
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
      assetDecimals: asset.decimals,
      assetId: asset.isBaseAsset ? DCC_SYMBOL : asset.assetId,
      assetName: asset.name,
      availableBalance: asset.amount,
    });
  };

  const isLoading = isBalancesLoading || isAssetDetailsLoading;

  if (!user) {
    return (
      <Box sx={{ px: { md: 4, sm: 3, xs: 2 }, py: 8 }}>
        <Alert severity="info" sx={{ borderRadius: 2, maxWidth: 'md', mx: 'auto' }}>
          Sign in to view your portfolio and balances.
        </Alert>
      </Box>
    );
  }

  if (balancesError) {
    return (
      <Box sx={{ px: { md: 4, sm: 3, xs: 2 }, py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: 'md', mx: 'auto' }}>
          Failed to load wallet balances. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { md: 4, sm: 3, xs: 2 }, py: 3 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 1 }}>
            My Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your crypto assets
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid
            size={{
              md: 4,
              xs: 12,
            }}
          >
            <Card
              sx={{
                '&:hover': {
                  borderColor: 'rgba(79, 70, 229, 0.4)',
                  boxShadow: '0 12px 32px rgba(79, 70, 229, 0.15)',
                  transform: 'translateY(-4px)',
                },
                background:
                  'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'rgba(79, 70, 229, 0.2)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="overline"
                      sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}
                    >
                      Total DCC Balance
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'rgba(79, 70, 229, 0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <AccountBalanceWalletOutlined sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Box>
                  </Stack>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { md: '2.25rem', sm: '1.75rem', xs: '1.5rem' },
                        fontWeight: 800,
                        mb: 0.5,
                      }}
                    >
                      {formatAmount(baseBalance)}
                    </Typography>
                    <Chip
                      label={DCC_SYMBOL}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 700,
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

          <Grid
            size={{
              md: 4,
              xs: 12,
            }}
          >
            <Card
              sx={{
                '&:hover': {
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  boxShadow: '0 12px 32px rgba(6, 182, 212, 0.15)',
                  transform: 'translateY(-4px)',
                },
                background:
                  'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '2px solid',
                borderColor: 'rgba(6, 182, 212, 0.2)',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="overline"
                      sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}
                    >
                      Effective Balance
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'rgba(6, 182, 212, 0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <ShowChartOutlined sx={{ color: '#06B6D4', fontSize: 22 }} />
                    </Box>
                  </Stack>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { md: '2.25rem', sm: '1.75rem', xs: '1.5rem' },
                        fontWeight: 800,
                        mb: 0.5,
                      }}
                    >
                      {formatAmount(effectiveBalance)}
                    </Typography>
                    <Chip
                      label={DCC_SYMBOL}
                      size="small"
                      sx={{
                        bgcolor: '#06B6D4',
                        color: 'white',
                        fontWeight: 700,
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

          <Grid
            size={{
              md: 4,
              xs: 12,
            }}
          >
            <Card
              sx={{
                '&:hover': {
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 12px 32px rgba(245, 158, 11, 0.15)',
                  transform: 'translateY(-4px)',
                },
                background:
                  'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 146, 60, 0.05) 100%)',
                border: '2px solid',
                borderColor: 'rgba(245, 158, 11, 0.2)',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="overline"
                      sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}
                    >
                      Leased Out
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <TrendingUpOutlined sx={{ color: '#F59E0B', fontSize: 22 }} />
                    </Box>
                  </Stack>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { md: '2.25rem', sm: '1.75rem', xs: '1.5rem' },
                        fontWeight: 800,
                        mb: 0.5,
                      }}
                    >
                      {formatAmount(leased)}
                    </Typography>
                    <Chip
                      label={DCC_SYMBOL}
                      size="small"
                      sx={{
                        bgcolor: '#F59E0B',
                        color: 'white',
                        fontWeight: 700,
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
            border: '2px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)', p: 3 }}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center', xs: 'stretch' }}
              spacing={2}
            >
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontWeight: 500,
                  },
                  minWidth: { sm: 280, xs: '100%' },
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
                  sx={{ color: 'text.disabled', fontSize: 64, mb: 2 }}
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
                      '&:hover': {
                        bgcolor: 'rgba(79, 70, 229, 0.03)',
                      },
                      borderBottom:
                        index < combinedAssets.length - 1
                          ? '1px solid rgba(0, 0, 0, 0.06)'
                          : 'none',
                      p: 3,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid
                        size={{
                          md: 5,
                          sm: 6,
                          xs: 12,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: asset.isBaseAsset
                                ? 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)'
                                : `hsl(${(asset.assetId.charCodeAt(0) * 137.5) % 360}, 70%, 60%)`,
                              fontSize: 18,
                              fontWeight: 800,
                              height: 48,
                              width: 48,
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
                      <Grid
                        size={{
                          md: 4,
                          sm: 3,
                          xs: 12,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Balance
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {formatAmount(asset.amount, Math.min(asset.decimals, 8))}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          md: 3,
                          sm: 3,
                          xs: 12,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent={{ sm: 'flex-end', xs: 'flex-start' }}
                        >
                          <Button
                            size="medium"
                            variant="outlined"
                            startIcon={<SendOutlined />}
                            onClick={() => openSendModal(asset)}
                            sx={{
                              '&:hover': { borderWidth: 2 },
                              borderWidth: 2,
                              fontWeight: 600,
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
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
