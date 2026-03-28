import type { TransactionFromNode } from '@decentralchain/ts-types';
import type { AssetDetail } from '#assets/types';
import type { NetworkName } from '#networks/types';

export interface AssetBalance {
  balance: string;
  sponsorBalance: string;
  minSponsoredAssetFee: string | null;
}

export type BalanceAssets = Partial<Record<string, AssetBalance>>;

export interface BalancesItem {
  aliases?: string[] | undefined;
  assets?: BalanceAssets | undefined;
  available?: string | undefined;
  leasedOut?: string | undefined;
  regular?: string | undefined;
  network?: NetworkName | undefined;
  nfts?: AssetDetail[] | undefined;
  txHistory?: TransactionFromNode[] | undefined;
}
