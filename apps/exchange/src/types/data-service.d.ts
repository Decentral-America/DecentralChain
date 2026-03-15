/**
 * Type declarations for the data-service module
 * This module lives at ../data-service in the monorepo and is resolved via tsconfig paths + Vite alias
 */

declare module 'data-service' {
  import type { Money, AssetPair } from '@decentralchain/data-entities';
  import type { BigNumber } from '@decentralchain/bignumber';

  // ========== Config ==========
  export interface IConfigParams {
    code: string;
    node: string;
    matcher: string;
    api: string;
    apiVersion: string;
    coinomat: string;
    support: string;
    nodeList: string;
    assets: Record<string, string>;
    minimalSeedLength: number;
    remappedAssetNames: Record<string, string>;
    oracleDCC: string;
    oracleTokenomica: string;
    tokenrating: string;
    rewriteAssets: Record<string, unknown>;
  }

  export const config: {
    get<K extends keyof IConfigParams>(key: K): IConfigParams[K];
    get(key: string): unknown;
    set<K extends keyof IConfigParams>(key: K, value: IConfigParams[K]): void;
    set(key: string, value: unknown): void;
    setConfig(props: Partial<IConfigParams>): void;
    getDataService(): {
      getCandles(
        amountId: string,
        priceId: string,
        options: Record<string, unknown>,
      ): Promise<unknown>;
      [key: string]: unknown;
    };
    timeDiff: number;
    matcherSettingsPromise: Promise<string[]>;
    change: { dispatch(key: keyof IConfigParams): void };
  };

  // ========== Signature API ==========
  export interface ISignable {
    getId(): Promise<string>;
    getDataForApi(): Promise<Record<string, unknown>>;
  }

  export interface ISignatureApi {
    isAvailable(force?: boolean): Promise<boolean>;
    getAddress(): Promise<string>;
    getSeed(): Promise<string>;
    getPrivateKey(): Promise<string>;
    getPublicKey(): Promise<string>;
    getEncodedSeed(): Promise<string>;
    makeSignable(data: { type: unknown; data: Record<string, unknown> }): ISignable;
    [key: string]: unknown;
  }

  // ========== API ==========
  export const api: {
    transactions: {
      list(address: string, limit: number, after: string): Promise<unknown[]>;
      [key: string]: unknown;
    };
    aliases: {
      getByAddress(address: string): Promise<unknown[]>;
      getAddressByAlias(alias: string): Promise<{ address: string } | null>;
      getAliasesByAddress(address: string): Promise<string[]>;
      [key: string]: unknown;
    };
    matcher: {
      addSignature(signature: string, publicKey: string, timestamp: number): void;
      getOrderBook(amountAsset: string, priceAsset: string): Promise<unknown>;
      [key: string]: unknown;
    };
    pairs: {
      get(asset1: string, asset2: string): Promise<AssetPair>;
      [key: string]: unknown;
    };
    node: {
      height(): Promise<number>;
      [key: string]: unknown;
    };
    assets: {
      get(assetId: string): Promise<unknown>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  // ========== App ==========
  export const app: {
    address: string;
    login(userData: { address: string; publicKey: string }): void;
    logOut(): void;
    addMatcherSign(timestamp: number, signature: string): Promise<void>;
    getTimeStamp(count: number, timeType: string): number;
    getSignIdForMatcher(timestamp: number): Promise<string>;
  };

  // ========== Seed ==========
  export class Seed {
    readonly phrase: string;
    readonly address: string;
    readonly keyPair: {
      publicKey: string;
      privateKey: string;
    };
    constructor(phrase: string, chainId?: number);
    static create(words?: number): Seed;
    static fromExistingPhrase(phrase: string, chainId?: number): Seed;
    encrypt(password: string, encryptionRounds?: number): string;
    static decrypt(encryptedPhrase: string, password: string, encryptionRounds?: number): string;
  }

  // ========== Broadcast ==========
  export function broadcast(tx: unknown): Promise<unknown>;
  export function createOrder(orderData: unknown): Promise<unknown>;
  export function cancelOrder(
    orderId: string,
    senderPublicKey: string,
    signature: string,
  ): Promise<unknown>;
  export function cancelAllOrders(
    senderPublicKey: string,
    signature: string,
    timestamp: number,
  ): Promise<unknown>;

  // ========== Signature ==========
  export const signature: {
    getSignatureApi(): ISignatureApi;
    getDefaultSignatureApi(userData: { address: string; publicKey: string }): ISignatureApi;
    getUserAddress(): string;
    setUserData(data: { address: string; publicKey: string }): void;
    dropSignatureApi(): void;
    dropUserData(): void;
    [key: string]: unknown;
  };

  // ========== Utils ==========
  export function fetch<T>(url: string, options?: unknown): Promise<T>;

  export function moneyFromTokens(
    tokens: string | number | BigNumber,
    assetData: string | Record<string, unknown>,
  ): Promise<Money>;
  export function moneyFromCoins(
    coins: string | number | BigNumber,
    assetData: string | Record<string, unknown>,
  ): Promise<Money>;

  // ========== Re-exports ==========
  export const signAdapters: typeof import('@decentralchain/signature-adapter');
  export const isValidAddress: (address: string) => boolean;
  export const assetStorage: unknown;
  export const dccDataEntities: Record<string, unknown>;
  export const dataManager: {
    dropAddress(): void;
    applyAddress(address: string): void;
  };
}

declare module 'data-service/classes/Seed' {
  export class Seed {
    readonly phrase: string;
    readonly address: string;
    readonly keyPair: {
      publicKey: string;
      privateKey: string;
    };
    constructor(phrase: string, chainId?: number);
    static create(words?: number): Seed;
    static fromExistingPhrase(phrase: string, chainId?: number): Seed;
    encrypt(password: string, encryptionRounds?: number): string;
    static decrypt(encryptedPhrase: string, password: string, encryptionRounds?: number): string;
  }
}
