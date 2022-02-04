import { Adapter } from './Adapter';
import { AdapterType } from '../config';
import { SIGN_TYPE, TSignData } from '../prepareTx';
import { isValidAddress } from '../prepareTx/fieldValidator';
import equals = require('ramda/src/equals');

const DEFAULT_TX_VERSIONS = {
    [SIGN_TYPE.AUTH]: [1],
    [SIGN_TYPE.MATCHER_ORDERS]: [1],
    [SIGN_TYPE.CREATE_ORDER]: [1, 2, 3],
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
    [SIGN_TYPE.UPDATE_ASSET_INFO]: [1]
};

export class CubensisConnectAdapter extends Adapter {

    public static type = AdapterType.CubensisConnect;
    public static adapter: CubensisConnectAdapter;
    private static _onUpdateCb: Array<(...args: Array<any>) => any> = [];
    private static _state: any;
    private _onDestoryCb = [];
    private _needDestroy = false;
    private _address: string;
    private _pKey: string;
    private static _txVersion: typeof DEFAULT_TX_VERSIONS = DEFAULT_TX_VERSIONS;
    private static _getApiCb: () => ICubensisConnect;

    private static _api: ICubensisConnect;

    private handleUpdate = (state: any) => {
        if (!state.locked && (!state.account || state.account.address !== this._address)) {
            this._needDestroy = true;
            this._isDestroyed = true;
            //@ts-ignore
            this._onDestoryCb.forEach(cb => cb());
            this._onDestoryCb = [];
            CubensisConnectAdapter.offUpdate(this.handleUpdate);
        }
    };

    constructor({ address, publicKey }: any, networkCode?: number|string) {
        super(networkCode);
        this._address = address;
        this._pKey = publicKey;
        CubensisConnectAdapter._initExtension();
        //@ts-ignore
        CubensisConnectAdapter.onUpdate(this.handleUpdate);
        this._isDestroyed = false;
    }

    public async isAvailable(ignoreLocked = false): Promise<void> {
        try {
            await CubensisConnectAdapter.isAvailable(this.getNetworkByte());
            const data = await CubensisConnectAdapter._api.publicState();
            CubensisConnectAdapter._updateState(data);

            if (data.locked) {
                return ignoreLocked ? Promise.resolve() : Promise.reject({ code: 4, msg: 'Cubensis is locked' });
            }

            if (data.account && data.account.address === this._address) {
                return Promise.resolve();
            }
        } catch (e) {
            if (e.code === 3) {
                return Promise.reject({ ...e })
            }
        }

        return Promise.reject({ code: 5, msg: 'Cubensis has another active account' });
    }

    public async isLocked() {
        await CubensisConnectAdapter.isAvailable();
        const data = await CubensisConnectAdapter._api.publicState();

        CubensisConnectAdapter._updateState(data);

        if (data.locked) {
            return Promise.resolve();
        }
    }

    public getSignVersions(): Record<SIGN_TYPE, Array<number>> {
        return CubensisConnectAdapter._txVersion;
    }

