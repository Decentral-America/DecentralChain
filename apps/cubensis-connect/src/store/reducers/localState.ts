import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { ACTION } from '../actions/constants';
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
  extraReducers: (builder) => {
    builder
      .addCase(ACTION.NEW_ACCOUNT_NAME, (state, action) => {
        state.newAccount.name =
          (action as unknown as PayloadAction<string | null | undefined>).payload ??
          state.newAccount.name;
      })
      .addCase(ACTION.NEW_ACCOUNT_SELECT, (state, action) => {
        state.newAccount = {
          ...state.newAccount,
          ...(action as unknown as PayloadAction<NewAccountState>).payload,
        };
      })
      .addCase(ACTION.SET_LOADING, (state, action) => {
        state.loading = (action as unknown as PayloadAction<boolean>).payload;
      })
      .addCase(ACTION.NOTIFICATION_SELECT, (state, action) => {
        state.notifications.selected = (action as unknown as PayloadAction<boolean>).payload;
      })
      .addCase(ACTION.NOTIFICATION_DELETE, (state, action) => {
        state.notifications.deleted = (action as unknown as PayloadAction<boolean>).payload;
      })
      .addCase(ACTION.NOTIFICATION_NAME_CHANGED, (state, action) => {
        state.notifications.changeName = (action as unknown as PayloadAction<boolean>).payload;
      });
  },
  initialState,
  name: 'localState',
  reducers: {},
});

export const localState = localStateSlice.reducer;
