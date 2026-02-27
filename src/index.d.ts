// Type definitions for @decentralchain/assets-pairs-order

export type TPair = [string, string];
export type TOrderPair = (a: string, b: string) => TPair;

export function createOrderPair(predefinedList: string[]): TOrderPair;
export function createOrderPair(predefinedList: string[], a: string, b: string): TPair;

export const MAINNET_DATA: string[];
export const TESTNET_DATA: string[];
export const ARBITRARY_DATA: string[];