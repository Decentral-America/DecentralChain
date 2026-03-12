import { libs, serializeCustomData } from '@decentralchain/transactions';
import { AdapterType } from '../adapterType';
import { type SIGN_TYPE, type TSignData } from '../prepareTx';
import { Signable } from '../Signable';

const { stringToBytes } = libs.crypto;

export abstract class Adapter {
  public type: string;
  protected _code: number;
  protected _isDestroyed = true;
  protected static _code: number;

  protected constructor(networkCode?: string | number) {
    networkCode = typeof networkCode === 'string' ? networkCode.charCodeAt(0) : networkCode;
    this.type = (this.constructor as typeof Adapter).type;
    const resolvedCode = networkCode || Adapter._code;
    if (!resolvedCode) {
      throw new Error(
        'Network code is required. Call Adapter.initOptions({ networkCode }) or pass networkCode to the constructor.',
      );
    }
    this._code = resolvedCode;
  }

  public makeSignable<T extends TSignData>(forSign: T): Signable<T> {
    return new Signable(forSign, this);
  }

  public isAvailable(): Promise<void> {
    return Promise.resolve();
  }

  public static isAvailable(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public onDestroy(_cb?: (...args: never[]) => unknown): void {
    return;
  }

  public getNetworkByte(): number {
    return this._code ?? Adapter._code;
  }

  public isDestroyed(): boolean {
    return this._isDestroyed;
  }

  public abstract getSyncAddress(): string;

  public abstract getSyncPublicKey(): string;

  public abstract getSignVersions(): Record<SIGN_TYPE, number[]>;

  public abstract getPublicKey(): Promise<string>;

  public abstract getAddress(): Promise<string>;

  public abstract getPrivateKey(): Promise<string>;

  public abstract signRequest(databytes: Uint8Array, signData?: unknown): Promise<string>;

  public abstract signTransaction(
    bytes: Uint8Array,
    precisions: Record<string, number>,
    signData?: unknown,
  ): Promise<string>;

  public abstract signOrder(
    bytes: Uint8Array,
    precisions: Record<string, number>,
    signData: unknown,
  ): Promise<string>;

  public abstract signData(bytes: Uint8Array): Promise<string>;

  public abstract getSeed(): Promise<string>;

  public abstract getEncodedSeed(): Promise<string>;

  public static initOptions(options: { networkCode: number }) {
    Adapter._code = options.networkCode;
  }

  public signCustomData(data: string | number[] | Uint8Array) {
    const bytes = typeof data === 'string' ? stringToBytes(data) : Uint8Array.from(data);
    const serializeData = {
      version: 1,
      binary: libs.crypto.base64Encode(bytes),
    } as unknown as Parameters<typeof serializeCustomData>[0];
    const binary = serializeCustomData(serializeData);
    return this.signRequest(binary, { type: 'customData', ...serializeData });
  }

  public signApiTokenData(
    clientId: string,
    timestamp = Date.now(),
  ): Promise<{
    networkByte: number;
    signature: string;
    clientId: string;
    publicKey: string;
    seconds: number;
  }> {
    if (!clientId || typeof clientId !== 'string') {
      return Promise.reject(new Error('clientId must be a non-empty string'));
    }
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return Promise.reject(new Error('timestamp must be a positive finite number'));
    }
    const netByte = String.fromCharCode(this._code);
    return this.getPublicKey().then((publicKey) => {
      const seconds = Math.floor(timestamp / 1000);
      const data = `${netByte}:${clientId}:${String(seconds)}`;
      return this.signCustomData(data).then((signature) => {
        return {
          signature,
          publicKey,
          seconds,
          clientId,
          networkByte: this._code,
        };
      });
    });
  }

  public static type: AdapterType = AdapterType.Seed;

  public static getUserList(): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}

export interface IAdapterConstructor {
  new (): Adapter;

  type: AdapterType;

  getUserList(): Promise<string[]>;

  isAvailable(): Promise<boolean>;
}

export interface ISeedUser {
  encryptedSeed: string;
  password: string;
  encryptionRounds?: number;
}

export interface IPrivateKeyUser {
  encryptedPrivateKey: string;
  password: string;
  encryptionRounds?: number;
}

export type IUser = ISeedUser | IPrivateKeyUser;

export interface IProofData {
  profs?: string[];
  signature?: string;
}
