/** Pure state types with no dependencies on AppAction — avoids circular imports. */

export type NewAccountState = {
  address: string;
  hasBackup?: boolean | undefined;
  name: string;
} & (
  | { type: 'encodedSeed'; encodedSeed: string }
  | { type: 'ledger'; id: number; publicKey: string }
  | { type: 'privateKey'; privateKey: string }
  | { type: 'seed'; seed: string }
);

export type AssetFilters = {
  term?: string | undefined;
  onlyMy?: boolean | undefined;
  onlyFavorites?: boolean | undefined;
};

export type NftFilters = {
  term?: string | undefined;
};

export type TxHistoryFilters = {
  term?: string | undefined;
  type?: number | undefined;
  onlyIncoming?: boolean | undefined;
  onlyOutgoing?: boolean | undefined;
};

export interface UiState {
  account?: unknown | undefined;
  assetFilters?: AssetFilters | undefined;
  assetsTab?: number | undefined;
  autoClickProtection?: boolean | undefined;
  nftFilters?: NftFilters | undefined;
  showSuspiciousAssets?: boolean | undefined;
  slippageToleranceIndex?: number | undefined;
  txHistoryFilters?: TxHistoryFilters | undefined;
}
