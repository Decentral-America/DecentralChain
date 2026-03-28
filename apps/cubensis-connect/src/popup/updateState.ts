import { deepEqual } from 'fast-equals';
import type { NotificationsStoreItem } from '#notifications/types';
import type { StorageLocalState } from '#storage/storage';

import type { AssetsRecord } from '../assets/types';
import { collectBalances } from '../balances/utils';
import type { Message } from '../messages/types';
import { MessageStatus } from '../messages/types';
import type { NetworkName } from '../networks/types';
import {
  setActiveAuto,
  setAssetLogos,
  setAssets,
  setAssetTickers,
  setNotifications,
  setRemoteConfig,
  setUsdPrices,
  updateAddresses,
  updateAllNetworksAccounts,
  updateAppState,
  updateBalances,
  updateCodes,
  updateCurrentNetwork,
  updateCurrentNetworkAccounts,
  updateIdleOptions,
  updateLocale,
  updateMatcher,
  updateMessages,
  updateNftConfig,
  updateNfts,
  updateNodes,
  updateOrigins,
  updateSelectedAccount,
  updateSwappableAssets,
  updateUiState,
} from '../store/reducers/updateState';
import type { PopupStore } from './store/types';

function getParam<S, D>(param: S, defaultParam: D) {
  if (param) {
    return param;
  }

  return param === null ? defaultParam : undefined;
}

type StateChanges = Partial<StorageLocalState>;

export function createUpdateState(store: PopupStore) {
  return (stateChanges: StateChanges) => {
    const currentState = store.getState();

    const config = getParam(stateChanges.config, {});
    if (config && !deepEqual(currentState.config, config)) {
      store.dispatch(setRemoteConfig(config));
    }

    if (stateChanges.nftConfig && !deepEqual(currentState.nftConfig, stateChanges.nftConfig)) {
      store.dispatch(updateNftConfig(stateChanges.nftConfig));
    }

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

    const customMatchers = getParam(stateChanges.customMatchers, {});
    if (customMatchers && !deepEqual(currentState.customMatcher, customMatchers)) {
      store.dispatch(updateMatcher(customMatchers));
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

    const origins = getParam(stateChanges.origins, {});
    if (origins && !deepEqual(origins, currentState.origins)) {
      store.dispatch(updateOrigins(origins));
    }

    const messages = getParam(stateChanges.messages, []);

    const unapprovedMessages = messages?.filter((msg: Message) => {
      const account = stateChanges.selectedAccount || currentState.selectedAccount;

      return (
        account != null &&
        msg.status === MessageStatus.UnApproved &&
        msg.account.address === account.address &&
        msg.account.network === account.network
      );
    });

    const setActiveAutoPayload = {
      allMessages: messages,
      messages: currentState.messages,
      notifications: currentState.notifications,
    };

    if (unapprovedMessages && !deepEqual(unapprovedMessages, currentState.messages)) {
      store.dispatch(updateMessages(unapprovedMessages));

      setActiveAutoPayload.messages = unapprovedMessages;
    }

    const currentOrNewSelectedAccount =
      stateChanges.selectedAccount ?? currentState.selectedAccount;

    const myNotifications =
      currentOrNewSelectedAccount &&
      stateChanges.notifications
        ?.filter((notification) => notification.address === currentOrNewSelectedAccount.address)
        .reverse()
        .reduce<{
          items: NotificationsStoreItem[][];
          hash: Record<string, NotificationsStoreItem[]>;
        }>(
          (acc, item) => {
            let group = acc.hash[item.origin];
            if (!group) {
              group = [];
              acc.hash[item.origin] = group;
              acc.items.push(group);
            }
            group.push(item);
            return acc;
          },
          { hash: {}, items: [] },
        ).items;

    if (myNotifications && !deepEqual(currentState.notifications, myNotifications)) {
      store.dispatch(setNotifications(myNotifications));

      setActiveAutoPayload.notifications = myNotifications;
    }

    if (
      messages &&
      (setActiveAutoPayload.messages !== currentState.messages ||
        setActiveAutoPayload.notifications !== currentState.notifications)
    ) {
      store.dispatch(setActiveAuto(setActiveAutoPayload));
    }

    const newSelectedAccount = getParam(stateChanges.selectedAccount, undefined);
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
      const accounts = stateChanges.accounts || currentState.allNetworksAccounts;
      const network = stateChanges.currentNetwork || currentState.currentNetwork;

      store.dispatch(
        updateCurrentNetworkAccounts(accounts.filter((account) => account.network === network)),
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

    const balanceUpdate = collectBalances(stateChanges);
    if (Object.keys(balanceUpdate).length !== 0) {
      store.dispatch(
        updateBalances({
          ...currentState.balances,
          ...balanceUpdate,
        }),
      );
    }

    const assetsParam = getParam<
      StorageLocalState['assets'] | undefined,
      Partial<Record<NetworkName, AssetsRecord>>
    >(stateChanges.assets, {});

    const network = stateChanges.currentNetwork || currentState.currentNetwork;
    const networkAssets = assetsParam?.[network];
    if (networkAssets && !deepEqual(networkAssets, currentState.assets)) {
      store.dispatch(setAssets(networkAssets));
    }

    const swappableAssetIdsByVendor = getParam(stateChanges.swappableAssetIdsByVendor, {});
    if (
      swappableAssetIdsByVendor &&
      !deepEqual(currentState.swappableAssetIdsByVendor, swappableAssetIdsByVendor)
    ) {
      store.dispatch(updateSwappableAssets(swappableAssetIdsByVendor));
    }

    const usdPrices = getParam(stateChanges.usdPrices, {});
    if (usdPrices && !deepEqual(currentState.usdPrices, usdPrices)) {
      store.dispatch(setUsdPrices(usdPrices));
    }

    const assetLogos = getParam(stateChanges.assetLogos, {});
    if (assetLogos && !deepEqual(currentState.assetLogos, assetLogos)) {
      store.dispatch(setAssetLogos(assetLogos));
    }

    const assetTickers = getParam(stateChanges.assetTickers, {});
    if (assetTickers && !deepEqual(currentState.assetTickers, assetTickers)) {
      store.dispatch(setAssetTickers(assetTickers));
    }

    const addresses = getParam(stateChanges.addresses, {});
    if (addresses && !deepEqual(currentState.addresses, addresses)) {
      store.dispatch(updateAddresses(addresses));
    }

    const nfts = getParam(stateChanges.nfts, null);
    if (nfts && !deepEqual(currentState.nfts, nfts)) {
      store.dispatch(updateNfts(nfts));
    }
  };
}
