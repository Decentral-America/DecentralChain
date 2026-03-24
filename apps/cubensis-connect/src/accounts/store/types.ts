import { type ThunkAction, type ThunkDispatch } from '@reduxjs/toolkit';
import { type AppAction } from 'store/types';

import { type reducer } from './reducer';

export type AccountsState = ReturnType<typeof reducer>;

export type AccountsDispatch = ThunkDispatch<AccountsState, undefined, AppAction>;

export type AccountsStore = {
  dispatch: AccountsDispatch;
  getState: () => AccountsState;
};

export type AccountsThunkAction<ReturnType> = ThunkAction<
  ReturnType,
  AccountsState,
  undefined,
  AppAction
>;
