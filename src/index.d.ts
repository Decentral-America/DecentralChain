// Type definitions for @decentralchain/assets-pairs-order

/** A tuple of [amountAsset, priceAsset] */
export type TPair = readonly [amountAsset: string, priceAsset: string];

/** A function that orders two asset IDs into [amountAsset, priceAsset] */
export type TOrderPair = (a: string, b: string) => TPair;

/** Overloaded createOrderPair interface supporting curried and full application */
export interface CreateOrderPair {
  /** Partial application: returns a function that orders two assets */
  (predefinedList: readonly string[]): TOrderPair;
  /** Full application: returns the ordered pair directly */
  (predefinedList: readonly string[], a: string, b: string): TPair;
}

export const createOrderPair: CreateOrderPair;

/** Priority list for DecentralChain mainnet (includes USD, EUR, DCC) */
export const MAINNET_DATA: readonly string[];

/** Priority list for DecentralChain testnet */
export const TESTNET_DATA: readonly string[];

/** Additional asset ordering data */
export const ARBITRARY_DATA: readonly string[];
