import { createStore } from 'zustand/vanilla';

import type { AssetsRecord } from '#assets/types';
import type { BalancesItem } from '#balances/types';
import type { Message } from '#messages/types';
import { NetworkName } from '#networks/types';
import type { NftInfo } from '#nfts/nfts';
import type { NotificationsStoreItem } from '#notifications/types';
import type { PermissionValue } from '#permissions/types';
import type { IdleOptions, PreferencesAccount } from '#preferences/types';
import type { StorageLocalState } from '#storage/storage';
import type { NewAccountState, UiState } from '#store/reducers/stateTypes';
import type { NftConfig } from '../../constants';
import { DEFAULT_MAIN_CONFIG } from '../../constants';

// ─── Local sub-state types ──────────────────────────────────────────────────

export interface NotificationsLocalState {
  accountCreationSuccess?: boolean | undefined;
  accountImportSuccess?: boolean | undefined;
  changeName?: boolean | undefined;
  deleted?: boolean | undefined;
  selected?: boolean | undefined;
}

export interface LocalState {
  loading: boolean;
  newAccount: NewAccountState;
  notifications: NotificationsLocalState;
}

export interface ActivePopupState {
  msg?: Message | undefined;
  notify?: NotificationsStoreItem[] | undefined;
}

export interface AppState {
  initialized: boolean | null | undefined;
  locked: boolean | null | undefined;
}

export interface PermissionsUiState {
  pending: boolean;
  allowed: boolean;
  disallowed: boolean;
  deleted: boolean;
}

// ─── Full popup state ───────────────────────────────────────────────────────

export interface PopupState {
  accounts: PreferencesAccount[];
  activePopup: ActivePopupState | null;
  addresses: Record<string, string>;
  allNetworksAccounts: PreferencesAccount[];
  assetLogos: Record<string, string>;
  assets: AssetsRecord;
  assetTickers: Record<string, string>;
  balances: Partial<Record<string, BalancesItem>>;
  config: Partial<StorageLocalState['config']>;
  currentLocale: string;
  currentNetwork: NetworkName;
  customCodes: Partial<Record<NetworkName, string | null>>;
  customMatcher: Partial<Record<NetworkName, string | null>>;
  customNodes: Partial<Record<NetworkName, string | null>>;
  idleOptions: Partial<IdleOptions>;
  localState: LocalState;
  messages: Message[];
  nftConfig: NftConfig;
  nfts: Record<string, NftInfo> | null;
  notifications: NotificationsStoreItem[][];
  origins: Partial<Record<string, PermissionValue[]>>;
  permissionsUiState: PermissionsUiState;
  selectedAccount: PreferencesAccount | undefined;
  /** Vault lock / init state — mirrors VaultController fields */
  state: AppState | null;
  uiState: UiState;
  usdPrices: Partial<Record<string, string>>;
}

const initialLocalState: LocalState = {
  loading: true,
  newAccount: {
    address: '',
    name: '',
    seed: '',
    type: 'seed',
  } as NewAccountState,
  notifications: {},
};

export const popupStore = createStore<PopupState>(() => ({
  accounts: [],
  activePopup: null,
  addresses: {},
  allNetworksAccounts: [],
  assetLogos: {},
  assets: {} as AssetsRecord,
  assetTickers: {},
  balances: {},
  config: {},
  currentLocale: 'en',
  currentNetwork: NetworkName.Mainnet,
  customCodes: {},
  customMatcher: {},
  customNodes: {},
  idleOptions: {},
  localState: initialLocalState,
  messages: [],
  nftConfig: DEFAULT_MAIN_CONFIG.nfts as NftConfig,
  nfts: null,
  notifications: [],
  origins: {},
  permissionsUiState: { allowed: false, deleted: false, disallowed: false, pending: false },
  selectedAccount: undefined,
  state: null,
  uiState: {} as UiState,
  usdPrices: {},
}));
