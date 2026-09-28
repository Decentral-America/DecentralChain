/**
 * Portfolio
 *
 * The same hero language as the wallet home: the DCC balance as a rolling
 * figure over its history chart, the effective and leased figures beside it,
 * and every holding below in the asset table, where a row opens its details
 * and carries its own Send and Receive. The figures lead and their labels are
 * quiet text.
 */
import { Alert, Box, Button, Card, Skeleton } from '@mui/material';
import { ArrowDownLeft, ArrowUpRight, Coins, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { dccletsToCoins } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { EmptyState } from '@/components/premium/EmptyState';
import { InsetGroup, InsetGroupHeader, InsetRowSkeleton } from '@/components/premium/InsetList';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';
import { AssetDetailsDialog, type AssetDialogAsset } from './AssetDetailsDialog';
import { BalanceChart } from './BalanceChart';
import { PortfolioAssetTable, type PortfolioTableRow } from './PortfolioAssetTable';
import { ReceiveAssetModalModern } from './ReceiveAssetModalModern';
import { SendAssetModalModern } from './SendAssetModalModern';

const DCC_SYMBOL = 'DCC';

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${pageRhythm * 8}px;
`;

const HeroGrid = styled.div`
  display: grid;
  gap: ${pageRhythm * 8}px;
  grid-template-columns: minmax(0, 1fr);

  @media (min-width: 1200px) {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
`;

const Caption = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const HeroFigure = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
  font-size: 44px;
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.025em;
  color: ${({ theme }) => theme.colors.text};

  small {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  @media (max-width: 600px) {
    font-size: 36px;
  }
`;

const Meta = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** One figure in the side summary: the number leads, the label follows. */
const Stat = styled.div`
  padding: 16px 0;

  & + & {
    box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.border};
  }

  strong {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: ${({ theme }) => theme.colors.text};
  }

  strong small {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  > span {
    display: block;
    margin-top: 2px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

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
  const effectiveBalance = dccletsToCoins(balances?.effective ?? balances?.balance ?? 0);
  // What this wallet has delegated. DCC leased in from others is not
  // subtracted: it belongs to someone else and doesn't change what is out.
  const leased = dccletsToCoins(balances?.leaseOut ?? 0);

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

  // Details only load when there are tokens; a disabled query is not loading.
  const isLoading = isBalancesLoading || (assetIds.length > 0 && isAssetDetailsLoading);

  if (!user) {
    return (
      <Box sx={{ px: { md: 4, sm: 3, xs: 2 }, py: 8 }}>
        <Alert severity="info" sx={{ maxWidth: 'md', mx: 'auto' }}>
          Sign in to view your portfolio and balances.
        </Alert>
      </Box>
    );
  }

  if (balancesError) {
    return (
      <Box sx={{ px: { md: 4, sm: 3, xs: 2 }, py: 8 }}>
        <Alert severity="error" sx={{ maxWidth: 'md', mx: 'auto' }}>
          Failed to load wallet balances. Please try again.
        </Alert>
      </Box>
    );
  }

  const figure = (
    <>
      <Caption>Available DCC</Caption>
      <HeroFigure>
        {isBalancesLoading ? (
          <Skeleton width={220} height={48} />
        ) : (
          <>
            <AnimatedNumber value={baseBalance} decimals={8} />
            <small>{DCC_SYMBOL}</small>
          </>
        )}
      </HeroFigure>
      <Meta>
        {secondaryAssetRows.length > 0
          ? `Plus ${secondaryAssetRows.length} other token${secondaryAssetRows.length === 1 ? '' : 's'}`
          : 'Available funds in your wallet'}
      </Meta>
    </>
  );

  const stat = (value: number, label: string) => (
    <Stat>
      <strong>
        {isBalancesLoading ? (
          <Skeleton width={120} height={30} />
        ) : (
          <>
            <AnimatedNumber value={value} decimals={8} />
            <small>{DCC_SYMBOL}</small>
          </>
        )}
      </strong>
      <span>{label}</span>
    </Stat>
  );

  return (
    <PageFrame title="Portfolio" subtitle="Every asset this account holds.">
      <Sections>
        <HeroGrid>
          <Card sx={{ display: 'flex', flexDirection: 'column', p: 3 }}>
            <BalanceChart figure={figure} height={200} />
          </Card>
          <Card sx={{ display: 'flex', flexDirection: 'column', px: 3, py: 1 }}>
            {stat(effectiveBalance, 'Effective balance, used for leasing and forging')}
            {stat(leased, 'Leased out to nodes')}
            {/*
              Send and Receive are what people come here to do, so they sit
              with the figures rather than behind a row.
            */}
            <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pb: 2, pt: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ArrowUpRight size={18} />}
                onClick={() => openSendModal(baseAssetRow)}
              >
                Send
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowDownLeft size={18} />}
                onClick={() => setReceiveOpen(true)}
              >
                Receive
              </Button>
            </Box>
          </Card>
        </HeroGrid>

        <section aria-labelledby="portfolio-assets">
          <InsetGroupHeader
            id="portfolio-assets"
            title="Assets"
            count={isLoading ? undefined : assetCount}
          />
          {isLoading && combinedAssets.length === 0 ? (
            <InsetGroup>
              <InsetRowSkeleton rows={4} />
            </InsetGroup>
          ) : combinedAssets.length === 0 ? (
            <InsetGroup>
              <EmptyState
                icons={[Coins, Wallet, ArrowDownLeft]}
                title="Your wallet is empty"
                description="Receive DCC or any token to this address and it will be listed here."
                action={
                  <Button variant="contained" onClick={() => setReceiveOpen(true)}>
                    Receive
                  </Button>
                }
              />
            </InsetGroup>
          ) : (
            <PortfolioAssetTable
              rows={tableRows}
              onSelect={(row) => setInfoAsset(row)}
              onSend={(row) => openSendModal(row)}
              onReceive={() => setReceiveOpen(true)}
            />
          )}
        </section>
      </Sections>

      {/* Modals */}
      {sendModal && (
        <SendAssetModalModern
          isOpen={true}
          onClose={() => setSendModal(null)}
          assetId={sendModal.assetId}
          assetName={sendModal.assetName}
          assetDecimals={sendModal.assetDecimals}
          availableBalance={String(sendModal.availableBalance)}
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
