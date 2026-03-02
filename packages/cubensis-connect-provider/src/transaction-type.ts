/**
 * @module @decentralchain/provider-cubensis
 *
 * DecentralChain transaction type constants.
 * Inlined from the DecentralChain protocol specification.
 */

/** Transaction type numeric identifiers for the DecentralChain protocol. */
export const TRANSACTION_TYPE = Object.freeze({
  GENESIS: 1,
  PAYMENT: 2,
  ISSUE: 3,
  TRANSFER: 4,
  REISSUE: 5,
  BURN: 6,
  EXCHANGE: 7,
  LEASE: 8,
  CANCEL_LEASE: 9,
  ALIAS: 10,
  MASS_TRANSFER: 11,
  DATA: 12,
  SET_SCRIPT: 13,
  SPONSORSHIP: 14,
  SET_ASSET_SCRIPT: 15,
  INVOKE_SCRIPT: 16,
  UPDATE_ASSET_INFO: 17,
} as const);

/** Union of all transaction type values. */
export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

/** Map of transaction type numbers to their names. */
export type TransactionMap = {
  [K in keyof typeof TRANSACTION_TYPE as (typeof TRANSACTION_TYPE)[K]]: K;
};
