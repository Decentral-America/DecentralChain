import { Money } from '@waves/data-entities';
import { DATA_PROVIDER_VERSIONS, STATUS_LIST, TProviderAsset } from '@waves/oracle-data';
import { path } from 'ramda';
import { getAliasesByAddress } from '../api/aliases/aliases';
import { balanceList } from '../api/assets/assets';
import { IBalanceItem } from '../api/assets/interface';
import { getOracleData, IOracleData } from '../api/data';
import { getReservedBalance } from '../api/matcher/getOrders';
import { change, get } from '../config';
import { IHash } from '../interface';
import { IPollAPI, Poll } from '../utils/Poll';
import { PollControl } from './PollControl';
import { UTXManager } from './UTXManager';


export class DataManager {

    public transactions: UTXManager = new UTXManager();
    public pollControl: PollControl<TPollHash>;
    private _address: string;
    private _silentMode: boolean = false;

    constructor() {
        this.pollControl = new PollControl<TPollHash>(() => this._createPolls());
        change.on((key) => {
            if (key === 'oracleWaves' && !this._silentMode) {
                this.pollControl.restart('oracleWaves');
            }
        });
    }

    public setSilentMode(silent: boolean): void {
        this._silentMode = silent;
        if (silent) {
            this.pollControl.pause();
        } else {
            this.pollControl.play();
        }
    }

    public applyAddress(address: string): void {
        this.dropAddress();
        this._address = address;
        this.pollControl.create();
        this.transactions.applyAddress(this._address);
    }

    public dropAddress() {
        this._address = undefined;
        this.pollControl.destroy();
        this.transactions.dropAddress();
    }

    public getBalances(): Promise<Array<IBalanceItem>> {
        return this.pollControl.getPollHash().balance.getDataPromise();
    }

    public getReservedInOrders(): Promise<IHash<Money>> {
        return this.pollControl.getPollHash().orders.getDataPromise();
    }

    public getAliasesPromise(): Promise<Array<string>> {
        return this.pollControl.getPollHash().aliases.getDataPromise();
    }

    public getLastAliases(): Array<string> {
        return this.pollControl.getPollHash().aliases.lastData || [];
    }

    public getOracleAssetDataByOracleName(id: string, oracleName: string = 'oracleWaves'): TProviderAsset & { provider: string } {
        let pollHash = this.pollControl.getPollHash();
        const lastData = <any>path([oracleName, 'lastData'], pollHash);
        const assets = lastData && lastData.assets || Object.create(null);
        const WavesApp = (window as any).WavesApp;

        const gateways = {
            [WavesApp.defaultAssets.BTC]: true
        };

        const gatewaysSoon = (window as any).angular
            .element(document.body).injector().get('configService').get('GATEWAYS_SOON') || [];

        const descriptionHash = {
            DCC: { en: 'DecentralCoin (DCC) es la moneda nativa del protocolo DecentralChain. DecentralChain permite facilitar la creación de activos, coleccionables digitales, redes de blockchain privadas y aplicaciones descentralizadas, para facilitar la adopción de tecnologías descentralizadas en empresas y comunidades' }
        };

        const gatewayAsset = {
            status: 3,
            version: DATA_PROVIDER_VERSIONS.BETA,
            id,
            provider: 'WavesPlatform',
            ticker: null,
            link: null,
            email: null,
            logo: null,
            description: descriptionHash[id]
        };

        const gatewaySoonAsset = {
            ...gatewayAsset,
            status: 4
        };

        if (id === 'DCC') {
            return { status: STATUS_LIST.VERIFIED, description: descriptionHash.DCC } as any;
        }

        if (gatewaysSoon.indexOf(id) > -1) {
            return gatewaySoonAsset;
        }

        if (gateways[id]) {
            return gatewayAsset;
        }

        return assets[id] ? { ...assets[id], provider: lastData.oracle.name } : null;
    }

    public getOraclesAssetData(id: string) {
        const dataOracleWaves = this.getOracleAssetDataByOracleName(id, 'oracleWaves');
        const dataOracleTokenomica = this.getOracleAssetDataByOracleName(id, 'oracleTokenomica');
        return dataOracleWaves || dataOracleTokenomica;
    }

    public getOracleData(oracleName: string) {
        return this.pollControl.getPollHash()[oracleName].lastData;
    }

    private _getPollBalanceApi(): IPollAPI<Array<IBalanceItem>> {
        const get = () => {
            const hash = this.pollControl.getPollHash();
            const inOrdersHash = hash && hash.orders.lastData || Object.create(null);
            return balanceList(this._address, Object.create(null), inOrdersHash);
        };
        return { get, set: () => null };
    }

    private _getPollOrdersApi(): IPollAPI<IHash<Money>> {
        return {
            get: () => getReservedBalance(),
            set: () => null
        };
    }

    private _getPollAliasesApi(): IPollAPI<Array<string>> {
        return {
            get: () => getAliasesByAddress(this._address),
            set: () => null
        };
    }

    private _getPollOracleApi(address: string): IPollAPI<IOracleData> {
        return {
            get: () => {
                return address ? getOracleData(address) : Promise.resolve({ assets: Object.create(null) }) as any;
            },
            set: () => null
        };
    }

    private _createPolls(): TPollHash {
        const balance = new Poll(this._getPollBalanceApi(), 1000);
        const orders = new Poll(this._getPollOrdersApi(), 1000);
        const aliases = new Poll(this._getPollAliasesApi(), 10000);
        const oracleWaves = new Poll(this._getPollOracleApi(get('oracleWaves')), 30000);
        const oracleTokenomica = new Poll(this._getPollOracleApi(get('oracleTokenomica')), 30000);

        return { balance, orders, aliases, oracleWaves, oracleTokenomica };
    }

}

type TPollHash = {
    balance: Poll<Array<IBalanceItem>>;
    orders: Poll<IHash<Money>>;
    aliases: Poll<Array<string>>;
    oracleWaves: Poll<IOracleData>
    oracleTokenomica: Poll<IOracleData>
}

export interface IOracleAsset {
    id: string;
    status: number; // TODO! Add enum
    logo: string;
    site: string;
    ticker: string;
    email: string;
    description?: Record<string, string>;
}
