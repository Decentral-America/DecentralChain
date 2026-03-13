import { DCCLedger, type DCCLedgerOptions } from '@decentralchain/ledger';
import { AdapterType } from '../adapterType';
import { SIGN_TYPE } from '../prepareTx';
import { Adapter } from './Adapter';

interface LedgerPrecision {
  amountPrecision: number;
  amount2Precision: number;
  feePrecision: number;
  [key: string]: number;
}

interface LedgerSignData {
  type: number;
  data: { version: number; [key: string]: unknown };
  [key: string]: unknown;
}

export class LedgerAdapter extends Adapter {
  private _currentUser: { id: number; address: string; publicKey: string };
  public static override type = AdapterType.Ledger;
  private static _ledger: DCCLedger;
  private static _hasConnectionPromise: Promise<boolean> | null;

  constructor(user: { id: number; address: string; publicKey: string }) {
    super();
    this._currentUser = user;

    if (!this._currentUser) {
      throw new Error('No selected user');
    }

    this._isDestroyed = false;
  }

  public override isAvailable() {
    return this._isMyLedger();
  }

  public static override isAvailable() {
    if (!LedgerAdapter._hasConnectionPromise) {
      LedgerAdapter._hasConnectionPromise = LedgerAdapter._ledger.probeDevice();
    }

    return LedgerAdapter._hasConnectionPromise.then(
      () => {
        LedgerAdapter._hasConnectionPromise = null;
        return true;
      },
      (_err: unknown) => {
        LedgerAdapter._hasConnectionPromise = null;
        return false;
      },
    );
  }

  public getSyncAddress(): string {
    return this._currentUser.address;
  }

  public getSyncPublicKey(): string {
    return this._currentUser.publicKey;
  }

  public getPublicKey() {
    return Promise.resolve(this._currentUser.publicKey);
  }

  public getAddress() {
    return Promise.resolve(this._currentUser.address);
  }

  public getSeed() {
    return Promise.reject(Error('Method "getSeed" is not available!'));
  }

  public getAdapterVersion() {
    return LedgerAdapter._ledger.getVersion();
  }

  public signRequest(bytes: Uint8Array): Promise<string> {
    return this._isMyLedger().then(() =>
      LedgerAdapter._ledger.signRequest(this._currentUser.id, { dataBuffer: bytes }),
    );
  }

  public signTransaction(
    bytes: Uint8Array,
    precision: LedgerPrecision,
    signData: unknown,
  ): Promise<string> {
    if (bytes[0] === 15) {
      return this.signData(bytes);
    }
    const sd = signData as LedgerSignData;
    return this._isMyLedger().then(() =>
      LedgerAdapter._ledger.signTransaction(this._currentUser.id, {
        amount2Precision: precision.amount2Precision,
        amountPrecision: precision.amountPrecision,
        feePrecision: precision.feePrecision,
        dataType: sd.type,
        dataVersion: sd.data.version,
        dataBuffer: bytes,
      }),
    );
  }

  public signOrder(bytes: Uint8Array, precision: LedgerPrecision, data: unknown): Promise<string> {
    const sd = data as LedgerSignData;
    return this._isMyLedger().then(() =>
      LedgerAdapter._ledger.signOrder(this._currentUser.id, {
        dataBuffer: bytes,
        amountPrecision: precision.amountPrecision,
        feePrecision: precision.feePrecision,
        dataVersion: sd.data.version,
      }),
    );
  }

  public signData(bytes: Uint8Array): Promise<string> {
    return this._isMyLedger().then(() =>
      LedgerAdapter._ledger.signSomeData(this._currentUser.id, { dataBuffer: bytes }),
    );
  }

  public getEncodedSeed() {
    return Promise.reject(Error('Method "getEncodedSeed" is not available!'));
  }

  public getPrivateKey() {
    return Promise.reject(new Error('No private key'));
  }

  public getSignVersions(): Record<SIGN_TYPE, number[]> {
    return {
      [SIGN_TYPE.AUTH]: [1],
      [SIGN_TYPE.MATCHER_ORDERS]: [1],
      [SIGN_TYPE.DCC_CONFIRMATION]: [1],
      [SIGN_TYPE.CREATE_ORDER]: [1, 2, 3, 4],
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
      [SIGN_TYPE.ETHEREUM_TX]: [1],
    };
  }

  protected _isMyLedger() {
    const promise = LedgerAdapter._ledger.getUserDataById(this._currentUser.id).then((user) => {
      if (user.address !== this._currentUser.address) {
        this._isDestroyed = true;
        throw new Error('Invalid ledger: address mismatch');
      }
    });

    promise.catch((e: unknown) => {
      console.warn('Ledger validation failed:', e instanceof Error ? e.message : e);
    });

    return promise;
  }

  public static override getUserList(from = 1, to = 1) {
    return LedgerAdapter._ledger.getPaginationUsersData(from, to) as Promise<unknown[]>;
  }

  public static override initOptions(options: DCCLedgerOptions & { networkCode: number }) {
    Adapter.initOptions(options);
    LedgerAdapter._ledger = new DCCLedger(options);
  }
}
