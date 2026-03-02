import { SeedAdapter } from './adapters/SeedAdapter';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import { CustomAdapter, CubensisConnectAdapter } from './adapters';
import { PrivateKeyAdapter } from './adapters/PrivateKeyAdapter';
import { AdapterType } from './adapterType';

export { AdapterType } from './adapterType';

export const adapterPriorityList = [
  AdapterType.CubensisConnect,
  AdapterType.Ledger,
  AdapterType.Seed,
  AdapterType.PrivateKey,
  AdapterType.Custom,
];

export const adapterList = [
  SeedAdapter,
  LedgerAdapter,
  CubensisConnectAdapter,
  PrivateKeyAdapter,
  CustomAdapter,
];
