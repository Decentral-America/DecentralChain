import ObservableStore from 'obs-store';

import { type ExtensionStorage } from '../storage/storage';
import { type WalletController } from './wallet';

export class VaultController {
  #wallet;

  store;

  constructor({
    extensionStorage,
    wallet,
  }: {
    extensionStorage: ExtensionStorage;
    wallet: WalletController;
  }) {
    this.store = new ObservableStore(
      extensionStorage.getInitState({ initialized: false, locked: false }),
    );

    extensionStorage.subscribe(this.store);

    this.#wallet = wallet;

    this.store.updateState({
      initialized: Boolean(wallet.store.getState().WalletController.vault),
      locked: !extensionStorage.getInitSession().password,
    });
  }

  async init(password: string) {
    await this.#wallet.initVault(password);
    this.store.updateState({ initialized: true, locked: false });
  }

  lock() {
    this.#wallet.lock();
    this.store.updateState({ locked: true });
  }

  async unlock(password: string) {
    await this.#wallet.unlock(password);
    this.store.updateState({ locked: false });
  }

  async update(oldPassword: string, newPassword: string) {
    await this.#wallet.newPassword(oldPassword, newPassword);
  }

  async clear() {
    await this.#wallet.deleteVault();
    this.store.updateState({ initialized: false, locked: true });
  }

  isLocked() {
    return this.store.getState().locked;
  }

  migrate() {
    const state = this.#wallet.store.getState().WalletController;

    if ((state as any).initialized != null) {
      this.store.updateState({
        initialized: (state as any).initialized,
      });

      delete (state as any).locked;
      delete (state as any).initialized;
      this.#wallet.store.putState(state as any);
    }
  }
}
