import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type AssetsRecord } from '../../assets/types';
import { type BalancesItem } from '../../balances/types';
import { type Message } from '../../messages/types';
import { NetworkName } from '../../networks/types';
import { type NftInfo } from '../../nfts/nfts';
import { type PermissionValue } from '../../permissions/types';
import { type IdleOptions, type PreferencesAccount } from '../../preferences/types';
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

// ─── uiState ───────────────────────────────────────────────────────────────
const uiStateSlice = createSlice({
  initialState: {} as UiState,
  name: 'uiState',
  reducers: {
    updateUiState: (_state, action: PayloadAction<UiState>) => action.payload,
  },
});
export const uiState = uiStateSlice.reducer;
export const { updateUiState } = uiStateSlice.actions;

// ─── accounts ──────────────────────────────────────────────────────────────
const accountsSlice = createSlice({
  initialState: [] as PreferencesAccount[],
  name: 'accounts',
  reducers: {
    updateCurrentNetworkAccounts: (_state, action: PayloadAction<PreferencesAccount[]>) =>
      action.payload,
  },
});
export const accounts = accountsSlice.reducer;
export const { updateCurrentNetworkAccounts } = accountsSlice.actions;

// ─── allNetworksAccounts ───────────────────────────────────────────────────
const allNetworksAccountsSlice = createSlice({
  initialState: [] as PreferencesAccount[],
  name: 'allNetworksAccounts',
  reducers: {
    updateAllNetworksAccounts: (_state, action: PayloadAction<PreferencesAccount[]>) =>
      action.payload,
  },
});
export const allNetworksAccounts = allNetworksAccountsSlice.reducer;
export const { updateAllNetworksAccounts } = allNetworksAccountsSlice.actions;

// ─── selectedAccount ───────────────────────────────────────────────────────
// Two distinct action shapes: user-initiated (selectAccount) triggers BackgroundMW side-effects;
// background-sync (updateSelectedAccount) is the canonical state update from the background.
const selectedAccountSlice = createSlice({
  initialState: {} as PreferencesAccount | undefined,
  name: 'selectedAccount',
  reducers: {
    selectAccount: (_state, action: PayloadAction<PreferencesAccount>) => action.payload,
    updateSelectedAccount: (_state, action: PayloadAction<PreferencesAccount | undefined>) =>
      action.payload,
  },
});
export const selectedAccount = selectedAccountSlice.reducer;
export const { selectAccount, updateSelectedAccount } = selectedAccountSlice.actions;

// ─── currentNetwork ────────────────────────────────────────────────────────
const currentNetworkSlice = createSlice({
  initialState: NetworkName.Mainnet as NetworkName,
  name: 'currentNetwork',
  reducers: {
    updateCurrentNetwork: (_state, action: PayloadAction<NetworkName>) => action.payload,
  },
});
export const currentNetwork = currentNetworkSlice.reducer;
export const { updateCurrentNetwork } = currentNetworkSlice.actions;

// ─── balances ──────────────────────────────────────────────────────────────
const balancesSlice = createSlice({
  initialState: {} as Partial<Record<string, BalancesItem>>,
  name: 'balances',
  reducers: {
    updateBalances: (_state, action: PayloadAction<Partial<Record<string, BalancesItem>>>) =>
      action.payload,
  },
});
export const balances = balancesSlice.reducer;
export const { updateBalances } = balancesSlice.actions;

// ─── currentLocale ─────────────────────────────────────────────────────────
const currentLocaleSlice = createSlice({
  initialState: 'en',
  name: 'currentLocale',
  reducers: {
    updateLocale: (_state, action: PayloadAction<string>) => action.payload,
  },
});
export const currentLocale = currentLocaleSlice.reducer;
export const { updateLocale } = currentLocaleSlice.actions;

// ─── customNodes ───────────────────────────────────────────────────────────
const customNodesSlice = createSlice({
  initialState: {} as Partial<Record<NetworkName, string | null>>,
  name: 'customNodes',
  reducers: {
    updateNodes: (_state, action: PayloadAction<Partial<Record<NetworkName, string | null>>>) =>
      action.payload,
  },
});
export const customNodes = customNodesSlice.reducer;
export const { updateNodes } = customNodesSlice.actions;

// ─── customCodes ───────────────────────────────────────────────────────────
const customCodesSlice = createSlice({
  initialState: {} as Partial<Record<NetworkName, string | null>>,
  name: 'customCodes',
  reducers: {
    updateCodes: (_state, action: PayloadAction<Partial<Record<NetworkName, string | null>>>) =>
      action.payload,
  },
});
export const customCodes = customCodesSlice.reducer;
export const { updateCodes } = customCodesSlice.actions;

// ─── customMatcher ─────────────────────────────────────────────────────────
const customMatcherSlice = createSlice({
  initialState: {} as Partial<Record<NetworkName, string | null>>,
  name: 'customMatcher',
  reducers: {
    updateMatcher: (_state, action: PayloadAction<Partial<Record<NetworkName, string | null>>>) =>
      action.payload,
  },
});
export const customMatcher = customMatcherSlice.reducer;
export const { updateMatcher } = customMatcherSlice.actions;

