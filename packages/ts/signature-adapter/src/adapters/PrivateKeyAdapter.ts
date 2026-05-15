import { libs } from '@decentralchain/transactions';
import { AdapterType } from '../adapterType';
import { SIGN_TYPE } from '../prepareTx';
import { Adapter, type IUser } from './Adapter';

const publicKey = libs.crypto.publicKey;
const address = libs.crypto.address;
const signWithPrivateKey = libs.crypto.signBytes;

export class PrivateKeyAdapter extends Adapter {
  private privateKey = '';
  private address = '';
  private publicKey = '';
  public static override type = AdapterType.PrivateKey;

  constructor(data: string | IUser, networkCode?: string | number) {
    super(networkCode);

    if (typeof data === 'string') {
      this.privateKey = data;
    } else {
      // Legacy MD5+AES-CBC encrypted private key format was removed in DCC-192.
      // Provide unencrypted private key instead.
      throw new Error(
        'Encrypted private key import (encryptedPrivateKey + password) is no longer supported. ' +
          'The legacy MD5+AES-CBC KDF was removed. Provide a plaintext private key.',
      );
    }

    this.publicKey = publicKey({ privateKey: this.privateKey });
    this.address = address({ publicKey: this.publicKey }, this._code);
    this._isDestroyed = false;
  }

  public getSignVersions(): Record<SIGN_TYPE, number[]> {
    return {
      [SIGN_TYPE.AUTH]: [1],
      [SIGN_TYPE.MATCHER_ORDERS]: [1],
      [SIGN_TYPE.CREATE_ORDER]: [1, 2, 3, 4],
      [SIGN_TYPE.CANCEL_ORDER]: [0, 1],
      [SIGN_TYPE.COINOMAT_CONFIRMATION]: [1],
      [SIGN_TYPE.DCC_CONFIRMATION]: [1],
      [SIGN_TYPE.TRANSFER]: [3, 2],
      [SIGN_TYPE.ISSUE]: [3, 2],
      [SIGN_TYPE.REISSUE]: [3, 2],
      [SIGN_TYPE.BURN]: [3, 2],
      [SIGN_TYPE.EXCHANGE]: [0, 1, 3, 2],
      [SIGN_TYPE.LEASE]: [3, 2],
      [SIGN_TYPE.CANCEL_LEASING]: [3, 2],
      [SIGN_TYPE.CREATE_ALIAS]: [3, 2],
      [SIGN_TYPE.MASS_TRANSFER]: [2, 1],
      [SIGN_TYPE.DATA]: [2, 1],
      [SIGN_TYPE.SET_SCRIPT]: [2, 1],
      [SIGN_TYPE.SPONSORSHIP]: [2, 1],
      [SIGN_TYPE.SET_ASSET_SCRIPT]: [2, 1],
      [SIGN_TYPE.SCRIPT_INVOCATION]: [2, 1],
      [SIGN_TYPE.UPDATE_ASSET_INFO]: [1],
      [SIGN_TYPE.ETHEREUM_TX]: [1],
    };
  }

  public getEncodedSeed() {
    return Promise.reject(Error('Method "getEncodedSeed" is not available!'));
  }

  public getSeed() {
    return Promise.reject(Error('Method "getSeed" is not available!'));
  }

  public getSyncAddress(): string {
    return this.address;
  }

  public getSyncPublicKey(): string {
    return this.publicKey;
  }

  public getPublicKey(): Promise<string> {
    return Promise.resolve(this.publicKey);
  }

  public getPrivateKey(): Promise<string> {
    if (this._isDestroyed) return Promise.reject(new Error('Adapter has been destroyed'));
    return Promise.resolve(this.privateKey);
  }

  public getAddress(): Promise<string> {
    return Promise.resolve(this.address);
  }

  public signRequest(bytes: Uint8Array): Promise<string> {
    return this._sign(bytes);
  }

  public signTransaction(bytes: Uint8Array): Promise<string> {
    return this._sign(bytes);
  }

  public signOrder(bytes: Uint8Array): Promise<string> {
    return this._sign(bytes);
  }

  public signData(bytes: Uint8Array): Promise<string> {
    return this._sign(bytes);
  }

  private _sign(bytes: Uint8Array): Promise<string> {
    return Promise.resolve(signWithPrivateKey({ privateKey: this.privateKey }, bytes));
  }

  public static override isAvailable() {
    return Promise.resolve(true);
  }
}
