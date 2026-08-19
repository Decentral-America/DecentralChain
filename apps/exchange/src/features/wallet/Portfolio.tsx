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
import { useTranslation } from 'react-i18next';
import { dccletsToCoins } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';
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

const formatAmount = (
  value: number,
  maximumFractionDigits = 8,
  locale: string = 'en-US',
): string => {
  return new Intl.NumberFormat(locale, {
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
  const { i18n } = useTranslation();
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
  const baseBalance = dccletsToCoins(baseBalanceWavelets);
  const effectiveBalance = dccletsToCoins(balances?.effective ?? balances?.balance ?? 0);
  const leasedOut = dccletsToCoins(balances?.leaseOut ?? 0);
  const leasedIn = dccletsToCoins(balances?.leaseIn ?? 0);
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
        <Alert severity="info" sx={{ borderRadius: '4px', maxWidth: 'md', mx: 'auto' }}>
          Sign in to view your portfolio and balances.
        </Alert>
      </Box>
    );
  }

  if (balancesError) {
    return (
      <Box sx={{ px: { md: 4, sm: 3, xs: 2 }, py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: '4px', maxWidth: 'md', mx: 'auto' }}>
          Failed to load wallet balances. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <PageFrame fit title="Portfolio" subtitle="Every asset this account holds.">
      {/*
        The screen is the shell's height and the asset list is what scrolls
        inside it. Previously the list ran to its natural length and took the
        page with it — 1300px past the frame on a wallet with a handful of
        tokens — which meant the summary figures scrolled away the moment
        anyone went looking for an asset. They are the reason to be here, so
        they stay.
      */}
      <Box
        sx={{
          display: 'grid',
          flex: 1,
          gap: pageRhythm,
          gridTemplateRows: 'auto minmax(0, 1fr)',
          minHeight: 0,
        }}
      >
        {/* Stats Cards */}
        <Grid container spacing={pageRhythm}>
          <Grid
            size={{
              md: 4,
              xs: 12,
            }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Total DCC Balance
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'action.selected',
                        borderRadius: '4px',
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
                        // Below the page title: a figure in a card is not a
                        // page heading, however important the number is.
                        fontSize: { md: '1.625rem', sm: '1.5rem', xs: '1.375rem' },
                        mb: 0.5,
                      }}
                    >
                      {formatAmount(baseBalance, 8, i18n.language)}
                    </Typography>
                    <Chip
                      label={DCC_SYMBOL}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
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
              xs: 6,
            }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Effective Balance
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'action.selected',
                        borderRadius: '4px',
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <ShowChartOutlined sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Box>
                  </Stack>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        // Below the page title: a figure in a card is not a
                        // page heading, however important the number is.
                        fontSize: { md: '1.625rem', sm: '1.5rem', xs: '1.375rem' },
                        mb: 0.5,
                      }}
                    >
                      {formatAmount(effectiveBalance, 8, i18n.language)}
                    </Typography>
                    <Chip
                      label={DCC_SYMBOL}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
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
              xs: 6,
            }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Leased Out
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'action.selected',
                        borderRadius: '4px',
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <TrendingUpOutlined sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Box>
                  </Stack>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        // Below the page title: a figure in a card is not a
                        // page heading, however important the number is.
                        fontSize: { md: '1.625rem', sm: '1.5rem', xs: '1.375rem' },
                        mb: 0.5,
                      }}
                    >
                      {formatAmount(leased)}
                    </Typography>
                    <Chip
                      label={DCC_SYMBOL}
                      size="small"
                      sx={{
                        bgcolor: 'action.selected',
                        color: 'primary.main',
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

        <Box
          sx={{
            display: 'grid',
            gap: pageRhythm,
            gridTemplateColumns: { lg: 'minmax(0, 1.7fr) minmax(0, 1fr)', xs: 'minmax(0, 1fr)' },
            minHeight: 0,
          }}
        >
          {/* Assets List */}
          <Card sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, p: 3 }}>
              <Stack
                direction={{ sm: 'row', xs: 'column' }}
                spacing={2}
                sx={{
                  alignItems: { sm: 'center', xs: 'stretch' },
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
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
                  slotProps={{
                    input: {
                      startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1 }} />,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                    },
                    minWidth: { sm: 280, xs: '100%' },
                  }}
                />
              </Stack>
            </Box>
            {/* The one scroll region on the screen. */}
            <CardContent
              sx={{ '&:last-child': { pb: 0 }, flex: 1, minHeight: 0, overflowY: 'auto', p: 0 }}
            >
              {isLoading ? (
                <Stack sx={{ alignItems: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading assets...
                  </Typography>
                </Stack>
              ) : combinedAssets.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <AccountBalanceWalletOutlined
                    sx={{ color: 'text.disabled', fontSize: 64, mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
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
                          bgcolor: 'action.hover',
                        },
                        borderBottomColor: 'divider',
                        borderBottomStyle: index < combinedAssets.length - 1 ? 'solid' : 'none',
                        borderBottomWidth: '1px',
                        p: 3,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid
                          size={{
                            md: 5,
                            sm: 6,
                            xs: 12,
                          }}
                        >
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: asset.isBaseAsset ? 'primary.main' : 'action.selected',
                                borderRadius: '4px',
                                color: asset.isBaseAsset ? 'primary.contrastText' : 'primary.main',
                                fontSize: 16,
                                height: 40,
                                width: 40,
                              }}
                            >
                              {asset.name.slice(0, 1).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ mb: 0.25 }}>
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
                            <Typography variant="h6">
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
                            sx={{ justifyContent: { sm: 'flex-end', xs: 'flex-start' } }}
                          >
                            <Button
                              size="medium"
                              variant="outlined"
                              startIcon={<SendOutlined />}
                              onClick={() => openSendModal(asset)}
                              sx={{
                                '&:hover': { borderWidth: 2 },
                                borderWidth: 2,
                              }}
                            >
                              Send
                            </Button>
                            <Button
                              size="medium"
                              variant="text"
                              startIcon={<CallReceivedOutlined />}
                              onClick={() => setReceiveOpen(true)}
                            >
                              Receive
                            </Button>
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
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* The chart draws its own heading and timeframe controls. */}
            <CardContent sx={{ display: 'flex', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <BalanceChart totalBalance={baseBalance} />
            </CardContent>
          </Card>
        </Box>
      </Box>
      {/* Modals */}
      {sendModal && (
        <SendAssetModalModern
          isOpen={true}
          onClose={() => setSendModal(null)}
          assetId={sendModal.assetId}
          assetName={sendModal.assetName}
          assetDecimals={sendModal.assetDecimals}
          availableBalance={sendModal.availableBalance.toString()}
        />
      )}
      <ReceiveAssetModalModern
        isOpen={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        assetName={DCC_SYMBOL}
      />
    </PageFrame>
  );
};