    //@ts-ignore
    public onDestroy(cb) {
        if (this._needDestroy) {
            return cb();
        }

        //@ts-ignore
        this._onDestoryCb.push(cb);
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

    //@ts-ignore
    public async signRequest(bytes: Uint8Array, _?, signData?): Promise<string> {
        await this.isAvailable(true);
        signData = signData || _ || {};
        if (signData && signData.type === 'customData') {
            return (await CubensisConnectAdapter._api.signCustomData(signData)).signature;
        }

        return await CubensisConnectAdapter._api.signRequest(CubensisConnectAdapter._serializedData(signData));
    }

    //@ts-ignore
    public async signTransaction(bytes: Uint8Array, precisions: Record<string, number>, signData): Promise<string> {
        await this.isAvailable(true);
        const dataStr = await CubensisConnectAdapter._api.signTransaction(CubensisConnectAdapter._serializedData(signData));
        const { proofs, signature } = JSON.parse(dataStr);
        return signature || proofs.pop();
    }

    //@ts-ignore
    public async signOrder(bytes: Uint8Array, precisions: Record<string, number>, signData): Promise<string> {
        await this.isAvailable(true);
        let promise;
        switch (signData.type) {
            case SIGN_TYPE.CREATE_ORDER:
                promise = CubensisConnectAdapter._api.signOrder(CubensisConnectAdapter._serializedData(signData));
                break;
            case SIGN_TYPE.CANCEL_ORDER:
                promise = CubensisConnectAdapter._api.signCancelOrder(CubensisConnectAdapter._serializedData(signData));
                break;
            default:
                return CubensisConnectAdapter._api.signRequest(CubensisConnectAdapter._serializedData(signData));
        }

        const dataStr = await promise;
        const { proofs, signature } = JSON.parse(dataStr);
        return signature || proofs.pop();
    }

    public async signData(bytes: Uint8Array): Promise<string> {
        throw new Error('Method "signData" is not available!');
    }

    public getPrivateKey() {
        return Promise.reject('No private key');
    }

    public static async isAvailable(networkCode?: number) {
        await CubensisConnectAdapter._initExtension();

        if (!this._api) {
            throw { code: 0, message: 'Install CubensisConnect' };
        }

        if (!(networkCode || Adapter._code)) {
            throw { code: 5, message: 'Set adapter network code' };
        }

        let error, data;
        try {
            data = await this._api.publicState();
            CubensisConnectAdapter._updateState(data);

            if (data.txVersion) {
                CubensisConnectAdapter._txVersion = data.txVersion;
            }
        } catch (e) {
            error = { code: 1, message: 'No permissions' };
        }

        if (!error && data) {
            if (!data.account) {
                error = { code: 2, message: 'No accounts in cubensisconnect' };
            } else if ((!data.account.address || !isValidAddress(data.account.address, networkCode || Adapter._code))) {
                error = { code: 3, message: 'Selected network incorrect' };
            }
        }

        if (error) {
            throw error;
        }

        return true;
    }

    public static async getUserList() {
        await CubensisConnectAdapter.isAvailable();
        return CubensisConnectAdapter._api.publicState().then((data) => {
            CubensisConnectAdapter._updateState(data);
            return [data.account];
        });
    }

    //@ts-ignore
    public static initOptions(options) {
        Adapter.initOptions(options);
        this.setApiExtension(options.extension);
        this._initExtension();
        try {
            this._api.publicState().then(CubensisConnectAdapter._updateState);
        } catch (e) {

        }
    }

    //@ts-ignore
    public static setApiExtension(extension) {

        let extensionCb;

        if (typeof extension === 'function') {
            extensionCb = extension;
        } else if (extension) {
            extensionCb = () => extension;
        }

        CubensisConnectAdapter._getApiCb = extensionCb;
    }

    public static onUpdate(cb: any) {
        CubensisConnectAdapter._onUpdateCb.push(cb);
    }

    public static offUpdate(func: any) {
        CubensisConnectAdapter._onUpdateCb = CubensisConnectAdapter._onUpdateCb.filter(f => f !== func)
    }

    private static _updateState(state: any) {
        if (equals(CubensisConnectAdapter._state, state)) {
            return;
        }

        for (const cb of CubensisConnectAdapter._onUpdateCb) {
            cb(state);
        }
    }

    private static _initExtension() {
        if (CubensisConnectAdapter._api || !CubensisConnectAdapter._getApiCb) {
            return CubensisConnectAdapter._api.initialPromise;
        }

        const wavesApi = CubensisConnectAdapter._getApiCb();
        if (wavesApi) {
           return wavesApi.initialPromise.then((api: ICubensisConnect) => {
                this._api = api;
                this._api.on('update', CubensisConnectAdapter._updateState);
                this._api.publicState().then(state => {

                    if (state.txVersion) {
                        CubensisConnectAdapter._txVersion = state.txVersion;
                    }

                    CubensisConnectAdapter._updateState(state);
                })
            });
        }
    }

    private static _serializedData(data: any) {
        return JSON.parse(
            JSON.stringify(data, (key, value) => value instanceof Uint8Array ? Array.from(value) : value)
        );
    }


}


interface ICubensisConnect {
    getSignVersions?: () => Record<SIGN_TYPE, Array<number>>;
    auth: (data: IAuth) => Promise<IAuthData>;
    signTransaction: (data: TSignData) => Promise<any>;
    signOrder: (data: any) => Promise<any>;
    signCancelOrder: (data: any) => Promise<any>;
    signRequest: (data: any) => Promise<string>;
    signCustomData: (data: any) => Promise<{
        version: number;
        binary: string;
        publicKey: string;
        hash: string;
        signature: string;
    }>;
    publicState: () => Promise<any>;
    on: (name: string, cb: any) => Promise<any>;
    initialPromise: Promise<ICubensisConnect>;
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
