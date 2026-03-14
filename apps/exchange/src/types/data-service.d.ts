/**
 * Type declarations for the data-service module
 * This module lives at ../data-service in the monorepo and is resolved via tsconfig paths + Vite alias
 */

declare module 'data-service' {
  import type { Money, AssetPair, OrderPrice } from '@waves/data-entities';
  import type { BigNumber } from '@waves/bignumber';

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
    oracleWaves: string;
    oracleTokenomica: string;
    tokenrating: string;
    rewriteAssets: Record<string, unknown>;
  }

  export const config: {
    get<K extends keyof IConfigParams>(key: K): IConfigParams[K];
    get(key: string): any;
    set<K extends keyof IConfigParams>(key: K, value: IConfigParams[K]): void;
    set(key: string, value: any): void;
    setConfig(props: Partial<IConfigParams>): void;
    getDataService(): { getCandles(amountId: string, priceId: string, options: any): Promise<any>; [key: string]: any };
    timeDiff: number;
    matcherSettingsPromise: Promise<string[]>;
    change: { dispatch(key: keyof IConfigParams): void };
  };

  // ========== Signature API ==========
  export interface ISignatureApi {
    isAvailable(force?: boolean): Promise<boolean>;
    getAddress(): Promise<string>;
    getSeed(): Promise<string>;
    getPrivateKey(): Promise<string>;
    getPublicKey(): Promise<string>;
    getEncodedSeed(): Promise<string>;
    [key: string]: any;
  }

  // ========== API ==========
  export const api: {
    transactions: {
      list(address: string, limit: number, after: string): Promise<any[]>;
      [key: string]: any;
    };
    aliases: {
      getByAddress(address: string): Promise<any[]>;
      getAddressByAlias(alias: string): Promise<{ address: string } | null>;
      getAliasesByAddress(address: string): Promise<string[]>;
      [key: string]: any;
    };
    matcher: {
      addSignature(signature: string, publicKey: string, timestamp: number): void;
      getOrderBook(amountAsset: string, priceAsset: string): Promise<any>;
      [key: string]: any;
    };
    pairs: {
      get(asset1: any, asset2: any): Promise<AssetPair>;
      [key: string]: any;
    };
    node: {
      height(): Promise<number>;
      [key: string]: any;
    };
    assets: {
      get(assetId: string): Promise<any>;
      [key: string]: any;
    };
    [key: string]: any;
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
  export function cancelOrder(orderId: string, senderPublicKey: string, signature: string): Promise<unknown>;
  export function cancelAllOrders(senderPublicKey: string, signature: string, timestamp: number): Promise<unknown>;

  // ========== Signature ==========
  export const signature: {
    getSignatureApi(): ISignatureApi;
    getDefaultSignatureApi(userData: any): ISignatureApi;
    getUserAddress(): string;
    setUserData(data: { address: string; publicKey: string }): void;
    dropSignatureApi(): void;
    dropUserData(): void;
    [key: string]: any;
  };

  // ========== Utils ==========
  export function fetch<T>(url: string, options?: unknown): Promise<T>;

  export function moneyFromTokens(tokens: string | number | BigNumber, assetData: any): Promise<Money>;
  export function moneyFromCoins(coins: string | number | BigNumber, assetData: any): Promise<Money>;

  // ========== Re-exports ==========
  export const signAdapters: typeof import('@decentralchain/signature-adapter');
  export const isValidAddress: (address: string) => boolean;
  export const assetStorage: unknown;
  export const wavesDataEntities: Record<string, unknown>;
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
