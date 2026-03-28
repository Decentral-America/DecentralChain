import { captureException } from '@sentry/browser';
import { deepEqual } from 'fast-equals';
import type ObservableStore from 'obs-store';
import invariant from 'tiny-invariant';
import Browser from 'webextension-polyfill';
import { make, pipe, subscribe } from 'wonka';
import type { AssetsRecord } from '#assets/types';
import type { TrashItem } from '#controllers/trash';
import type { Message } from '#messages/types';
import type { NetworkName } from '#networks/types';
import type { NftInfo } from '#nfts/nfts';
import type { NotificationsStoreItem } from '#notifications/types';
import type { PermissionValue } from '#permissions/types';
import type { IdleOptions, PreferencesAccount } from '#preferences/types';
import type { UiState } from '#store/reducers/updateState';

import type {
  AssetsConfig,
  DEFAULT_MAIN_CONFIG,
  IgnoreErrorsConfig,
  NftConfig,
} from '../constants';
import { MIGRATIONS } from './migrations';

const CURRENT_MIGRATION_VERSION = 3;

export async function backupStorage() {
  const { backup, WalletController } = (await Browser.storage.local.get([
    'backup',
    'WalletController',
  ])) as { backup?: Record<string, unknown>; WalletController?: { vault?: string } };

  if (WalletController?.vault) {
    await Browser.storage.local.set({
      backup: {
        ...backup,
        [WalletController.vault]: {
          timestamp: Date.now(),
          version: Browser.runtime.getManifest().version,
        },
      },
    });
  }
}

export interface StorageLocalState {
  accounts: PreferencesAccount[];
  addresses: Record<string, string>;
  assetLogos: Record<string, string>;
  assets: Record<NetworkName, AssetsRecord>;
  swappableAssetIdsByVendor: Record<string, string[]>;
  assetsConfig: AssetsConfig;
  assetTickers: Record<string, string>;
  backup: string;
  config: {
    messages_config: typeof DEFAULT_MAIN_CONFIG.messages_config;
    pack_config: typeof DEFAULT_MAIN_CONFIG.pack_config;
    idle: typeof DEFAULT_MAIN_CONFIG.idle;
  };
  currentLocale: string;
  currentNetwork: NetworkName;
  customCodes: Record<NetworkName, string | null>;
  customMatchers: Record<NetworkName, string | null>;
  customNodes: Record<NetworkName, string | null>;
  data: TrashItem[];
  idleOptions: IdleOptions;
  ignoreErrorsConfig: IgnoreErrorsConfig;
  initialized: boolean;
  inPending: Record<string, string | null>;
  inShowMode: boolean | undefined;
  lastIdleKeeper: number | undefined;
  lastOpenKeeper: number | undefined;
  lastUpdateIdle: number;
  locked: boolean;
  messages: Message[];
  migrationVersion: number;
  nftConfig: NftConfig;
  nfts: Record<string, NftInfo>;
  notifications: NotificationsStoreItem[];
  notificationWindowId: number | undefined;
  origins: Record<string, PermissionValue[]>;
  selectedAccount: PreferencesAccount | undefined;
  status: number;
  tabs: Partial<Record<string, Browser.Tabs.Tab>>;
  uiState: UiState;
  usdPrices: Record<string, string>;
  userId: string | undefined;
  WalletController: {
    vault: string | undefined;
    /**
     * Base64-encoded 16-byte PBKDF2 salt used to derive the current vault key.
     * Stored separately from the vault ciphertext so the same key can be reused
     * for subsequent saves without re-running PBKDF2 from the password.
     */
    vaultSalt: string | undefined;
  };
  whitelist: string[];
}

interface StorageSessionState {
  /**
   * Base64-encoded raw 32-byte AES-256-GCM vault key derived via PBKDF2.
   * Stored instead of the plaintext password so that a session compromise
   * does not expose the user's password (CWE-256 / OWASP A02:2021).
   * Cleared on lock and on browser restart (browser.storage.session lifetime).
   */
  vaultKeyBytes?: string | null | undefined;
}

export class ExtensionStorage {
  #localState: StorageLocalState;
  #sessionState: StorageSessionState;
  #state: Partial<StorageLocalState>;

