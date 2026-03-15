import { deepEqual } from 'fast-equals';
import { type NotificationsStoreItem } from 'notifications/types';
import { type StorageLocalState } from 'storage/storage';

import { type AssetsRecord } from '../assets/types';
import { collectBalances } from '../balances/utils';
import { type Message, MessageStatus } from '../messages/types';
import { type NetworkName } from '../networks/types';
import { ACTION } from '../store/actions/constants';
import { type PopupStore } from './store/types';

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
      store.dispatch({
        payload: config,
        type: ACTION.REMOTE_CONFIG.SET_CONFIG,
      });
    }

    if (stateChanges.nftConfig && !deepEqual(currentState.nftConfig, stateChanges.nftConfig)) {
      store.dispatch({
        payload: stateChanges.nftConfig,
        type: ACTION.UPDATE_NFT_CONFIG,
      });
    }

    const idleOptions = getParam(stateChanges.idleOptions, {});
    if (idleOptions && !deepEqual(currentState.idleOptions, idleOptions)) {
      store.dispatch({
        payload: idleOptions,
        type: ACTION.REMOTE_CONFIG.UPDATE_IDLE,
      });
    }

    const customNodes = getParam(stateChanges.customNodes, {});
    if (customNodes && !deepEqual(currentState.customNodes, customNodes)) {
      store.dispatch({
        payload: customNodes,
        type: ACTION.UPDATE_NODES,
      });
    }

    const customCodes = getParam(stateChanges.customCodes, {});
    if (customCodes && !deepEqual(currentState.customCodes, customCodes)) {
      store.dispatch({
        payload: customCodes,
        type: ACTION.UPDATE_CODES,
      });
    }

    const customMatchers = getParam(stateChanges.customMatchers, {});
    if (customMatchers && !deepEqual(currentState.customMatcher, customMatchers)) {
      store.dispatch({
        payload: customMatchers,
        type: ACTION.UPDATE_MATCHER,
      });
    }

    if (stateChanges.currentLocale && stateChanges.currentLocale !== currentState.currentLocale) {
      store.dispatch({
        payload: stateChanges.currentLocale,
        type: ACTION.UPDATE_FROM_LNG,
      });
    }

    const uiState = getParam(stateChanges.uiState, {});
    if (uiState && !deepEqual(uiState, currentState.uiState)) {
      store.dispatch({
        payload: uiState,
        type: ACTION.UPDATE_UI_STATE,
      });
    }

    const currentNetwork = getParam(stateChanges.currentNetwork, '');
    if (currentNetwork && currentNetwork !== currentState.currentNetwork) {
      store.dispatch({
        payload: currentNetwork,
        type: ACTION.UPDATE_CURRENT_NETWORK,
      });
    }

    const origins = getParam(stateChanges.origins, {});
    if (origins && !deepEqual(origins, currentState.origins)) {
      store.dispatch({
        payload: origins,
        type: ACTION.UPDATE_ORIGINS,
      });
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
      store.dispatch({
        payload: unapprovedMessages,
        type: ACTION.UPDATE_MESSAGES,
      });

      setActiveAutoPayload.messages = unapprovedMessages;
    }

    const currentOrNewSelectedAccount =
      stateChanges.selectedAccount ?? currentState.selectedAccount;

    const myNotifications =
      currentOrNewSelectedAccount &&
      stateChanges.notifications &&
      stateChanges.notifications
        .filter((notification) => notification.address === currentOrNewSelectedAccount.address)
        .reverse()
        .reduce<{
          items: NotificationsStoreItem[][];
          hash: Record<string, NotificationsStoreItem[]>;
        }>(
          (acc, item) => {
            if (!acc.hash[item.origin]) {
              acc.hash[item.origin] = [];
              acc.items.push(acc.hash[item.origin]!);
            }

            acc.hash[item.origin]!.push(item);

            return acc;
          },
          { hash: {}, items: [] },
        ).items;

    if (myNotifications && !deepEqual(currentState.notifications, myNotifications)) {
      store.dispatch({
        payload: myNotifications,
        type: ACTION.NOTIFICATIONS.SET,
      });

      setActiveAutoPayload.notifications = myNotifications;
    }

    if (
      messages &&
      (setActiveAutoPayload.messages !== currentState.messages ||
        setActiveAutoPayload.notifications !== currentState.notifications)
    ) {
      store.dispatch({
        payload: setActiveAutoPayload,
        type: ACTION.MESSAGES.SET_ACTIVE_AUTO,
      });
    }

    const newSelectedAccount = getParam(stateChanges.selectedAccount, {} as unknown as undefined);
    if (newSelectedAccount && !deepEqual(newSelectedAccount, currentState.selectedAccount)) {
      store.dispatch({
        payload: newSelectedAccount,
        type: ACTION.UPDATE_SELECTED_ACCOUNT,
      });
    }

    const accounts = getParam(stateChanges.accounts, []);
    if (accounts && !deepEqual(accounts, currentState.allNetworksAccounts)) {
      store.dispatch({
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

      store.dispatch({
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
      store.dispatch({
        payload: {
          initialized: stateChanges.initialized ?? currentState.state?.initialized,
          locked: stateChanges.locked ?? currentState.state?.locked,
        },
        type: ACTION.UPDATE_APP_STATE,
      });
    }

    const balances = collectBalances(stateChanges);
    if (Object.keys(balances).length !== 0) {
      store.dispatch({
        payload: {
          ...currentState.balances,
          ...balances,
        },
        type: ACTION.UPDATE_BALANCES,
      });
    }

    const assets = getParam<
      StorageLocalState['assets'] | undefined,
      Partial<Record<NetworkName, AssetsRecord>>
    >(stateChanges.assets, {});

    const network = stateChanges.currentNetwork || currentState.currentNetwork;
    const networkAssets = assets?.[network];
    if (networkAssets && !deepEqual(networkAssets, currentState.assets)) {
      store.dispatch({
        payload: networkAssets,
        type: ACTION.SET_ASSETS,
      });
    }

    const swappableAssetIdsByVendor = getParam(stateChanges.swappableAssetIdsByVendor, {});
    if (
      swappableAssetIdsByVendor &&
      !deepEqual(currentState.swappableAssetIdsByVendor, swappableAssetIdsByVendor)
    ) {
      store.dispatch({
        payload: swappableAssetIdsByVendor,
        type: ACTION.UPDATE_SWAPPABLE_ASSETS,
      });
    }

    const usdPrices = getParam(stateChanges.usdPrices, {});
    if (usdPrices && !deepEqual(usdPrices, currentState.usdPrices)) {
      store.dispatch({
        payload: usdPrices,
        type: ACTION.SET_USD_PRICES,
      });
    }

    const assetLogos = getParam(stateChanges.assetLogos, {});
    if (assetLogos && !deepEqual(assetLogos, currentState.assetLogos)) {
      store.dispatch({
        payload: assetLogos,
        type: ACTION.SET_ASSET_LOGOS,
      });
    }

    const assetTickers = getParam(stateChanges.assetTickers, {});
    if (assetTickers && !deepEqual(assetTickers, currentState.assetTickers)) {
      store.dispatch({
        payload: assetTickers,
        type: ACTION.SET_ASSET_TICKERS,
      });
    }

    const addresses = getParam(stateChanges.addresses, {});
    if (addresses && !deepEqual(addresses, currentState.addresses)) {
      store.dispatch({
        payload: addresses,
        type: ACTION.UPDATE_ADDRESSES,
      });
    }

    const nfts = getParam(stateChanges.nfts, null);
    if (nfts && !deepEqual(nfts, currentState.nfts)) {
      store.dispatch({
        payload: nfts,
        type: ACTION.UPDATE_NFTS,
      });
    }
  };
}
