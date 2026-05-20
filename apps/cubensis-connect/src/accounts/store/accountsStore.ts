import { createStore } from 'zustand/vanilla';

import { NetworkName } from '#networks/types';
import type { IdleOptions, PreferencesAccount } from '#preferences/types';
import type { NewAccountState, UiState } from '#store/reducers/stateTypes';

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

export interface AppState {
  initialized: boolean | null | undefined;
  locked: boolean | null | undefined;
}

// ─── Accounts window state ──────────────────────────────────────────────────

export interface AccountsState {
  accounts: PreferencesAccount[];
  addresses: Record<string, string>;
  allNetworksAccounts: PreferencesAccount[];
  currentLocale: string;
  currentNetwork: NetworkName;
  customCodes: Partial<Record<NetworkName, string | null>>;
  customMatcher: Partial<Record<NetworkName, string | null>>;
  customNodes: Partial<Record<NetworkName, string | null>>;
  idleOptions: Partial<IdleOptions>;
  localState: LocalState;
  selectedAccount: PreferencesAccount | undefined;
  state: AppState | null;
  uiState: UiState;
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

export const accountsStore = createStore<AccountsState>(() => ({
  accounts: [],
  addresses: {},
  allNetworksAccounts: [],
  currentLocale: 'en',
  currentNetwork: NetworkName.Mainnet,
  customCodes: {},
  customMatcher: {},
  customNodes: {},
  idleOptions: {},
  localState: initialLocalState,
  selectedAccount: undefined,
  state: null,
  uiState: {} as UiState,
}));
