import {
  type Dispatch,
  type MiddlewareAPI,
  type ThunkAction,
  type ThunkDispatch,
} from '@reduxjs/toolkit';

import { type AppAction } from '../../store/types';
import { type reducer } from './reducer';

export type PopupState = ReturnType<typeof reducer>;

export type PopupDispatch = ThunkDispatch<PopupState, undefined, AppAction>;

export type PopupStore = {
  dispatch: PopupDispatch;
  getState: () => PopupState;
};

export type PopupThunkAction<ReturnType> = ThunkAction<
  ReturnType,
  PopupState,
  undefined,
  AppAction
>;

// Explicitly typed middleware signature keeps action typed as AppAction (not unknown)
export type AppMiddleware = (
  api: MiddlewareAPI<Dispatch<AppAction>, PopupState>,
) => (next: Dispatch<AppAction>) => (action: AppAction) => unknown;
