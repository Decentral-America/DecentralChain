import { type Store } from 'redux';
import { type ThunkAction, type ThunkDispatch } from 'redux-thunk';
import { type AppAction } from 'store/types';

import { type reducer } from './reducer';

export type AccountsState = ReturnType<typeof reducer>;

export type AccountsStore = Store<AccountsState, AppAction> & {
  dispatch: ThunkDispatch<AccountsState, undefined, AppAction>;
};

export type AccountsThunkAction<ReturnType> = ThunkAction<
  ReturnType,
  AccountsState,
  undefined,
  AppAction
>;
