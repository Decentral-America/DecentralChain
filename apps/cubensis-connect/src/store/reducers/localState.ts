import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type NewAccountState } from './stateTypes';

export type { NewAccountState };

interface NotificationsState {
  accountCreationSuccess?: boolean | undefined;
  accountImportSuccess?: boolean | undefined;
  changeName?: boolean | undefined;
  deleted?: boolean | undefined;
  selected?: boolean | undefined;
}

const initialState = {
  loading: true,
  newAccount: {
    address: '',
    name: '',
    seed: '',
    type: 'seed' as const,
  } as NewAccountState,
  notifications: {} as NotificationsState,
};

const localStateSlice = createSlice({
  initialState,
  name: 'localState',
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNewAccountName: (state, action: PayloadAction<string | null | undefined>) => {
      state.newAccount.name = action.payload ?? state.newAccount.name;
    },
    setNewAccountSelect: (state, action: PayloadAction<Partial<NewAccountState>>) => {
      state.newAccount = { ...state.newAccount, ...action.payload } as NewAccountState;
    },
    setNotificationDeleted: (state, action: PayloadAction<boolean>) => {
      state.notifications.deleted = action.payload;
    },
    setNotificationNameChanged: (state, action: PayloadAction<boolean>) => {
      state.notifications.changeName = action.payload;
    },
    setNotificationSelected: (state, action: PayloadAction<boolean>) => {
      state.notifications.selected = action.payload;
    },
  },
});

export const localState = localStateSlice.reducer;
export const {
  setNewAccountName,
  setNewAccountSelect,
  setLoading,
  setNotificationSelected,
  setNotificationDeleted,
  setNotificationNameChanged,
} = localStateSlice.actions;
