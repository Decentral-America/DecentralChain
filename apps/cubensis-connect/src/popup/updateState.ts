import { deepEqual } from 'fast-equals';
import type { NotificationsStoreItem } from '#notifications/types';
import type { StorageLocalState } from '#storage/storage';

import type { AssetsRecord } from '../assets/types';
import { collectBalances } from '../balances/utils';
import type { Message } from '../messages/types';
import { MessageStatus } from '../messages/types';
import type { NetworkName } from '../networks/types';
import { setActiveAuto, syncLocale } from './store/actions';
import { popupStore } from './store/popupStore';

function getParam<S, D>(param: S, defaultParam: D) {
  if (param) {
    return param;
  }

  return param === null ? defaultParam : undefined;
}

type StateChanges = Partial<StorageLocalState>;

export function createUpdateState() {
  return (stateChanges: StateChanges) => {
    const currentState = popupStore.getState();

    const config = getParam(stateChanges.config, {});
    if (config && !deepEqual(currentState.config, config)) {
      popupStore.setState({ config });
    }

    if (stateChanges.nftConfig && !deepEqual(currentState.nftConfig, stateChanges.nftConfig)) {
      popupStore.setState({ nftConfig: stateChanges.nftConfig });
    }

    const idleOptions = getParam(stateChanges.idleOptions, {});
    if (idleOptions && !deepEqual(currentState.idleOptions, idleOptions)) {
      popupStore.setState({ idleOptions });
    }

    const customNodes = getParam(stateChanges.customNodes, {});
    if (customNodes && !deepEqual(currentState.customNodes, customNodes)) {
      popupStore.setState({ customNodes });
    }

    const customCodes = getParam(stateChanges.customCodes, {});
    if (customCodes && !deepEqual(currentState.customCodes, customCodes)) {
      popupStore.setState({ customCodes });
    }

    const customMatchers = getParam(stateChanges.customMatchers, {});
    if (customMatchers && !deepEqual(currentState.customMatcher, customMatchers)) {
      popupStore.setState({ customMatcher: customMatchers });
    }

    if (stateChanges.currentLocale && stateChanges.currentLocale !== currentState.currentLocale) {
      popupStore.setState({ currentLocale: stateChanges.currentLocale });
      syncLocale(stateChanges.currentLocale);
    }

    const uiState = getParam(stateChanges.uiState, {});
    if (uiState && !deepEqual(uiState, currentState.uiState)) {
      popupStore.setState({ uiState });
    }

    const currentNetwork = getParam(stateChanges.currentNetwork, '');
    if (currentNetwork && currentNetwork !== currentState.currentNetwork) {
      popupStore.setState({ currentNetwork: currentNetwork as NetworkName });
    }

    const origins = getParam(stateChanges.origins, {});
    if (origins && !deepEqual(origins, currentState.origins)) {
      popupStore.setState({ origins });
    }

    const messages = getParam(stateChanges.messages, []);

    const unapprovedMessages = messages?.filter((msg: Message) => {
      const account = stateChanges.selectedAccount ?? currentState.selectedAccount;

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
      popupStore.setState({ messages: unapprovedMessages });
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
      popupStore.setState({ notifications: myNotifications });
      setActiveAutoPayload.notifications = myNotifications;
    }

    if (
      messages &&
      (setActiveAutoPayload.messages !== currentState.messages ||
        setActiveAutoPayload.notifications !== currentState.notifications)
    ) {
      setActiveAuto(setActiveAutoPayload);
    }

    const newSelectedAccount = getParam(stateChanges.selectedAccount, undefined);
    if (newSelectedAccount && !deepEqual(newSelectedAccount, currentState.selectedAccount)) {
      popupStore.setState({ selectedAccount: newSelectedAccount });
    }

    const accounts = getParam(stateChanges.accounts, []);
    if (accounts && !deepEqual(accounts, currentState.allNetworksAccounts)) {
      popupStore.setState({ allNetworksAccounts: accounts });
    }

    if (
      (stateChanges.accounts != null &&
        !deepEqual(stateChanges.accounts, currentState.allNetworksAccounts)) ||
      (stateChanges.currentNetwork != null &&
        stateChanges.currentNetwork !== currentState.currentNetwork)
    ) {
      const allAccounts = stateChanges.accounts ?? currentState.allNetworksAccounts;
      const network = (stateChanges.currentNetwork ?? currentState.currentNetwork) as NetworkName;
      popupStore.setState({
        accounts: allAccounts.filter((account) => account.network === network),
      });
    }

    if (
      !currentState.state ||
      ('initialized' in stateChanges &&
        stateChanges.initialized !== currentState.state.initialized) ||
      ('locked' in stateChanges && stateChanges.locked !== currentState.state.locked)
    ) {
      popupStore.setState({
        state: {
          initialized: stateChanges.initialized ?? currentState.state?.initialized,
          locked: stateChanges.locked ?? currentState.state?.locked,
        },
      });
    }

    const balanceUpdate = collectBalances(stateChanges);
    if (Object.keys(balanceUpdate).length !== 0) {
      popupStore.setState((s) => ({
        balances: {
          ...s.balances,
          ...balanceUpdate,
        },
      }));
    }

    const assetsParam = getParam<
      StorageLocalState['assets'] | undefined,
      Partial<Record<NetworkName, AssetsRecord>>
    >(stateChanges.assets, {});

    const network = (stateChanges.currentNetwork ?? currentState.currentNetwork) as NetworkName;
    const networkAssets = assetsParam?.[network];
    if (networkAssets && !deepEqual(networkAssets, currentState.assets)) {
      popupStore.setState({ assets: networkAssets });
    }

    const usdPrices = getParam(stateChanges.usdPrices, {});
    if (usdPrices && !deepEqual(currentState.usdPrices, usdPrices)) {
      popupStore.setState({ usdPrices });
    }

    const assetLogos = getParam(stateChanges.assetLogos, {});
    if (assetLogos && !deepEqual(currentState.assetLogos, assetLogos)) {
      popupStore.setState({ assetLogos });
    }

    const assetTickers = getParam(stateChanges.assetTickers, {});
    if (assetTickers && !deepEqual(currentState.assetTickers, assetTickers)) {
      popupStore.setState({ assetTickers });
    }

    const addresses = getParam(stateChanges.addresses, {});
    if (addresses && !deepEqual(currentState.addresses, addresses)) {
      popupStore.setState({ addresses });
    }

    const nfts = getParam(stateChanges.nfts, null);
    if (nfts && !deepEqual(currentState.nfts, nfts)) {
      popupStore.setState({ nfts });
    }
  };
}
