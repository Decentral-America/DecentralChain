import { deepEqual } from 'fast-equals';
import { type StorageLocalState } from 'storage/storage';

import {
  updateAddresses,
  updateAllNetworksAccounts,
  updateAppState,
  updateCodes,
  updateCurrentNetwork,
  updateCurrentNetworkAccounts,
  updateIdleOptions,
  updateLocale,
  updateNodes,
  updateSelectedAccount,
  updateUiState,
} from '../store/reducers/updateState';
import { type AccountsStore } from './store/types';

function getParam<S, D>(param: S, defaultParam: D) {
  if (param) {
    return param;
  }

  return param === null ? defaultParam : undefined;
}

export function createUpdateState(store: AccountsStore) {
  return (stateChanges: Partial<StorageLocalState>) => {
    const currentState = store.getState();

    const idleOptions = getParam(stateChanges.idleOptions, {});
    if (idleOptions && !deepEqual(currentState.idleOptions, idleOptions)) {
      store.dispatch(updateIdleOptions(idleOptions));
    }

    const customNodes = getParam(stateChanges.customNodes, {});
    if (customNodes && !deepEqual(currentState.customNodes, customNodes)) {
      store.dispatch(updateNodes(customNodes));
    }

    const customCodes = getParam(stateChanges.customCodes, {});
    if (customCodes && !deepEqual(currentState.customCodes, customCodes)) {
      store.dispatch(updateCodes(customCodes));
    }

    if (stateChanges.currentLocale && stateChanges.currentLocale !== currentState.currentLocale) {
      store.dispatch(updateLocale(stateChanges.currentLocale));
    }

    const uiState = getParam(stateChanges.uiState, {});
    if (uiState && !deepEqual(uiState, currentState.uiState)) {
      store.dispatch(updateUiState(uiState));
    }

    const currentNetwork = getParam(stateChanges.currentNetwork, '');
    if (currentNetwork && currentNetwork !== currentState.currentNetwork) {
      store.dispatch(updateCurrentNetwork(currentNetwork));
    }

    const newSelectedAccount = getParam(stateChanges.selectedAccount, {} as unknown as undefined);
    if (newSelectedAccount && !deepEqual(newSelectedAccount, currentState.selectedAccount)) {
      store.dispatch(updateSelectedAccount(newSelectedAccount));
    }

    const accounts = getParam(stateChanges.accounts, []);
    if (accounts && !deepEqual(accounts, currentState.allNetworksAccounts)) {
      store.dispatch(updateAllNetworksAccounts(accounts));
    }

    if (
      (stateChanges.accounts != null &&
        !deepEqual(stateChanges.accounts, currentState.allNetworksAccounts)) ||
      (stateChanges.currentNetwork != null &&
        stateChanges.currentNetwork !== currentState.currentNetwork)
    ) {
      const accs = stateChanges.accounts || currentState.allNetworksAccounts;
      const network = stateChanges.currentNetwork || currentState.currentNetwork;

      store.dispatch(
        updateCurrentNetworkAccounts(accs.filter((account) => account.network === network)),
      );
    }

    if (
      !currentState.state ||
      ('initialized' in stateChanges &&
        stateChanges.initialized !== currentState.state.initialized) ||
      ('locked' in stateChanges && stateChanges.locked !== currentState.state.locked)
    ) {
      store.dispatch(
        updateAppState({
          initialized: stateChanges.initialized ?? currentState.state?.initialized,
          locked: stateChanges.locked ?? currentState.state?.locked,
        }),
      );
    }

    const addresses = getParam(stateChanges.addresses, {});
    if (addresses && !deepEqual(currentState.addresses, addresses)) {
      store.dispatch(updateAddresses(addresses));
    }
  };
}
