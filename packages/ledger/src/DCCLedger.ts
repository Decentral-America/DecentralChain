/// <reference path="../interface.d.ts"/>


import {DCC, IUserData, ISignTxData, ISignOrderData, ISignData} from './DCC';
import { default as TransportU2F } from '@ledgerhq/hw-transport-u2f';
import { listen } from '@ledgerhq/logs';

declare const Buffer: any;

// NOTE: Derivation path must remain '44'/5741564'/...' to match the Ledger firmware.
// Changing this would cause existing Ledger users to derive different addresses.
const ADDRES_PREFIX = '44\'/5741564\'/0\'/0\'/';

export class DCCLedger {

    public ready: boolean;
    private _dccLibPromise: Promise<DCC> | null;
    private _initTransportPromise: Promise<any> | null;
    private _debug: boolean;
    private _openTimeout: number | undefined;
    private _listenTimeout: number | undefined;
    private _exchangeTimeout: number | undefined;
    private _networkCode: number;
    private _error: any;
    private _transport: any;

    constructor(options: IDCCLedger) {
        this.ready = false;
        this._networkCode = options.networkCode == null ? 76 : options.networkCode;
        this._dccLibPromise = null;
        this._initTransportPromise = null;
        this._debug = options.debug == null ? false : options.debug;
        this._openTimeout = options.openTimeout;
        this._listenTimeout = options.listenTimeout;
        this._exchangeTimeout = options.exchangeTimeout;
        this._error = null;
        this._transport = options.transport || TransportU2F;
        this.tryConnect().catch(
            (e) => console.warn('Ledger lib is not available', e)
        );
    }

    async tryConnect(): Promise<void> {
        try {
            const disconnectPromise = this.disconnect();
            this._initU2FTransport();
            this._setSettings();
            this._initDCCLib();
            await disconnectPromise;
            await Promise.all([this._initTransportPromise, this._dccLibPromise]);
        } catch (e) {
            throw new Error(e);
        }
    }

    async disconnect(): Promise<void> {
        const transportPromise = this._initTransportPromise;
        this._initTransportPromise = null;
        this._dccLibPromise = null;
        if (transportPromise) {
            try {
                const transport = await transportPromise;
                transport.close();
            } catch (e) {
            }
        }
    }

    async getTransport(): Promise<any> {
        try {
            return await this._dccLibPromise;
        } catch (e) {
            await this.tryConnect();
            return await this._dccLibPromise;
        }
    }

    async getUserDataById(id: number): Promise<IUser> {
        try {
            const dcc = await this.getTransport();
            const path = this.getPathById(id);
            const userData = await dcc.getWalletPublicKey(path, false);
            return {
                ...userData, id, path
            };
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    async getVersion(): Promise<Array<number>> {
        try {
            const dcc = await this.getTransport();
            return await dcc.getVersion();

        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    async getPaginationUsersData(from: number, limit: number): Promise<Array<IUser>> {
        const usersData = [];

        try {
            for (let id = from; id <= from + limit; id++) {
                const userData = await this.getUserDataById(id);
                usersData.push(userData);
            }
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }

        return usersData;
    }

    async signTransaction(userId: number, sData: ISignTxData) {
        const path = this.getPathById(userId);
        sData.dataBuffer = new Buffer(sData.dataBuffer);
        try {
            const dcc = await this.getTransport();
            return await dcc.signTransaction(path, sData);
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    async signOrder(userId: number, sData: ISignOrderData) {
        const path = this.getPathById(userId);
        sData.dataBuffer = new Buffer(sData.dataBuffer);
        try {
            const dcc = await this.getTransport();
            return await dcc.signOrder(path, sData);
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    async signSomeData(userId: number, sData: ISignData) {
        const path = this.getPathById(userId);
        sData.dataBuffer = new Buffer(sData.dataBuffer);
        try {
            const dcc = await this.getTransport();
            return await dcc.signSomeData(path, sData);
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    async signRequest(userId: number, sData: ISignData) {
        const path = this.getPathById(userId);
        sData.dataBuffer = new Buffer(sData.dataBuffer);
        try {
            const dcc = await this.getTransport();
            return await dcc.signRequest(path, sData);
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    async signMessage(userId: number, message: string) {
        const path = this.getPathById(userId);
        let sData: ISignData = {dataBuffer: new Buffer(message, 'ascii')};
        try {
            const dcc = await this.getTransport();
            return await dcc.signMessage(path, sData);
        } catch (e) {
            this.tryConnect();
            this._error = e;
            throw e;
        }
    }

    getLastError() {
        return this._error;
    }

    async probeDevice() {
        if (!this.ready) {
            await this.tryConnect();
        }

        this._error = null;

        try {
            await this.getUserDataById(1);
        } catch (e) {
            this._error = e;
            return false;
        }

        return true;
    }

    getPathById(id: number) {
        return `${ADDRES_PREFIX}${id}'`;
    }

    _setSettings() {
        (this._initTransportPromise as Promise<any>).then((transport) => {
            if(this._debug) {
                listen(function (l:  any) {
                    console.log(123);
                    console.log(l);
                })
            }
            //transport.setDebugMode(this._debug);
            transport.setExchangeTimeout(this._exchangeTimeout);
        }).catch(e => console.warn('can\'t init ledger', e));
    }

    _initU2FTransport() {
        this.ready = false;
        this._initTransportPromise = this._transport.create(this._openTimeout, this._listenTimeout);
        (this._initTransportPromise as Promise<any>).catch((e) => console.warn('Can\'t init transport', e));
        return this._initTransportPromise;
    }

    _initDCCLib() {
        this._dccLibPromise = (this._initTransportPromise as Promise<any>).then(
            (transport: any) => {
                this.ready = true;
                return new DCC(transport, this._networkCode);
            });
        return this._dccLibPromise;
    }

}

export default DCCLedger;

// Convenience alias
export { DCCLedger as Ledger };

interface IDCCLedger {
    debug?: boolean;
    openTimeout?: number;
    listenTimeout?: number;
    exchangeTimeout?: number;
    networkCode?: number,
    transport?: any;
}

interface IUser extends IUserData {
    id: number;
    path: string;
}
