/** Map from transaction name to numeric type code. */
export const NAME_MAP = {
  issue: 3 as const,
  transfer: 4 as const,
  reissue: 5 as const,
  burn: 6 as const,
  exchange: 7 as const,
  lease: 8 as const,
  cancelLease: 9 as const,
  alias: 10 as const,
  massTransfer: 11 as const,
  data: 12 as const,
  setScript: 13 as const,
  sponsorship: 14 as const,
  setAssetScript: 15 as const,
  invoke: 16 as const,
  updateAsset: 17 as const,
};

/** Transaction lifecycle statuses as returned by the node. */
export const TRANSACTION_STATUSES = {
  IN_BLOCKCHAIN: 'in_blockchain' as const,
  UNCONFIRMED: 'unconfirmed' as const,
  NOT_FOUND: 'not_found' as const,
};

export type TTransactionStatuses = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];
