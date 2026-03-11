import type { AssetsRecord } from '../../assets/types';
import type { Message } from '../../messages/types';
import { NetworkName } from '../../networks/types';
import type { PreferencesAccount } from '../../preferences/types';
import { ACTION } from '../actions/constants';
import type { AppAction, AppActionPayload } from '../types';

export * from './localState';
export * from './nftConfig';
export * from './notifications';
export * from './remoteConfig';

function createSimpleReducer<TActionType extends AppAction['type']>(
  initialState: AppActionPayload<TActionType>,
  actionType: TActionType,
) {
  return (state = initialState, action: AppAction): AppActionPayload<TActionType> =>
    (actionType === action.type ? action.payload : state) as any;
}

export type AssetFilters = {
  term?: string | undefined;
  onlyMy?: boolean | undefined;
  onlyFavorites?: boolean | undefined;
};
export type NftFilters = {
  term?: string | undefined;
};
export type TxHistoryFilters = {
  term?: string | undefined;
  type?: number | undefined;
  onlyIncoming?: boolean | undefined;
  onlyOutgoing?: boolean | undefined;
};

export interface UiState {
  account?: unknown | undefined;
  assetFilters?: AssetFilters | undefined;
  assetsTab?: number | undefined;
  autoClickProtection?: boolean | undefined;
  nftFilters?: NftFilters | undefined;
  showSuspiciousAssets?: boolean | undefined;
  slippageToleranceIndex?: number | undefined;
  txHistoryFilters?: TxHistoryFilters | undefined;
}

export const uiState = createSimpleReducer({}, ACTION.UPDATE_UI_STATE);

export const accounts = createSimpleReducer([], ACTION.UPDATE_CURRENT_NETWORK_ACCOUNTS);

export const allNetworksAccounts = createSimpleReducer([], ACTION.UPDATE_ALL_NETWORKS_ACCOUNTS);

export function selectedAccount(
  state: PreferencesAccount | undefined = {} as unknown as undefined,
  action: AppAction,
): PreferencesAccount | undefined {
  switch (action.type) {
    case ACTION.SELECT_ACCOUNT:
    case ACTION.UPDATE_SELECTED_ACCOUNT:
      return action.payload;
    default:
      return state;
  }
}

export const currentNetwork = createSimpleReducer(
  NetworkName.Mainnet,
  ACTION.UPDATE_CURRENT_NETWORK,
);

export const balances = createSimpleReducer({}, ACTION.UPDATE_BALANCES);

export const currentLocale = createSimpleReducer('en', ACTION.UPDATE_FROM_LNG);
export const customNodes = createSimpleReducer({}, ACTION.UPDATE_NODES);
export const customCodes = createSimpleReducer({}, ACTION.UPDATE_CODES);
export const customMatcher = createSimpleReducer({}, ACTION.UPDATE_MATCHER);
export const origins = createSimpleReducer({}, ACTION.UPDATE_ORIGINS);

export const idleOptions = createSimpleReducer({}, ACTION.REMOTE_CONFIG.UPDATE_IDLE);

export const messages = (state: Message[] = [], action: AppAction) => {
  switch (action.type) {
    case ACTION.UPDATE_MESSAGES:
      return action.payload;
    default:
      return state;
  }
};

export const assets = createSimpleReducer({} as AssetsRecord, ACTION.SET_ASSETS);
export const swappableAssetIdsByVendor = createSimpleReducer({}, ACTION.UPDATE_SWAPPABLE_ASSETS);
export const usdPrices = createSimpleReducer({}, ACTION.SET_USD_PRICES);
export const assetLogos = createSimpleReducer({}, ACTION.SET_ASSET_LOGOS);
export const assetTickers = createSimpleReducer({}, ACTION.SET_ASSET_TICKERS);
export const addresses = createSimpleReducer({}, ACTION.UPDATE_ADDRESSES);
export const nfts = createSimpleReducer(null, ACTION.UPDATE_NFTS);
export const state = createSimpleReducer(null, ACTION.UPDATE_APP_STATE);
