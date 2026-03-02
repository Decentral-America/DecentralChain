import { find } from './utils';

export * from './adapters';
export * from './prepareTx';
export { isValidAddress } from './prepareTx/fieldValidator';
export * from './config';
export * from './Signable';
export * from './constants';
export * from './utils';

import { type Adapter } from './adapters';
import { adapterPriorityList, adapterList, type AdapterType } from './config';

export function getAvailableList(): Promise<(typeof Adapter)[]> {
  return Promise.all(
    adapterPriorityList.map(async (type) => {
      try {
        const adapter = getAdapterByType(type);
        if (!adapter) return null;
        const available = await adapter.isAvailable();
        return available ? adapter : null;
      } catch {
        return null;
      }
    }),
  ).then((list) => list.filter((item): item is typeof Adapter => item != null));
}

export function getAdapterByType(type: AdapterType): typeof Adapter | null {
  return find({ type }, adapterList) as typeof Adapter | null;
}
