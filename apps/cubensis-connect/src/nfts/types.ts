export interface NftAssetDetail {
  assetId: string;
  decimals: 0;
  description: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  minSponsoredAssetFee: null;
  name: string;
  originTransactionId: string;
  quantity: '1';
  reissuable: false;
  scripted: boolean;
}

export const NftVendorId = {
  Unknown: 'unknown',
} as const;
export type NftVendorId = (typeof NftVendorId)[keyof typeof NftVendorId];

export interface Nft {
  background?: React.CSSProperties | undefined;
  creator?: string | undefined;
  creatorUrl?: string | undefined;
  description?: string | undefined;
  displayCreator?: string | undefined;
  displayName: string;
  foreground?: string | undefined;
  id: string;
  marketplaceUrl?: string | undefined;
  name: string;
  vendor: NftVendorId;
}

export const DisplayMode = {
  Creator: 1,
  Name: 0,
} as const;
export type DisplayMode = (typeof DisplayMode)[keyof typeof DisplayMode];
