import equals from 'ramda/src/equals';
import { AdapterType } from '../adapterType';
import { SIGN_TYPE, type TSignData } from '../prepareTx';
import { isValidAddress } from '../prepareTx/fieldValidator';
import { Adapter } from './Adapter';

const DEFAULT_TX_VERSIONS = {
  [SIGN_TYPE.AUTH]: [1],
  [SIGN_TYPE.MATCHER_ORDERS]: [1],
  [SIGN_TYPE.CREATE_ORDER]: [1, 2, 3, 4],
  [SIGN_TYPE.CANCEL_ORDER]: [1],
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

export class CubensisConnectAdapter extends Adapter {
  public static override type = AdapterType.CubensisConnect;
  public static adapter: CubensisConnectAdapter;
  private static _onUpdateCb: ((state: ICubensisConnectState) => void)[] = [];
  private static _state: unknown;
  private _onDestroyCb: (() => void)[] = [];
  private _needDestroy = false;
  private _address: string;
  private _pKey: string;
  private static _txVersion: typeof DEFAULT_TX_VERSIONS = DEFAULT_TX_VERSIONS;
  private static _getApiCb: (() => ICubensisConnect) | undefined;

  private static _api: ICubensisConnect;

  private handleUpdate = (state: ICubensisConnectState) => {
    if (!state.locked && state.account?.address !== this._address) {
      this._needDestroy = true;
      this._isDestroyed = true;
      this._onDestroyCb.forEach((cb) => {
        cb();
      });
      this._onDestroyCb = [];
      CubensisConnectAdapter.offUpdate(this.handleUpdate);
    }
  };

  constructor(
    { address, publicKey }: { address: string; publicKey: string },
    networkCode?: number | string,
  ) {
    super(networkCode);
    this._address = address;
    this._pKey = publicKey;
    CubensisConnectAdapter._initExtension();
    CubensisConnectAdapter.onUpdate(this.handleUpdate);
    this._isDestroyed = false;
  }

  public override async isAvailable(ignoreLocked = false): Promise<void> {
    try {
      await CubensisConnectAdapter.isAvailable(this.getNetworkByte());
      const data = await CubensisConnectAdapter._api.publicState();
      CubensisConnectAdapter._updateState(data);

      if (data.locked) {
        return ignoreLocked
          ? Promise.resolve()
          : Promise.reject(Object.assign(new Error('Cubensis is locked'), { code: 4 }));
      }

      if (data.account?.address === this._address) {
        return Promise.resolve();
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err as Error & { code?: number }).code === 3) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(
      Object.assign(new Error('Cubensis has another active account'), { code: 5 }),
    );
  }

  public static override async isAvailable(networkCode?: number) {
    await CubensisConnectAdapter._initExtension();

    if (!CubensisConnectAdapter._api) {
      throw Object.assign(new Error('Install CubensisConnect'), { code: 0 });
    }

    if (!(networkCode || Adapter._code)) {
      throw Object.assign(new Error('Set adapter network code'), { code: 5 });
    }

    let error: (Error & { code?: number }) | undefined, data: ICubensisConnectState | undefined;
    try {
      data = await CubensisConnectAdapter._api.publicState();
      CubensisConnectAdapter._updateState(data);

      if (data.txVersion) {
        CubensisConnectAdapter._txVersion = data.txVersion as typeof DEFAULT_TX_VERSIONS;
      }
    } catch {
      error = Object.assign(new Error('No permissions'), { code: 1 });
    }

    if (!error && data) {
      if (!data.account) {
        error = Object.assign(new Error('No accounts in cubensisconnect'), { code: 2 });
      } else if (
        !data.account.address ||
        !isValidAddress(data.account.address, networkCode || Adapter._code)
      ) {
        error = Object.assign(new Error('Selected network incorrect'), { code: 3 });
      }
    }

    if (error) {
      throw error;
    }

    return true;
  }

  public async isLocked() {
    await CubensisConnectAdapter.isAvailable();
    const data = await CubensisConnectAdapter._api.publicState();

    CubensisConnectAdapter._updateState(data);

    if (data.locked) {
      return Promise.resolve();
    }
  }

  public getSignVersions(): Record<SIGN_TYPE, number[]> {
    return CubensisConnectAdapter._txVersion;
  }

  public override onDestroy(cb: () => void) {
    if (this._needDestroy) {
      return cb();
    }

    this._onDestroyCb.push(cb);
  }

  public getSyncAddress(): string {
    return this._address;
  }

  public getSyncPublicKey(): string {
    return this._pKey;
  }

  public getPublicKey() {
    return Promise.resolve(this._pKey);
  }

  public getAddress() {
    return Promise.resolve(this._address);
  }

  public getEncodedSeed() {
    return Promise.reject(Error('Method "getEncodedSeed" is not available!'));
  }

  public getSeed() {
    return Promise.reject(Error('Method "getSeed" is not available!'));
  }

  public async signRequest(
    _bytes: Uint8Array,
    _?: unknown,
    signData?: Record<string, unknown>,
  ): Promise<string> {
    await this.isAvailable(true);
    signData = (signData || _ || {}) as Record<string, unknown>;
    if (signData?.type === 'customData') {
      return (await CubensisConnectAdapter._api.signCustomData(signData)).signature;
    }

    return await CubensisConnectAdapter._api.signRequest(
      CubensisConnectAdapter._serializedData(signData),
    );
  }

  public async signTransaction(
    _bytes: Uint8Array,
    _precisions: Record<string, number>,
    signData: unknown,
  ): Promise<string> {
    await this.isAvailable(true);
    const dataStr = await CubensisConnectAdapter._api.signTransaction(
      CubensisConnectAdapter._serializedData(signData),
    );
    const { proofs, signature } = JSON.parse(dataStr) as { proofs?: string[]; signature?: string };
    const result = signature || proofs?.pop();
    if (!result) {
      throw new Error('CubensisConnect returned empty signature and no proofs');
    }
    return result;
  }

  public async signOrder(
    _bytes: Uint8Array,
    _precisions: Record<string, number>,
    signData: Record<string, unknown>,
  ): Promise<string> {
    await this.isAvailable(true);
    let promise: Promise<string> | undefined;
    switch (signData.type) {
      case SIGN_TYPE.CREATE_ORDER:
        promise = CubensisConnectAdapter._api.signOrder(
          CubensisConnectAdapter._serializedData(signData),
        );
        break;
      case SIGN_TYPE.CANCEL_ORDER:
        promise = CubensisConnectAdapter._api.signCancelOrder(
          CubensisConnectAdapter._serializedData(signData),
        );
        break;
      default:
        return CubensisConnectAdapter._api.signRequest(
          CubensisConnectAdapter._serializedData(signData),
        );
    }

    const dataStr = await promise;
    const { proofs, signature } = JSON.parse(dataStr as string) as {
      proofs?: string[];
      signature?: string;
    };
    const result = signature || proofs?.pop();
    if (!result) {
      throw new Error('CubensisConnect returned empty signature and no proofs');
    }
    return result;
  }

  public async signData(_bytes: Uint8Array): Promise<string> {
    throw new Error('Method "signData" is not available!');
  }

  public getPrivateKey() {
    return Promise.reject(new Error('No private key'));
  }

  public static override async getUserList() {
    await CubensisConnectAdapter.isAvailable();
    return CubensisConnectAdapter._api.publicState().then((data) => {
      CubensisConnectAdapter._updateState(data);
      return [data.account];
    });
  }

  public static override initOptions(options: { networkCode: number; extension?: unknown }) {
    Adapter.initOptions(options);
    CubensisConnectAdapter.setApiExtension(options.extension);
    CubensisConnectAdapter._initExtension();
    try {
      CubensisConnectAdapter._api.publicState().then(CubensisConnectAdapter._updateState);
    } catch {
      /* ignored */
    }
  }

  public static setApiExtension(extension: unknown) {
    let extensionCb: (() => ICubensisConnect) | undefined;

    if (typeof extension === 'function') {
      extensionCb = extension as () => ICubensisConnect;
    } else if (extension) {
      extensionCb = () => extension as ICubensisConnect;
    }

    CubensisConnectAdapter._getApiCb = extensionCb;
    // Reset the cached API so _initExtension() re-evaluates the new callback
    CubensisConnectAdapter._api = undefined as unknown as ICubensisConnect;
  }

  public static onUpdate(cb: (state: ICubensisConnectState) => void) {
    CubensisConnectAdapter._onUpdateCb.push(cb);
  }

  public static offUpdate(func: (state: ICubensisConnectState) => void) {
    CubensisConnectAdapter._onUpdateCb = CubensisConnectAdapter._onUpdateCb.filter(
      (f) => f !== func,
    );
  }

  private static _updateState(state: ICubensisConnectState) {
    if (equals(CubensisConnectAdapter._state, state)) {
      return;
    }

    CubensisConnectAdapter._state = state;

    for (const cb of CubensisConnectAdapter._onUpdateCb) {
      cb(state);
    }
  }

  private static _initExtension() {
    if (CubensisConnectAdapter._api) {
      return CubensisConnectAdapter._api.initialPromise;
    }

    if (!CubensisConnectAdapter._getApiCb) {
      return Promise.resolve();
    }

    const dccApi = CubensisConnectAdapter._getApiCb();
    if (dccApi) {
      return dccApi.initialPromise.then((api: ICubensisConnect) => {
        CubensisConnectAdapter._api = api;
        CubensisConnectAdapter._api.on('update', CubensisConnectAdapter._updateState);
        CubensisConnectAdapter._api.publicState().then((state) => {
          if (state.txVersion) {
            CubensisConnectAdapter._txVersion = state.txVersion as typeof DEFAULT_TX_VERSIONS;
          }

          CubensisConnectAdapter._updateState(state);
        });
      });
    }
  }

  private static _serializedData(data: unknown) {
    return JSON.parse(
      JSON.stringify(data, (_key, value) =>
        value instanceof Uint8Array ? Array.from(value) : value,
      ),
    );
  }
}

interface ICubensisConnect {
  getSignVersions?: () => Record<SIGN_TYPE, number[]>;
  auth: (data: IAuth) => Promise<IAuthData>;
  signTransaction: (data: TSignData) => Promise<string>;
  signOrder: (data: unknown) => Promise<string>;
  signCancelOrder: (data: unknown) => Promise<string>;
  signRequest: (data: unknown) => Promise<string>;
  signCustomData: (data: unknown) => Promise<{
    version: number;
    binary: string;
    publicKey: string;
    hash: string;
    signature: string;
  }>;
  publicState: () => Promise<ICubensisConnectState>;
  on: (name: string, cb: (state: ICubensisConnectState) => void) => void;
  initialPromise: Promise<ICubensisConnect>;
}

interface ICubensisConnectState {
  locked?: boolean;
  account?: { address: string; publicKey?: string };
  txVersion?: typeof import('../prepareTx').SIGN_TYPE extends infer S
    ? Record<S extends number ? S : never, number[]>
    : never;
  [key: string]: unknown;
}

interface IAuth {
  data: string;
  name: string;
  icon?: string;
  successPath?: string;
}

interface IAuthData {
  address: string;
  data: string;
  host: string;
  prefix: string;
  publicKey: string;
  signature: string;
}
