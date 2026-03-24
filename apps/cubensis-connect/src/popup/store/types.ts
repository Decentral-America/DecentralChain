import { type Dispatch, type MiddlewareAPI, type Store } from 'redux';
import { type ThunkAction, type ThunkDispatch } from 'redux-thunk';

import { type AppAction } from '../../store/types';
import { type reducer } from './reducer';

export type PopupState = ReturnType<typeof reducer>;

export type PopupStore = Store<PopupState, AppAction> & {
  dispatch: ThunkDispatch<PopupState, undefined, AppAction>;
};

export type PopupThunkAction<ReturnType> = ThunkAction<
  ReturnType,
  PopupState,
  undefined,
  AppAction
>;

export type AppMiddleware = (
  api: MiddlewareAPI<Dispatch, PopupState>,
) => (next: Dispatch<AppAction>) => (action: AppAction) => void;