  constructor(localState: unknown, sessionState: StorageSessionState) {
    this.#localState = localState as StorageLocalState;
    this.#sessionState = sessionState;

    this.#state = {
      backup: this.#localState.backup,
      migrationVersion: CURRENT_MIGRATION_VERSION,
    };
  }

  getInitState<K extends keyof StorageLocalState>(
    defaults: Pick<StorageLocalState, K> | StorageLocalState,
  ): Pick<StorageLocalState, K>;
  getInitState<T extends Record<string, unknown>>(defaults: T, forced?: T): T;
  getInitState(defaults: Record<string, unknown>) {
    const defaultsInitState = Object.keys(defaults).reduce(
      (acc, key) => {
        if (Object.hasOwn(this.#localState, key)) {
          acc[key] = this.#localState[key as keyof StorageLocalState];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const initState = { ...defaults, ...defaultsInitState };
    this.#state = { ...this.#state, ...initState };
    return initState;
  }

  getInitSession() {
    return this.#sessionState;
  }

  async clear() {
    const keysToRemove = (Object.keys(this.#localState) as Array<keyof StorageLocalState>).reduce<
      string[]
    >((acc, key) => {
      if (!this.#state[key]) {
        acc.push(key);
      }
      return acc;
    }, []);

    this.removeState(keysToRemove);
    await Browser.storage.local.remove(keysToRemove);
  }

  subscribe<T extends Record<string, unknown>>(store: ObservableStore<T>) {
    pipe(
      make<T>((observer) => {
        store.subscribe(observer.next);

        return () => {
          store.unsubscribe(observer.next);
        };
      }),
      subscribe((updatedState) => {
        void (async () => {
          const currentState = await Browser.storage.local.get(Object.keys(updatedState));

          const changedState = Object.fromEntries(
            Object.entries(updatedState)
              .map(([key, value]) => [key, value === undefined ? null : value] as const)
              .filter(([key, value]) => !deepEqual(currentState[key], value)),
          );

          const changedKeys = Object.keys(changedState);

          if (changedKeys.length === 0) {
            return;
          }

          this.#state = { ...this.#state, ...changedState };
          await Browser.storage.local.set(changedState);
        })();
      }),
    );
  }

  getState<K extends keyof StorageLocalState>(keys?: K | K[]): Pick<StorageLocalState, K> {
    if (!keys) {
      return this.#state as Pick<StorageLocalState, K>;
    }

    if (typeof keys === 'string') {
      return { [keys]: this.#state[keys] } as Pick<StorageLocalState, K>;
    }

    return keys.reduce(
      (acc, key) => {
        if (this.#state[key]) {
          acc[key] = this.#state[key];
        }
        return acc;
      },
      {} as Pick<StorageLocalState, K>,
    );
  }

  async setSession(state: StorageSessionState) {
    return Browser.storage.session?.set(state as Record<string, unknown>);
  }

  removeState(keys: string | string[]) {
    const state = this.#state;

    if (state) {
      if (typeof keys === 'string') {
        if (keys in state) {
          delete state[keys as keyof typeof state];
        }
      } else {
        keys.forEach((key) => {
          if (key in state) {
            delete state[key as keyof typeof state];
          }
        });
      }
    }
  }
}

export async function createExtensionStorage() {
  try {
    const { migrationVersion } = await Browser.storage.local.get('migrationVersion');

    const version = (migrationVersion as number) || 0;

    if (version < CURRENT_MIGRATION_VERSION) {
      for (let i = version; i < CURRENT_MIGRATION_VERSION; i++) {
        const migration = MIGRATIONS[i];
        invariant(
          migration != null,
          `storage: MIGRATIONS[${i}] missing — migration list out of sync`,
        );
        await migration.migrate();
      }
    } else if (version > CURRENT_MIGRATION_VERSION) {
      for (let i = version; i > CURRENT_MIGRATION_VERSION; i--) {
        const rollback = MIGRATIONS[i - 1];
        invariant(
          rollback != null,
          `storage: MIGRATIONS[${i - 1}] missing — rollback list out of sync`,
        );
        await rollback.rollback();
      }
    }

    await Browser.storage.local.set({
      migrationVersion: CURRENT_MIGRATION_VERSION,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('FILE_ERROR_NO_SPACE')) {
      captureException(err);
    }
  }

  const [localState, sessionState] = await Promise.all([
    Browser.storage.local.get(),
    Browser.storage.session?.get() ?? {},
  ]);

  return new ExtensionStorage(localState, sessionState);
}
