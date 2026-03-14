import { deepEqual } from 'fast-equals';
import { type StorageLocalState } from 'storage/storage';
import { ACTION } from 'store/actions/constants';
import { type AppAction } from 'store/types';

import { type AccountsStore } from './store/types';

function getParam<S, D>(param: S, defaultParam: D) {
  if (param) {
    return param;
  }

  return param === null ? defaultParam : undefined;
}

export function createUpdateState(store: AccountsStore) {
  return (stateChanges: Partial<StorageLocalState>) => {
    const actions: AppAction[] = [];
    const currentState = store.getState();

    const idleOptions = getParam(stateChanges.idleOptions, {});
    if (idleOptions && !deepEqual(currentState.idleOptions, idleOptions)) {
      actions.push({
        payload: idleOptions,
        type: ACTION.REMOTE_CONFIG.UPDATE_IDLE,
      });
    }

    const customNodes = getParam(stateChanges.customNodes, {});
    if (customNodes && !deepEqual(currentState.customNodes, customNodes)) {
      actions.push({
        payload: customNodes,
        type: ACTION.UPDATE_NODES,
      });
    }

    const customCodes = getParam(stateChanges.customCodes, {});
    if (customCodes && !deepEqual(currentState.customCodes, customCodes)) {
      actions.push({
        payload: customCodes,
        type: ACTION.UPDATE_CODES,
      });
    }

    if (stateChanges.currentLocale && stateChanges.currentLocale !== currentState.currentLocale) {
      actions.push({
        payload: stateChanges.currentLocale,
        type: ACTION.UPDATE_FROM_LNG,
      });
    }

    const uiState = getParam(stateChanges.uiState, {});
    if (uiState && !deepEqual(uiState, currentState.uiState)) {
      actions.push({
        payload: uiState,
        type: ACTION.UPDATE_UI_STATE,
      });
    }

    const currentNetwork = getParam(stateChanges.currentNetwork, '');
    if (currentNetwork && currentNetwork !== currentState.currentNetwork) {
      actions.push({
        payload: currentNetwork,
        type: ACTION.UPDATE_CURRENT_NETWORK,
      });
    }

    const selectedAccount = getParam(stateChanges.selectedAccount, {} as unknown as undefined);
    if (selectedAccount && !deepEqual(selectedAccount, currentState.selectedAccount)) {
      actions.push({
        payload: selectedAccount,
        type: ACTION.UPDATE_SELECTED_ACCOUNT,
      });
    }

    const accounts = getParam(stateChanges.accounts, []);
    if (accounts && !deepEqual(accounts, currentState.allNetworksAccounts)) {
      actions.push({
        payload: accounts,
        type: ACTION.UPDATE_ALL_NETWORKS_ACCOUNTS,
      });
    }

    if (
      (stateChanges.accounts != null &&
        !deepEqual(stateChanges.accounts, currentState.allNetworksAccounts)) ||
      (stateChanges.currentNetwork != null &&
        stateChanges.currentNetwork !== currentState.currentNetwork)
    ) {
      const accounts = stateChanges.accounts || currentState.allNetworksAccounts;
      const network = stateChanges.currentNetwork || currentState.currentNetwork;

      actions.push({
        payload: accounts.filter((account) => account.network === network),
        type: ACTION.UPDATE_CURRENT_NETWORK_ACCOUNTS,
      });
    }

    if (
      !currentState.state ||
      ('initialized' in stateChanges &&
        stateChanges.initialized !== currentState.state.initialized) ||
      ('locked' in stateChanges && stateChanges.locked !== currentState.state.locked)
    ) {
      actions.push({
        payload: {
          initialized: stateChanges.initialized ?? currentState.state?.initialized,
          locked: stateChanges.locked ?? currentState.state?.locked,
        },
        type: ACTION.UPDATE_APP_STATE,
      });
    }

    const addresses = getParam(stateChanges.addresses, {});
    if (addresses && !deepEqual(addresses, currentState.addresses)) {
      store.dispatch({
        payload: addresses,
        type: ACTION.UPDATE_ADDRESSES,
      });
    }

    for (const action of actions) {
      store.dispatch(action);
    }
  };
}
