import { useStore } from 'zustand';

import type { AccountsState } from './accountsStore';
import { accountsStore } from './accountsStore';

export type { AccountsState };

export const useAccountsSelector = <T>(selector: (state: AccountsState) => T): T =>
  useStore(accountsStore, selector);
