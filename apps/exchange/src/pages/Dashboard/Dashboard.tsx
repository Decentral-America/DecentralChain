/**
 * Dashboard Page
 *
 * The wallet's first viewport: a large-title greeting, then the balance as the
 * hero with its history chart across two thirds, and the actions a holder
 * reaches for as pressable tiles in the last third. Assets and recent activity
 * follow as grouped inset lists.
 *
 * It used to open on a row of three identical icon-plate stat cards ("Total
 * portfolio value", "Total assets", "Recent transactions"), which gave three
 * numbers equal weight when only one is the reason to be here. The counts are
 * now quiet secondary text under the balance. The third card also captioned
 * the size of the last page of transactions as "In the last 24 hours", which
 * it never was.
 */

import { Button, Card, IconButton, Skeleton, Tooltip } from '@mui/material';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  AtSign,
  CandlestickChart,
  ChartLine,
  Coins,
  History,
  Info,
  Lock,
  LockOpen,
  Receipt,
  Repeat,
  Wallet,
  Waypoints,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { useAddressTransactions } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { AssetNameDisplay } from '@/components/common/AssetNameDisplay';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { ActionTile } from '@/components/premium/ActionTile';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { EmptyState } from '@/components/premium/EmptyState';
import {
  InsetGroup,
  InsetGroupHeader,
  InsetRow,
  InsetRowSkeleton,
  TokenAvatar,
} from '@/components/premium/InsetList';
import { useAuth } from '@/contexts/AuthContext';
import { AssetDetailsDialog, type AssetDialogAsset } from '@/features/wallet/AssetDetailsDialog';
import { BalanceChart } from '@/features/wallet/BalanceChart';
import { ReceiveAssetModalModern } from '@/features/wallet/ReceiveAssetModalModern';
import { SendAssetModalModern } from '@/features/wallet/SendAssetModalModern';
import { mapTxToActivity, type TxActivity } from '@/features/wallet/txActivity';
import { useAliases } from '@/hooks/useAliases';
import { useAssetDetails } from '@/hooks/useAssetDetails';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';
import { formatAmount } from '@/utils/formatters';

/** A feed entry: the shared reading of the transaction, plus its type for the glyph. */
type DashboardActivity = TxActivity & { txType: number };

/** The glyph that says which way value moved. */
function activityIcon(txType: number, received: boolean): ReactNode {
  if (txType === 4) return received ? <ArrowDownLeft /> : <ArrowUpRight />;
  if (txType === 7) return <Repeat />;
  if (txType === 8) return <Lock />;
  if (txType === 9) return <LockOpen />;
  return <Receipt />;
}

/**
 * One row of the activity feed: what happened ("Sent", "Burned"…), when, and
 * how much of which asset.
 *
 * The amount is scaled by the asset's own decimals, looked up per asset. The
 * previous version divided everything by 10^8 — right for DCC and wrong by a
 * factor of a hundred for any six-decimal token, which is a wrong number shown
 * to someone about their own money.
 */
function ActivityRow({ activity }: { activity: DashboardActivity }) {
  const { data: asset } = useAssetDetails(activity.assetId, {
    enabled: activity.assetId !== null,
  });

  let value: string | undefined;
  if (activity.amountRaw !== null) {
    const decimals = activity.assetId === null ? 8 : (asset?.decimals ?? 8);
    // Only a transfer has a side to it: money in, or money out.
    const sign = activity.txType === 4 ? (activity.isReceived ? '+' : '−') : '';
    value = `${sign}${formatAmount(activity.amountRaw / 10 ** decimals)}`;
  }

  return (
    <InsetRow
      leading={<TokenAvatar icon={activityIcon(activity.txType, activity.isReceived)} />}
      title={activity.verb}
      subtitle={activity.time}
      value={value}
      valueTone={activity.txType === 4 && activity.isReceived ? 'buy' : undefined}
      valueSub={value === undefined ? undefined : <AssetNameDisplay assetId={activity.assetId} />}
    />
  );
}

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

const Figure = styled.div`
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
  font-variant-numeric: tabular-nums;
`;

/*
 * Nine actions — the redesign's eight plus Bridge — so three even rows of
 * three, where two columns would strand the ninth tile on a row of its own.
 */
