import { createSlice } from '@reduxjs/toolkit';

import { ACTION } from '../actions/constants';
import { typedPayload } from '../types';
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
        state.newAccount.name = typedPayload(action) ?? state.newAccount.name;
      })
      .addCase(ACTION.NEW_ACCOUNT_SELECT, (state, action) => {
        state.newAccount = { ...state.newAccount, ...typedPayload(action) };
      })
      .addCase(ACTION.SET_LOADING, (state, action) => {
        state.loading = typedPayload(action);
      })
      .addCase(ACTION.NOTIFICATION_SELECT, (state, action) => {
        state.notifications.selected = typedPayload(action);
      })
      .addCase(ACTION.NOTIFICATION_DELETE, (state, action) => {
        state.notifications.deleted = typedPayload(action);
      })
      .addCase(ACTION.NOTIFICATION_NAME_CHANGED, (state, action) => {
        state.notifications.changeName = typedPayload(action);
      });
  },
  initialState,
  name: 'localState',
  reducers: {},
});

export const localState = localStateSlice.reducer;
