import { type ThunkAction, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type reducer } from './reducer';

export type AccountsState = ReturnType<typeof reducer>;

export type AccountsDispatch = ThunkDispatch<AccountsState, undefined, UnknownAction>;

export type AccountsStore = {
  dispatch: AccountsDispatch;
  getState: () => AccountsState;
};

export type AccountsThunkAction<ReturnType> = ThunkAction<
  ReturnType,
  AccountsState,
  undefined,
  UnknownAction
>;