const Tiles = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  height: 100%;
`;

const LowerGrid = styled.div`
  display: grid;
  gap: ${pageRhythm * 8}px;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;

  @media (min-width: 1200px) {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
`;

/** Pluralises a count: "1 asset", "3 assets". */
const counted = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The line under the balance. Counts wait for their queries: a "0 assets"
 * shown before the data lands reads as an empty wallet. A failed alias lookup
 * is not "0 aliases", so `aliases` is left undefined and the count omitted.
 */
function HoldingsLine({
  balanceError,
  pending,
  assets,
  aliases,
}: {
  balanceError: boolean;
  pending: boolean;
  assets: number;
  aliases: number | undefined;
}) {
  if (balanceError) return <>The node did not return a balance. It will retry automatically.</>;
  if (pending) return <Skeleton width={150} height={18} />;
  const assetText = counted(assets, 'asset', 'assets');
  return (
    <>
      {aliases === undefined ? assetText : `${assetText} · ${counted(aliases, 'alias', 'aliases')}`}
    </>
  );
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balances, isLoading, error: balanceError } = useBalanceWatcher({ interval: 30000 });
  const { aliases, isLoading: aliasesLoading, error: aliasesError } = useAliases();
  // useAliases starts idle (isLoading false) before its first fetch, so an
  // empty list on first paint is not an answer. The count is only trusted once
  // a fetch has been seen to start and finish.
  const aliasFetchStarted = useRef(false);
  const [aliasesResolved, setAliasesResolved] = useState(false);
  useEffect(() => {
    if (aliasesLoading) aliasFetchStarted.current = true;
    else if (aliasFetchStarted.current || aliasesError) setAliasesResolved(true);
  }, [aliasesLoading, aliasesError]);
  const [createAliasOpen, setCreateAliasOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [infoAsset, setInfoAsset] = useState<AssetDialogAsset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<{
    assetId: string;
    assetName: string;
    assetDecimals: number;
    availableBalance: string;
  } | null>(null);

  // Fetch recent transactions (last 10)
  const { data: transactionsData, isLoading: isActivityLoading } = useAddressTransactions(
    user?.address || '',
    10,
    { enabled: !!user?.address },
  );

  const assetCount = balances?.assets ? Object.keys(balances.assets).length : 0;
  // Only count DCC if there's a balance, or if there are other assets
  const hasDCCBalance = balances?.available && balances.available > 0;
  const totalAssets = assetCount + (hasDCCBalance || assetCount > 0 ? 1 : 0);

  // DCC balance with full precision. The hero is denominated in DCC because
  // no price feed is connected; it never converts to a currency it cannot price.
  const dccBalance = balances?.available ? balances.available / 10 ** 8 : 0;

  const allAssetIds = useMemo(() => {
    if (!balances?.assets) return [];
    return Object.keys(balances.assets);
  }, [balances?.assets]);

  const { data: assetDetails } = useMultipleAssetDetails(allAssetIds, {
    enabled: allAssetIds.length > 0,
  });

  const allAssets = useMemo(() => {
    const assets = [];

    if (balances?.available && balances.available > 0) {
      assets.push({
        amount: balances.available,
        assetId: 'DCC',
        decimals: 8,
        isBaseAsset: true,
        name: 'DecentralChain',
      });
    }

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

      tokenAssets.sort((a, b) => {
        const aValue = a.amount / 10 ** a.decimals;
        const bValue = b.amount / 10 ** b.decimals;
        return bValue - aValue;
      });

      assets.push(...tokenAssets);
    }

    return assets;
  }, [balances, assetDetails]);

  /**
   * What the node has locked for the base asset.
   *
   * The gap between the regular and available balance — funds committed to open
   * orders or leases. Known for DCC only; a per-asset figure needs the
   * matcher's reserved-balance endpoint, so the other rows report zero rather
   * than guessing. Computed the same way the portfolio table does it, so the
   * dialog reads identically from either page.
   */
  const reservedBase = Math.max(
    ((balances?.regular ?? 0) - (balances?.available ?? 0)) / 10 ** 8,
    0,
  );

  // Handler to open the asset info dialog for a holding
  const handleShowAssetInfo = (asset: (typeof allAssets)[0]) => {
    setInfoAsset({
      amount: asset.amount / 10 ** asset.decimals,
      assetId: asset.assetId,
      decimals: asset.decimals,
      isBaseAsset: asset.isBaseAsset,
      name: asset.name,
      reserved: asset.isBaseAsset ? reservedBase : 0,
    });
  };

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

  const recentActivity = useMemo<DashboardActivity[]>(() => {
    if (!transactionsData || !user?.address) return [];
    return transactionsData
      .flat()
      .slice(0, 8)
      .map((tx) => ({ ...mapTxToActivity(tx, user.address), txType: tx.type }));
  }, [transactionsData, user?.address]);

  const quickActions: {
    icon: ReactNode;
    title: string;
    action: () => void;
    primary?: boolean;
  }[] = [
    {
      action: () => navigate('/desktop/wallet/portfolio'),
      icon: <ArrowUpRight />,
      primary: true,
      title: 'Send',
    },
    { action: () => setReceiveOpen(true), icon: <ArrowDownLeft />, title: 'Receive' },
    { action: () => navigate('/desktop/swap'), icon: <ArrowLeftRight />, title: 'Swap' },
    { action: () => navigate('/desktop/dex'), icon: <CandlestickChart />, title: 'Trade' },
    { action: () => navigate('/desktop/bridge'), icon: <Waypoints />, title: 'Bridge' },
    {
      action: () => setCreateAliasOpen(true),
      icon: <AtSign />,
      title: 'Create alias',
    },
    { action: () => navigate('/desktop/create-token'), icon: <Coins />, title: 'Create token' },
    { action: () => navigate('/desktop/analytics'), icon: <ChartLine />, title: 'Analytics' },
    { action: () => navigate('/desktop/wallet/transactions'), icon: <History />, title: 'History' },
  ];

  const figure = (
    <>
      <Caption>Balance</Caption>
      <Figure>
        {isLoading ? (
          <Skeleton width={220} height={48} />
        ) : balanceError ? (
          <span role="img" aria-label="Balance unavailable">
            —
          </span>
        ) : (
          <>
            <AnimatedNumber value={dccBalance} decimals={8} />
            <small>DCC</small>
          </>
        )}
      </Figure>
      <Meta>
        <HoldingsLine
          balanceError={Boolean(balanceError)}
          pending={isLoading || !balances || !aliasesResolved}
          assets={totalAssets}
          aliases={aliasesError ? undefined : aliases.length}
        />
      </Meta>
    </>
  );

  return (
    <>
      <PageFrame
        title={`Welcome back, ${user?.name || 'Trader'}`}
        subtitle="Here's an overview of your portfolio and recent activity"
      >
        <Sections>
          <HeroGrid>
            <Card sx={{ display: 'flex', flexDirection: 'column', p: 3 }}>
              <BalanceChart figure={figure} height={200} />
            </Card>
            <Card sx={{ p: 1.5 }}>
              <Tiles role="group" aria-label="Quick actions">
                {quickActions.map((a) => (
                  <ActionTile
                    key={a.title}
                    icon={a.icon}
                    label={a.title}
                    primary={a.primary}
                    onClick={a.action}
                  />
                ))}
              </Tiles>
            </Card>
          </HeroGrid>

          <LowerGrid>
            <section aria-labelledby="dash-assets">
              <InsetGroupHeader
                id="dash-assets"
                title="Assets"
                count={isLoading ? undefined : allAssets.length}
                trailing={
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate('/desktop/wallet/portfolio')}
                  >
                    View portfolio
                  </Button>
                }
              />
              <InsetGroup>
                {isLoading ? (
                  <InsetRowSkeleton rows={3} />
                ) : allAssets.length === 0 ? (
                  <EmptyState
                    icons={[Coins, Wallet, ArrowDownLeft]}
                    title="No assets yet"
                    description="Receive DCC or any token to this address and it will be listed here."
                    action={
                      <Button variant="contained" onClick={() => setReceiveOpen(true)}>
                        Receive
                      </Button>
                    }
                  />
                ) : (
                  allAssets.map((asset) => {
                    const amount = asset.amount / 10 ** asset.decimals;
                    return (
                      <InsetRow
                        key={asset.assetId}
                        leading={<TokenAvatar name={asset.name} accent={asset.isBaseAsset} />}
                        title={asset.name}
                        subtitle={
                          asset.isBaseAsset ? 'Native token' : `${asset.assetId.substring(0, 8)}…`
                        }
                        value={formatAmount(amount, 8)}
                        valueSub={asset.isBaseAsset ? 'DCC' : asset.name}
                        /*
                         * A row with its own controls cannot also be a button,
                         * so the details dialog the whole row used to open has
                         * a control of its own beside Send.
                         */
                        accessory={
                          <>
                            <Tooltip title={`${asset.name} details`}>
                              <IconButton
                                size="small"
                                aria-label={`Asset info for ${asset.name}`}
                                onClick={() => handleShowAssetInfo(asset)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <Info size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={`Send ${asset.name}`}>
                              <IconButton
                                size="small"
                                aria-label={`Send ${asset.name}`}
                                onClick={() => handleSendAsset(asset)}
                                sx={{ color: 'primary.main' }}
                              >
                                <ArrowUpRight size={18} />
                              </IconButton>
                            </Tooltip>
                          </>
                        }
                      />
                    );
                  })
                )}
              </InsetGroup>
            </section>

            <section aria-labelledby="dash-activity">
              <InsetGroupHeader
                id="dash-activity"
                title="Recent activity"
                trailing={
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate('/desktop/wallet/transactions')}
                  >
                    See all
                  </Button>
                }
              />
              <InsetGroup>
                {isActivityLoading && !transactionsData ? (
                  <InsetRowSkeleton rows={3} />
                ) : recentActivity.length === 0 ? (
                  <EmptyState
                    compact
                    icons={[Receipt]}
                    title="No activity yet"
                    description="Transfers, trades and leases appear here as they confirm."
                  />
                ) : (
                  recentActivity.map((activity) => (
                    <ActivityRow key={activity.txId} activity={activity} />
                  ))
                )}
              </InsetGroup>
            </section>
          </LowerGrid>
        </Sections>
      </PageFrame>
      <CreateAliasModal
        open={createAliasOpen}
        onClose={() => setCreateAliasOpen(false)}
        onSuccess={() => {
          setCreateAliasOpen(false);
        }}
      />
      <ReceiveAssetModalModern
        isOpen={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        assetName="DCC"
      />
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
      {/* Asset Info Dialog */}
      {infoAsset && <AssetDetailsDialog asset={infoAsset} onClose={() => setInfoAsset(null)} />}
    </>
  );
};
