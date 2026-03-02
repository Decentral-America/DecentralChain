import { Adapter } from './Adapter';
import { AdapterType } from '../adapterType';
import { SIGN_TYPE } from '../prepareTx';

export interface IUserApi {
  type: string;
  isAvailable: () => boolean;
  getAddress: () => string;
  getPublicKey: () => string;
  signRequest?: (bytes: number[] | Uint8Array) => Promise<string>;
  signTransaction?: (bytes: number[] | Uint8Array) => Promise<string>;
  signOrder?: (bytes: number[] | Uint8Array) => Promise<string>;
  signData?: (bytes: number[] | Uint8Array) => Promise<string>;
}

export class CustomAdapter<T extends IUserApi> extends Adapter {
  //@ts-ignore
  public currentUser: T;
  public static override type = AdapterType.Custom;

  //@ts-ignore
  constructor(userApi: T) {
    super();
    this.currentUser = userApi;
    this.type = userApi.type;
    if (!this.currentUser) {
      throw new Error('No selected userApi');
    }

    this._isDestroyed = false;
  }

  public override isAvailable(): Promise<void> {
    return this.currentUser.isAvailable() ? Promise.resolve() : Promise.reject();
  }

  public getSyncAddress(): string {
    return this.currentUser.getAddress();
  }

  public getSyncPublicKey(): string {
    return this.currentUser.getPublicKey();
  }

  public getPublicKey() {
    return Promise.resolve(this.getSyncPublicKey());
  }

  public getAddress() {
    return Promise.resolve(this.getSyncAddress());
  }

  public getSeed() {
    return Promise.reject(Error('Method "getSeed" is not available!'));
  }

  public getAdapterVersion() {
    return 1;
  }

  public signRequest(bytes: Uint8Array): Promise<string> {
    if (this.currentUser.signRequest) {
      return this.currentUser.signRequest(bytes);
    } else {
      throw new Error('No method to sign request');
    }
  }

  public signTransaction(
    bytes: Uint8Array,
    _precision: Record<string, number>,
    _signData: any,
  ): Promise<string> {
    if (this.currentUser.signTransaction) {
      return this.currentUser.signTransaction(bytes);
    } else {
      throw new Error('No method to sign transactions');
    }
  }

  public signOrder(
    bytes: Uint8Array,
    _precision: Record<string, number>,
    _data: any,
  ): Promise<string> {
    if (this.currentUser.signOrder) {
      return this.currentUser.signOrder(bytes);
    } else {
      throw new Error('No method to sign order');
    }
  }

  public signData(bytes: Uint8Array): Promise<string> {
    if (this.currentUser.signData) {
      return this.currentUser.signData(bytes);
    } else {
      throw new Error('No method to sign custom data');
    }
  }

  public getEncodedSeed() {
    return Promise.reject(Error('Method "getEncodedSeed" is not available!'));
  }

  public getPrivateKey() {
    return Promise.reject(Error('No private key'));
  }

  public getSignVersions(): Record<SIGN_TYPE, number[]> {
    return {
      [SIGN_TYPE.AUTH]: [1],
      [SIGN_TYPE.MATCHER_ORDERS]: [1],
      [SIGN_TYPE.DCC_CONFIRMATION]: [1],
      [SIGN_TYPE.CREATE_ORDER]: [1, 2, 3],
      [SIGN_TYPE.CANCEL_ORDER]: [1],
      [SIGN_TYPE.COINOMAT_CONFIRMATION]: [1],
      [SIGN_TYPE.ISSUE]: [2],
      [SIGN_TYPE.TRANSFER]: [2],
      [SIGN_TYPE.REISSUE]: [2],
      [SIGN_TYPE.BURN]: [2],
      [SIGN_TYPE.EXCHANGE]: [0, 1, 2],
      [SIGN_TYPE.LEASE]: [2],
      [SIGN_TYPE.CANCEL_LEASING]: [2],
      [SIGN_TYPE.CREATE_ALIAS]: [2],
      [SIGN_TYPE.MASS_TRANSFER]: [1],
      [SIGN_TYPE.DATA]: [1],
      [SIGN_TYPE.SET_SCRIPT]: [1],
      [SIGN_TYPE.SPONSORSHIP]: [1],
      [SIGN_TYPE.SET_ASSET_SCRIPT]: [1],
      [SIGN_TYPE.SCRIPT_INVOCATION]: [1],
      [SIGN_TYPE.UPDATE_ASSET_INFO]: [1],
    };
  }

  public static override initOptions(options: any) {
    Adapter.initOptions(options);
  }

  public static override isAvailable() {
    return Promise.resolve(true);
  }
}
