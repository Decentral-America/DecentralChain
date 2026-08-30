import { FilterList, KeyboardArrowDown } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { dccletsToCoins } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { PageFrame } from '@/layouts/PageFrame';
import { AssetDetailsDialog, type AssetDialogAsset } from './AssetDetailsDialog';
import { PortfolioAssetTable, type PortfolioTableRow } from './PortfolioAssetTable';
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

const shortenId = (id: string): string => {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
};

export const Portfolio = () => {
  const { user } = useAuth();
  const [sendModal, setSendModal] = useState<SendModalState | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [infoAsset, setInfoAsset] = useState<AssetDialogAsset | null>(null);

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

    return rows;
  }, [baseAssetRow, secondaryAssetRows]);

  /**
   * Rows for the table, with what the node has locked.
   *
   * `reserved` is the gap between the regular and available balance — funds
   * committed to open orders or leases. It is only known for DCC here; a
   * per-asset figure needs the matcher's reserved-balance endpoint, so the
   * other rows report zero rather than guessing.
   */
  const tableRows = useMemo<PortfolioTableRow[]>(() => {
    const reservedBase = Math.max(
      dccletsToCoins(balances?.regular ?? 0) - dccletsToCoins(balances?.available ?? 0),
      0,
    );

    return combinedAssets.map((row) => ({
      ...row,
      reserved: row.isBaseAsset ? reservedBase : 0,
    }));
  }, [combinedAssets, balances]);

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
        Actions first, then the holdings. Send and Receive are what people
        come here to do; the filter says how much of the wallet is on screen.
      */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => baseAssetRow && openSendModal(baseAssetRow)}
            disabled={!baseAssetRow}
          >
            Send
          </Button>
          <Button variant="outlined" onClick={() => setReceiveOpen(true)}>
            Receive
          </Button>
        </Stack>

        <Button
          variant="outlined"
          startIcon={<FilterList />}
          endIcon={<KeyboardArrowDown />}
          sx={{ color: 'text.primary', fontWeight: 400 }}
        >
          All active ({assetCount})
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
        {isLoading && combinedAssets.length === 0 ? (
          <Stack sx={{ alignItems: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <PortfolioAssetTable
            rows={tableRows}
            onSelect={(row) => setInfoAsset(row)}
            onSend={(row) => openSendModal(row)}
            onReceive={() => setReceiveOpen(true)}
          />
        )}
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
      {infoAsset && <AssetDetailsDialog asset={infoAsset} onClose={() => setInfoAsset(null)} />}
    </PageFrame>
  );
};
