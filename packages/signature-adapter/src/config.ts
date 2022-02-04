import { SeedAdapter } from './adapters/SeedAdapter';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import { CustomAdapter, CubensisConnectAdapter } from './adapters';
import {PrivateKeyAdapter} from "./adapters/PrivateKeyAdapter";

export const enum AdapterType {
    Seed = 'seed',
    PrivateKey = 'privateKey',
    CubensisConnect = 'cubensisConnect',
    Ledger = 'ledger',
    Tresor = 'tresor',
    Custom = 'custom'
}

export const adapterPriorityList = [
    AdapterType.CubensisConnect,
    AdapterType.Ledger,
    AdapterType.Tresor,
    AdapterType.Seed,
    AdapterType.PrivateKey,
    AdapterType.Custom
];

export const adapterList = [
    SeedAdapter,
    LedgerAdapter,
    CubensisConnectAdapter,
    PrivateKeyAdapter,
    CustomAdapter
];