// ─── origins ───────────────────────────────────────────────────────────────
const originsSlice = createSlice({
  initialState: {} as Partial<Record<string, PermissionValue[]>>,
  name: 'origins',
  reducers: {
    updateOrigins: (_state, action: PayloadAction<Partial<Record<string, PermissionValue[]>>>) =>
      action.payload,
  },
});
export const origins = originsSlice.reducer;
export const { updateOrigins } = originsSlice.actions;

// ─── idleOptions ───────────────────────────────────────────────────────────
const idleOptionsSlice = createSlice({
  initialState: {} as Partial<IdleOptions>,
  name: 'idleOptions',
  reducers: {
    updateIdleOptions: (_state, action: PayloadAction<Partial<IdleOptions>>) => action.payload,
  },
});
export const idleOptions = idleOptionsSlice.reducer;
export const { updateIdleOptions } = idleOptionsSlice.actions;

// ─── messages ──────────────────────────────────────────────────────────────
const messagesSlice = createSlice({
  initialState: [] as Message[],
  name: 'messages',
  reducers: {
    updateMessages: (_state, action: PayloadAction<Message[]>) => action.payload,
  },
});
export const messages = messagesSlice.reducer;
export const { updateMessages } = messagesSlice.actions;

// ─── assets ────────────────────────────────────────────────────────────────
const assetsSlice = createSlice({
  initialState: {} as AssetsRecord,
  name: 'assets',
  reducers: {
    setAssets: (_state, action: PayloadAction<AssetsRecord>) => action.payload,
  },
});
export const assets = assetsSlice.reducer;
export const { setAssets } = assetsSlice.actions;

// ─── swappableAssetIdsByVendor ─────────────────────────────────────────────
const swappableAssetsSlice = createSlice({
  initialState: {} as Record<string, string[]>,
  name: 'swappableAssetIdsByVendor',
  reducers: {
    updateSwappableAssets: (_state, action: PayloadAction<Record<string, string[]>>) =>
      action.payload,
  },
});
export const swappableAssetIdsByVendor = swappableAssetsSlice.reducer;
export const { updateSwappableAssets } = swappableAssetsSlice.actions;

// ─── usdPrices ─────────────────────────────────────────────────────────────
const usdPricesSlice = createSlice({
  initialState: {} as Partial<Record<string, string>>,
  name: 'usdPrices',
  reducers: {
    setUsdPrices: (_state, action: PayloadAction<Partial<Record<string, string>>>) =>
      action.payload,
  },
});
export const usdPrices = usdPricesSlice.reducer;
export const { setUsdPrices } = usdPricesSlice.actions;

// ─── assetLogos ────────────────────────────────────────────────────────────
const assetLogosSlice = createSlice({
  initialState: {} as Record<string, string>,
  name: 'assetLogos',
  reducers: {
    setAssetLogos: (_state, action: PayloadAction<Record<string, string>>) => action.payload,
  },
});
export const assetLogos = assetLogosSlice.reducer;
export const { setAssetLogos } = assetLogosSlice.actions;

// ─── assetTickers ──────────────────────────────────────────────────────────
const assetTickersSlice = createSlice({
  initialState: {} as Record<string, string>,
  name: 'assetTickers',
  reducers: {
    setAssetTickers: (_state, action: PayloadAction<Record<string, string>>) => action.payload,
  },
});
export const assetTickers = assetTickersSlice.reducer;
export const { setAssetTickers } = assetTickersSlice.actions;

// ─── addresses ─────────────────────────────────────────────────────────────
const addressesSlice = createSlice({
  initialState: {} as Record<string, string>,
  name: 'addresses',
  reducers: {
    updateAddresses: (_state, action: PayloadAction<Record<string, string>>) => action.payload,
  },
});
export const addresses = addressesSlice.reducer;
export const { updateAddresses } = addressesSlice.actions;

// ─── nfts ──────────────────────────────────────────────────────────────────
const nftsSlice = createSlice({
  initialState: null as Record<string, NftInfo> | null,
  name: 'nfts',
  reducers: {
    updateNfts: (_state, action: PayloadAction<Record<string, NftInfo> | null>) => action.payload,
  },
});
export const nfts = nftsSlice.reducer;
export const { updateNfts } = nftsSlice.actions;

// ─── state (app init / lock state) ─────────────────────────────────────────
interface AppState {
  initialized: boolean | null | undefined;
  locked: boolean | null | undefined;
}
const appStateSlice = createSlice({
  initialState: null as AppState | null,
  name: 'appState',
  reducers: {
    updateAppState: (_state, action: PayloadAction<AppState>) => action.payload,
  },
});
export const state = appStateSlice.reducer;
export const { updateAppState } = appStateSlice.actions;
