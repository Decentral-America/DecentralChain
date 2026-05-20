import { createStore } from 'zustand/vanilla';
import { fromEthereumToDccAddress, isEthereumAddress } from '#ui/utils/ethereum';

import type { ExtensionStorage } from '../storage/storage';

export class AddressBookController {
  private store;

  constructor({ extensionStorage }: { extensionStorage: ExtensionStorage }) {
    this.store = createStore(() => extensionStorage.getInitState({ addresses: {} }));
    extensionStorage.subscribe(this.store);
  }

  setAddress(address: string, name: string) {
    const { addresses } = this.store.getState();
    this.store.setState({ addresses: { ...addresses, [address]: name } });
  }

  setAddresses(newAddresses: Record<string, string>) {
    const { addresses } = this.store.getState();
    this.store.setState({ addresses: { ...newAddresses, ...addresses } });
  }

  removeAddress(address: string) {
    const { addresses } = this.store.getState();
    delete addresses[address];
    this.store.setState({ addresses });
  }

  migrate() {
    const { addresses } = this.store.getState();
    this.store.setState({
      addresses: Object.entries(addresses).reduce(
        (acc, [address, name]) => {
          acc[isEthereumAddress(address) ? fromEthereumToDccAddress(address) : address] = name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    });
  }
}
