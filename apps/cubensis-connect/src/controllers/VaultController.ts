import { createStore } from 'zustand/vanilla';

import type { ExtensionStorage } from '../storage/storage';
import type { WalletController } from './wallet';

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
    this.store = createStore(() =>
      extensionStorage.getInitState({ initialized: false, locked: false }),
    );

    extensionStorage.subscribe(this.store);

    this.#wallet = wallet;

    this.store.setState({
      initialized: Boolean(wallet.store.getState().WalletController.vault),
      locked: !extensionStorage.getInitSession().vaultKeyBytes,
    });
  }

  async init(password: string) {
    await this.#wallet.initVault(password);
    this.store.setState({ initialized: true, locked: false });
  }

  lock() {
    this.#wallet.lock();
    this.store.setState({ locked: true });
  }

  async unlock(password: string) {
    await this.#wallet.unlock(password);
    this.store.setState({ locked: false });
  }

  async update(oldPassword: string, newPassword: string) {
    await this.#wallet.newPassword(oldPassword, newPassword);
  }

  async clear() {
    await this.#wallet.deleteVault();
    this.store.setState({ initialized: false, locked: true });
  }

  isLocked() {
    return this.store.getState().locked;
  }

  migrate() {
    // `state` may contain legacy fields (`initialized`, `locked`) that were
    // stored in WalletController in older versions and have since been moved to
    // VaultController's own store. Use a typed intersection instead of `any`.
    type LegacyWalletState = {
      vault: string | undefined;
      vaultSalt: string | undefined;
      vaultPepper?: string | undefined;
      initialized?: boolean;
      locked?: boolean;
    };
    const state = this.#wallet.store.getState().WalletController as LegacyWalletState;

    if (state.initialized != null) {
      this.store.setState({ initialized: state.initialized });
      delete state.locked;
      delete state.initialized;
      this.#wallet.store.setState(
        {
          WalletController: {
            vaultPepper: undefined as string | undefined,
            ...state,
          },
        },
        true,
      );
    }
  }
}
