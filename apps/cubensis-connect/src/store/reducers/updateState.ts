import { createReducer, type PayloadAction } from '@reduxjs/toolkit';

import { type AssetsRecord } from '../../assets/types';
import { type BalancesItem } from '../../balances/types';
import { type Message } from '../../messages/types';
import { NetworkName } from '../../networks/types';
import { type NftInfo } from '../../nfts/nfts';
import { type IdleOptions, type PreferencesAccount } from '../../preferences/types';
import { ACTION } from '../actions/constants';
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
  builder.addCase(
    ACTION.UPDATE_UI_STATE,
    (_, action) => (action as unknown as PayloadAction<UiState>).payload,
  );
});

export const accounts = createReducer([] as PreferencesAccount[], (builder) => {
  builder.addCase(
    ACTION.UPDATE_CURRENT_NETWORK_ACCOUNTS,
    (_, action) => (action as unknown as PayloadAction<PreferencesAccount[]>).payload,
  );
});

export const allNetworksAccounts = createReducer([] as PreferencesAccount[], (builder) => {
  builder.addCase(
    ACTION.UPDATE_ALL_NETWORKS_ACCOUNTS,
    (_, action) => (action as unknown as PayloadAction<PreferencesAccount[]>).payload,
  );
});

export const selectedAccount = createReducer({} as PreferencesAccount | undefined, (builder) => {
  builder
    .addCase(
      ACTION.SELECT_ACCOUNT,
      (_, action) => (action as unknown as PayloadAction<PreferencesAccount>).payload,
    )
    .addCase(
      ACTION.UPDATE_SELECTED_ACCOUNT,
      (_, action) => (action as unknown as PayloadAction<PreferencesAccount>).payload,
    );
});

export const currentNetwork = createReducer(NetworkName.Mainnet as NetworkName, (builder) => {
  builder.addCase(
    ACTION.UPDATE_CURRENT_NETWORK,
    (_, action) => (action as unknown as PayloadAction<NetworkName>).payload,
  );
});

export const balances = createReducer({} as Partial<Record<string, BalancesItem>>, (builder) => {
  builder.addCase(
    ACTION.UPDATE_BALANCES,
    (_, action) =>
      (action as unknown as PayloadAction<Partial<Record<string, BalancesItem>>>).payload,
  );
});

export const currentLocale = createReducer('en', (builder) => {
  builder.addCase(
    ACTION.UPDATE_FROM_LNG,
    (_, action) => (action as unknown as PayloadAction<string>).payload,
  );
});

export const customNodes = createReducer(
  {} as Partial<Record<NetworkName, string | null>>,
  (builder) => {
    builder.addCase(
      ACTION.UPDATE_NODES,
      (_, action) =>
        (action as unknown as PayloadAction<Partial<Record<NetworkName, string | null>>>).payload,
    );
  },
);

export const customCodes = createReducer(
  {} as Partial<Record<NetworkName, string | null>>,
  (builder) => {
    builder.addCase(
      ACTION.UPDATE_CODES,
      (_, action) =>
        (action as unknown as PayloadAction<Partial<Record<NetworkName, string | null>>>).payload,
    );
  },
);

export const customMatcher = createReducer(
  {} as Partial<Record<NetworkName, string | null>>,
  (builder) => {
    builder.addCase(
      ACTION.UPDATE_MATCHER,
      (_, action) =>
        (action as unknown as PayloadAction<Partial<Record<NetworkName, string | null>>>).payload,
    );
  },
);

export const origins = createReducer({} as Partial<Record<string, unknown[]>>, (builder) => {
  builder.addCase(
    ACTION.UPDATE_ORIGINS,
    (_, action) => (action as unknown as PayloadAction<Partial<Record<string, unknown[]>>>).payload,
  );
});

export const idleOptions = createReducer({} as Partial<IdleOptions>, (builder) => {
  builder.addCase(
    ACTION.REMOTE_CONFIG.UPDATE_IDLE,
    (_, action) => (action as unknown as PayloadAction<Partial<IdleOptions>>).payload,
  );
});

export const messages = createReducer([] as Message[], (builder) => {
  builder.addCase(
    ACTION.UPDATE_MESSAGES,
    (_, action) => (action as unknown as PayloadAction<Message[]>).payload,
  );
});

export const assets = createReducer({} as AssetsRecord, (builder) => {
  builder.addCase(
    ACTION.SET_ASSETS,
    (_, action) => (action as unknown as PayloadAction<AssetsRecord>).payload,
  );
});

export const swappableAssetIdsByVendor = createReducer(
  {} as Record<string, string[]>,
  (builder) => {
    builder.addCase(
      ACTION.UPDATE_SWAPPABLE_ASSETS,
      (_, action) => (action as unknown as PayloadAction<Record<string, string[]>>).payload,
    );
  },
);

export const usdPrices = createReducer({} as Partial<Record<string, string>>, (builder) => {
  builder.addCase(
    ACTION.SET_USD_PRICES,
    (_, action) => (action as unknown as PayloadAction<Partial<Record<string, string>>>).payload,
  );
});

export const assetLogos = createReducer({} as Record<string, string>, (builder) => {
  builder.addCase(
    ACTION.SET_ASSET_LOGOS,
    (_, action) => (action as unknown as PayloadAction<Record<string, string>>).payload,
  );
});

export const assetTickers = createReducer({} as Record<string, string>, (builder) => {
  builder.addCase(
    ACTION.SET_ASSET_TICKERS,
    (_, action) => (action as unknown as PayloadAction<Record<string, string>>).payload,
  );
});

export const addresses = createReducer({} as Record<string, string>, (builder) => {
  builder.addCase(
    ACTION.UPDATE_ADDRESSES,
    (_, action) => (action as unknown as PayloadAction<Record<string, string>>).payload,
  );
});

export const nfts = createReducer(null as Record<string, NftInfo> | null, (builder) => {
  builder.addCase(
    ACTION.UPDATE_NFTS,
    (_, action) => (action as unknown as PayloadAction<Record<string, NftInfo> | null>).payload,
  );
});

export const state = createReducer(
  null as { initialized: boolean | null | undefined; locked: boolean | null | undefined } | null,
  (builder) => {
    builder.addCase(
      ACTION.UPDATE_APP_STATE,
      (_, action) =>
        (
          action as unknown as PayloadAction<{
            initialized: boolean | null | undefined;
            locked: boolean | null | undefined;
          } | null>
        ).payload,
    );
  },
);
