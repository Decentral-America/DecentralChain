import { deepEqual } from 'fast-equals';
import type { StorageLocalState } from '#storage/storage';

import type { NetworkName } from '../networks/types';
import { accountsStore } from './store/accountsStore';
import { syncLocale } from './store/actions';

function getParam<S, D>(param: S, defaultParam: D) {
  if (param) {
    return param;
  }

  return param === null ? defaultParam : undefined;
}

export function createUpdateState() {
  return (stateChanges: Partial<StorageLocalState>) => {
    const currentState = accountsStore.getState();

    const idleOptions = getParam(stateChanges.idleOptions, {});
    if (idleOptions && !deepEqual(currentState.idleOptions, idleOptions)) {
      accountsStore.setState({ idleOptions });
    }

    const customNodes = getParam(stateChanges.customNodes, {});
    if (customNodes && !deepEqual(currentState.customNodes, customNodes)) {
      accountsStore.setState({ customNodes });
    }

    const customCodes = getParam(stateChanges.customCodes, {});
    if (customCodes && !deepEqual(currentState.customCodes, customCodes)) {
      accountsStore.setState({ customCodes });
    }

    const customMatchers = getParam(stateChanges.customMatchers, {});
    if (customMatchers && !deepEqual(currentState.customMatcher, customMatchers)) {
      accountsStore.setState({ customMatcher: customMatchers });
    }

    if (stateChanges.currentLocale && stateChanges.currentLocale !== currentState.currentLocale) {
      accountsStore.setState({ currentLocale: stateChanges.currentLocale });
      syncLocale(stateChanges.currentLocale);
    }

    const uiState = getParam(stateChanges.uiState, {});
    if (uiState && !deepEqual(uiState, currentState.uiState)) {
      accountsStore.setState({ uiState });
    }

    const currentNetwork = getParam(stateChanges.currentNetwork, '');
    if (currentNetwork && currentNetwork !== currentState.currentNetwork) {
      accountsStore.setState({ currentNetwork: currentNetwork as NetworkName });
    }

    const newSelectedAccount = getParam(stateChanges.selectedAccount, undefined);
    if (newSelectedAccount && !deepEqual(newSelectedAccount, currentState.selectedAccount)) {
      accountsStore.setState({ selectedAccount: newSelectedAccount });
    }

    const accounts = getParam(stateChanges.accounts, []);
    if (accounts && !deepEqual(accounts, currentState.allNetworksAccounts)) {
      accountsStore.setState({ allNetworksAccounts: accounts });
    }

    if (
      (stateChanges.accounts != null &&
        !deepEqual(stateChanges.accounts, currentState.allNetworksAccounts)) ||
      (stateChanges.currentNetwork != null &&
        stateChanges.currentNetwork !== currentState.currentNetwork)
    ) {
      const accs = stateChanges.accounts ?? currentState.allNetworksAccounts;
      const network = (stateChanges.currentNetwork ?? currentState.currentNetwork) as NetworkName;
      accountsStore.setState({
        accounts: accs.filter((account) => account.network === network),
      });
    }

    if (
      !currentState.state ||
      ('initialized' in stateChanges &&
        stateChanges.initialized !== currentState.state.initialized) ||
      ('locked' in stateChanges && stateChanges.locked !== currentState.state.locked)
    ) {
      accountsStore.setState({
        state: {
          initialized: stateChanges.initialized ?? currentState.state?.initialized,
          locked: stateChanges.locked ?? currentState.state?.locked,
        },
      });
    }

    const addresses = getParam(stateChanges.addresses, {});
    if (addresses && !deepEqual(currentState.addresses, addresses)) {
      accountsStore.setState({ addresses });
    }
  };
}
