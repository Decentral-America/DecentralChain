import { createReducer } from '@reduxjs/toolkit';

import { type AssetsRecord } from '../../assets/types';
import { type BalancesItem } from '../../balances/types';
import { type Message } from '../../messages/types';
import { NetworkName } from '../../networks/types';
import { type NftInfo } from '../../nfts/nfts';
import { type IdleOptions, type PreferencesAccount } from '../../preferences/types';
import { ACTION } from '../actions/constants';
import { typedPayload } from '../types';
import {
  type AssetFilters,
  type NftFilters,
  type TxHistoryFilters,
  type UiState,
} from './stateTypes';

export * from './localState';
export * from './nftConfig';
export * from './notifications';
export * from './remoteConfig';
export type { AssetFilters, NftFilters, TxHistoryFilters, UiState };

export const uiState = createReducer({} as UiState, (builder) => {
  builder.addCase(ACTION.UPDATE_UI_STATE, (_, action) => typedPayload(action));
});

export const accounts = createReducer([] as PreferencesAccount[], (builder) => {
  builder.addCase(ACTION.UPDATE_CURRENT_NETWORK_ACCOUNTS, (_, action) => typedPayload(action));
});

export const allNetworksAccounts = createReducer([] as PreferencesAccount[], (builder) => {
  builder.addCase(ACTION.UPDATE_ALL_NETWORKS_ACCOUNTS, (_, action) => typedPayload(action));
});

export const selectedAccount = createReducer({} as PreferencesAccount | undefined, (builder) => {
  builder
    .addCase(ACTION.SELECT_ACCOUNT, (_, action) => typedPayload(action))
    .addCase(ACTION.UPDATE_SELECTED_ACCOUNT, (_, action) => typedPayload(action));
});

export const currentNetwork = createReducer(NetworkName.Mainnet as NetworkName, (builder) => {
  builder.addCase(ACTION.UPDATE_CURRENT_NETWORK, (_, action) => typedPayload(action));
});

export const balances = createReducer({} as Partial<Record<string, BalancesItem>>, (builder) => {
  builder.addCase(ACTION.UPDATE_BALANCES, (_, action) => typedPayload(action));
});

export const currentLocale = createReducer('en', (builder) => {
  builder.addCase(ACTION.UPDATE_FROM_LNG, (_, action) => typedPayload(action));
});

export const customNodes = createReducer(
  {} as Partial<Record<NetworkName, string | null>>,
  (builder) => {
    builder.addCase(ACTION.UPDATE_NODES, (_, action) => typedPayload(action));
  },
);

export const customCodes = createReducer(
  {} as Partial<Record<NetworkName, string | null>>,
  (builder) => {
    builder.addCase(ACTION.UPDATE_CODES, (_, action) => typedPayload(action));
  },
);

export const customMatcher = createReducer(
  {} as Partial<Record<NetworkName, string | null>>,
  (builder) => {
    builder.addCase(ACTION.UPDATE_MATCHER, (_, action) => typedPayload(action));
  },
);

export const origins = createReducer({} as Partial<Record<string, unknown[]>>, (builder) => {
  builder.addCase(ACTION.UPDATE_ORIGINS, (_, action) => typedPayload(action));
});

export const idleOptions = createReducer({} as Partial<IdleOptions>, (builder) => {
  builder.addCase(ACTION.REMOTE_CONFIG.UPDATE_IDLE, (_, action) => typedPayload(action));
});

export const messages = createReducer([] as Message[], (builder) => {
  builder.addCase(ACTION.UPDATE_MESSAGES, (_, action) => typedPayload(action));
});

export const assets = createReducer({} as AssetsRecord, (builder) => {
  builder.addCase(ACTION.SET_ASSETS, (_, action) => typedPayload(action));
});

export const swappableAssetIdsByVendor = createReducer(
  {} as Record<string, string[]>,
  (builder) => {
    builder.addCase(ACTION.UPDATE_SWAPPABLE_ASSETS, (_, action) => typedPayload(action));
  },
);

export const usdPrices = createReducer({} as Partial<Record<string, string>>, (builder) => {
  builder.addCase(ACTION.SET_USD_PRICES, (_, action) => typedPayload(action));
});

export const assetLogos = createReducer({} as Record<string, string>, (builder) => {
  builder.addCase(ACTION.SET_ASSET_LOGOS, (_, action) => typedPayload(action));
});

export const assetTickers = createReducer({} as Record<string, string>, (builder) => {
  builder.addCase(ACTION.SET_ASSET_TICKERS, (_, action) => typedPayload(action));
});

export const addresses = createReducer({} as Record<string, string>, (builder) => {
  builder.addCase(ACTION.UPDATE_ADDRESSES, (_, action) => typedPayload(action));
});

export const nfts = createReducer(null as Record<string, NftInfo> | null, (builder) => {
  builder.addCase(ACTION.UPDATE_NFTS, (_, action) => typedPayload(action));
});

export const state = createReducer(
  null as { initialized: boolean | null | undefined; locked: boolean | null | undefined } | null,
  (builder) => {
    builder.addCase(ACTION.UPDATE_APP_STATE, (_, action) => typedPayload(action));
  },
);
