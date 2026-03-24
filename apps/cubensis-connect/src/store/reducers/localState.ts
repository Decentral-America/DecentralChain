import { combineReducers } from 'redux';

import { ACTION } from '../actions/constants';
import { type AppAction } from '../types';
import { type NewAccountState } from './stateTypes';

export type { NewAccountState };

function newAccount(
  state: NewAccountState = {
    address: '',
    name: '',
    seed: '',
    type: 'seed',
  },
  action: AppAction,
): NewAccountState {
  switch (action.type) {
    case ACTION.NEW_ACCOUNT_NAME: {
      const name = action.payload != null ? action.payload : state.name;
      return { ...state, name };
    }
    case ACTION.NEW_ACCOUNT_SELECT:
      return { ...state, ...action.payload };
  }

  return state;
}

function loading(state = true, { type, payload }: AppAction) {
  return type === ACTION.SET_LOADING ? payload : state;
}

interface NotificationsState {
  accountCreationSuccess?: boolean | undefined;
  accountImportSuccess?: boolean | undefined;
  changeName?: boolean | undefined;
  deleted?: boolean | undefined;
  selected?: boolean | undefined;
}

function notifications(
  state: NotificationsState = {},
  { type, payload }: AppAction,
): NotificationsState {
  switch (type) {
    case ACTION.NOTIFICATION_SELECT:
      return { ...state, selected: payload };
    case ACTION.NOTIFICATION_DELETE:
      return { ...state, deleted: payload };
    case ACTION.NOTIFICATION_NAME_CHANGED:
      return { ...state, changeName: payload };
    default:
      return state;
  }
}

export const localState = combineReducers({
  loading,
  newAccount,
  notifications,
});
