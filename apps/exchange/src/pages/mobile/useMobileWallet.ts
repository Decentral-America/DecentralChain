import { useMemo } from 'react';
import { dccletsToCoins as waveletsToCoins } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';

/**
 * Wallet data for the mobile screens.
 *
 * Wraps exactly the same sources the desktop portfolio uses —
 * `useBalanceWatcher` for on-chain balances and `useMultipleAssetDetails` for
 * asset metadata — so the two never disagree. Centralising it here keeps the
 * mobile screens presentational and guarantees they show real holdings rather
 * than sample data.
 */

export interface MobileAsset {
  assetId: string;
  name: string;
  /** Human-readable amount, already scaled by the asset's decimals */
  amount: number;
  decimals: number;
  isBaseAsset: boolean;
}

export interface MobileWalletData {
  /** Base-chain balance in coins */
  baseBalance: number;
  /** Balance usable for trading (excludes amounts leased out) */
  availableBalance: number;
  /** Net amount currently leased out */
  leased: number;
  /** Base asset first, then held assets by descending amount */
  assets: MobileAsset[];
  /** Share of total holdings per asset, as a percentage */
  allocations: { assetId: string; name: string; percent: number }[];
  isLoading: boolean;
  error: unknown;
}

const BASE_ASSET_ID = 'DCC';
const BASE_ASSET_NAME = 'DecentralChain';

/** Truncates an asset id for display when no name is available. */
function shortenId(assetId: string): string {
  return assetId.length > 10 ? `${assetId.slice(0, 6)}…${assetId.slice(-4)}` : assetId;
}

export function useMobileWallet(pollInterval = 15000): MobileWalletData {
  const {
    balances,
    error,
    isLoading: isBalancesLoading,
  } = useBalanceWatcher({
    interval: pollInterval,
  });

  const assetEntries = useMemo(
    () => Object.entries(balances?.assets ?? {}) as Array<[string, number]>,
    [balances?.assets],
  );

  const assetIds = useMemo(() => assetEntries.map(([assetId]) => assetId), [assetEntries]);

  const { data: assetDetails, isLoading: isDetailsLoading } = useMultipleAssetDetails(assetIds, {
    enabled: assetIds.length > 0,
  });

  const detailMap = useMemo(() => {
    const map = new Map<string, { name: string; decimals: number }>();
    for (const detail of assetDetails ?? []) {
      map.set(detail.assetId, { decimals: detail.decimals, name: detail.name });
    }
    return map;
  }, [assetDetails]);

  const baseBalance = waveletsToCoins(balances?.balance ?? 0);
  const availableBalance = waveletsToCoins(balances?.available ?? balances?.balance ?? 0);
  const leasedOut = waveletsToCoins(balances?.leaseOut ?? 0);
  const leasedIn = waveletsToCoins(balances?.leaseIn ?? 0);

  const assets = useMemo<MobileAsset[]>(() => {
    const rows: MobileAsset[] = [];

    if (baseBalance > 0) {
      rows.push({
        amount: baseBalance,
        assetId: BASE_ASSET_ID,
        decimals: 8,
        isBaseAsset: true,
        name: BASE_ASSET_NAME,
      });
    }

    for (const [assetId, rawBalance] of assetEntries) {
      const detail = detailMap.get(assetId);
      const decimals = detail?.decimals ?? 8;
      rows.push({
        amount: rawBalance / 10 ** decimals,
        assetId,
        decimals,
        isBaseAsset: false,
        name: detail?.name || shortenId(assetId),
      });
    }

    return rows.sort((a, b) => {
      // Base asset always leads, then by holding size.
      if (a.isBaseAsset !== b.isBaseAsset) return a.isBaseAsset ? -1 : 1;
      return b.amount - a.amount;
    });
  }, [assetEntries, baseBalance, detailMap]);

  /**
   * Allocation is computed from token amounts, not fiat value: the app has no
   * price oracle for arbitrary issued assets, so a value-weighted split would
   * be fabricated. This is labelled as a holdings split in the UI.
   */
  const allocations = useMemo(() => {
    const total = assets.reduce((sum, asset) => sum + asset.amount, 0);
    if (total <= 0) return [];
    return assets
      .map((asset) => ({
        assetId: asset.assetId,
        name: asset.name,
        percent: (asset.amount / total) * 100,
      }))
      .filter((entry) => entry.percent >= 0.5);
  }, [assets]);

  return {
    allocations,
    assets,
    availableBalance,
    baseBalance,
    error,
    isLoading: isBalancesLoading || isDetailsLoading,
    leased: Math.max(leasedOut - leasedIn, 0),
  };
}
