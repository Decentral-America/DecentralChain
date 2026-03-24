import {
  type Dispatch,
  type MiddlewareAPI,
  type ThunkAction,
  type ThunkDispatch,
  type UnknownAction,
} from '@reduxjs/toolkit';

import { type reducer } from './reducer';

export type PopupState = ReturnType<typeof reducer>;

export type PopupDispatch = ThunkDispatch<PopupState, undefined, UnknownAction>;

export type PopupStore = {
  dispatch: PopupDispatch;
  getState: () => PopupState;
};

export type PopupThunkAction<ReturnType> = ThunkAction<
  ReturnType,
  PopupState,
  undefined,
  UnknownAction
>;

export type AppMiddleware = (
  api: MiddlewareAPI<Dispatch<UnknownAction>, PopupState>,
) => (next: Dispatch<UnknownAction>) => (action: UnknownAction) => unknown;
