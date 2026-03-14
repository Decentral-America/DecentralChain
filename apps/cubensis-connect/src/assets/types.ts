import { type BigNumber } from '@decentralchain/bignumber';

export interface AssetDetail {
  description: string;
  displayName: string;
  hasScript?: boolean | undefined;
  height: number;
  id: string;
  isFavorite?: boolean | undefined;
  issuer: string;
  isSuspicious?: boolean | undefined;
  lastUpdated?: number | undefined;
  minSponsoredFee?: string | number | undefined;
  name: string;
  originTransactionId?: string | undefined;
  precision: number;
  quantity: BigNumber | string | number;
  reissuable: boolean;
  sender: string;
  ticker?: string | undefined;
  timestamp: Date;
}

export interface AssetsRecord {
  WAVES: AssetDetail;
  [key: string]: AssetDetail | undefined;
}
