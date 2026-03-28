import i18next from 'i18next';

import type { AppMiddleware } from '../../popup/store/types';
import Background from '../../ui/services/Background';
import { removeAddress, setAddress, setAddresses } from '../actions/addresses';
import { getBalances } from '../actions/balances';
import {
  setCustomCode,
  setCustomMatcher,
  setCustomNode,
  setIdle,
  setLocale,
} from '../actions/network';
import { setShowNotification } from '../actions/notifications';
import { setUiState } from '../actions/uiState';
import { setNotificationSelected as notificationSelect } from '../reducers/localState';
import { selectAccount, updateLocale, updateUiState } from '../reducers/updateState';

export const changeLang: AppMiddleware = (store) => (next) => (action) => {
  if (setLocale.match(action) && action.payload !== store.getState().currentLocale) {
    Background.setCurrentLocale(action.payload);
  }
  return next(action);
};

export const setNotificationPerms: AppMiddleware = () => (next) => (action) => {
  if (!setShowNotification.match(action)) {
    return next(action);
  }

  Background.setNotificationPermissions(action.payload);
};

export const setIdleMW: AppMiddleware = () => (next) => (action) => {
  if (!setIdle.match(action)) {
    return next(action);
  }

  Background.setIdleOptions({ type: action.payload });
};

export const updateLang: AppMiddleware = (store) => (next) => (action) => {
  if (updateLocale.match(action) && action.payload !== store.getState().currentLocale) {
    i18next.changeLanguage(action.payload);
  }
  return next(action);
};

export const updateCurrentAccountBalance: AppMiddleware = () => (next) => (action) => {
  if (getBalances.match(action)) {
    Background.updateCurrentAccountBalance();
  }

  return next(action);
};

export const selectAccountMW: AppMiddleware = (store) => (next) => (action) => {
  if (
    selectAccount.match(action) &&
    store.getState().selectedAccount?.address !== action.payload.address
  ) {
    const { currentNetwork } = store.getState();
    Background.selectAccount(action.payload.address, currentNetwork).then(() => {
      store.dispatch(notificationSelect(true));
      setTimeout(() => store.dispatch(notificationSelect(false)), 1000);
    });
  }

  return next(action);
};

export const uiStateMW: AppMiddleware = (store) => (next) => (action) => {
  if (setUiState.match(action)) {
    const ui = store.getState().uiState;
    const newState = { ...ui, ...action.payload };
    store.dispatch(updateUiState(newState));
    Background.setUiState(newState);
    return null;
  }

  return next(action);
};

export const getAsset: AppMiddleware = () => (next) => (action) => {
  // Handled by caller dispatching Background.assetInfo directly; this is a pass-through guard
  return next(action);
};

export const setAddressMW: AppMiddleware = () => (next) => (action) => {
  if (setAddress.match(action)) {
    const { address, name } = action.payload;
    Background.setAddress(address, name);
  }

  return next(action);
};

export const setAddressesMW: AppMiddleware = () => (next) => (action) => {
  if (setAddresses.match(action)) {
    Background.setAddresses(action.payload);
  }

  return next(action);
};

export const removeAddressMW: AppMiddleware = () => (next) => (action) => {
  if (removeAddress.match(action)) {
    const { address } = action.payload;
    Background.removeAddress(address);
  }

  return next(action);
};

export const setCustomNodeMW: AppMiddleware = () => (next) => (action) => {
  if (setCustomNode.match(action)) {
    const { node, network } = action.payload;
    Background.setCustomNode(node, network);
    return null;
  }

  return next(action);
};

export const setCustomCodeMW: AppMiddleware = () => (next) => (action) => {
  if (setCustomCode.match(action)) {
    const { code, network } = action.payload;
    Background.setCustomCode(code, network);
    return null;
  }

  return next(action);
};

export const setCustomMatcherMW: AppMiddleware = () => (next) => (action) => {
  if (setCustomMatcher.match(action)) {
    const { matcher, network } = action.payload;
    Background.setCustomMatcher(matcher, network);
    return null;
  }

  return next(action);
};
