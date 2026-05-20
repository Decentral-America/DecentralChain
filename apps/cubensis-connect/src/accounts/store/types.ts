import type { StoreApi } from 'zustand/vanilla';

import type { AccountsState } from './accountsStore';

export type { AccountsState } from './accountsStore';

export type AccountsStore = StoreApi<AccountsState>;
