import type { AssetDetail } from '#assets/types';

import type { NftConfig } from '../constants';

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
  Ducklings: 'ducklings',
  Ducks: 'ducks',
  DucksArtefact: 'ducks-artefact',
  Puzzle: 'puzzle',
  SignArt: 'sign-art',
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

export interface FetchInfoParams {
  nfts: NftAssetDetail[];
  nodeUrl: string;
}

export interface CreateParams<T extends { vendor: NftVendorId }> {
  asset: AssetDetail;
  config: NftConfig;
  info: T;
}

export interface NftVendor<T extends { vendor: NftVendorId }> {
  id: T['vendor'];
  is(nft: NftAssetDetail): boolean;
  fetchInfo(params: FetchInfoParams): T[] | Promise<T[]>;
  create(params: CreateParams<T>): Nft;
}

export const DisplayMode = {
  Creator: 1,
  Name: 0,
} as const;
export type DisplayMode = (typeof DisplayMode)[keyof typeof DisplayMode];
