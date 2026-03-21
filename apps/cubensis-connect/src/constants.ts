import { NetworkName } from 'networks/types';
export const MAX_TX_HISTORY_ITEMS = 101;
export const MAX_NFT_ITEMS = 1000;

export const STATUS = {
  ERROR: -1,
  OK: 1,
  PENDING: 0,
  UPDATED: 2,
};

export const NETWORK_CONFIG: Record<
  NetworkName,
  {
    matcherBaseUrl: string;
    name: NetworkName;
    networkCode: string;
    nodeBaseUrl: string;
  }
> = {
  [NetworkName.Testnet]: {
    matcherBaseUrl: 'https://matcher.decentralchain.io/',
    name: NetworkName.Testnet,
    networkCode: '!',
    nodeBaseUrl: 'https://testnet-node.decentralchain.io/',
  },
  [NetworkName.Mainnet]: {
    matcherBaseUrl: 'https://mainnet-matcher.decentralchain.io/',
    name: NetworkName.Mainnet,
    networkCode: '?',
    nodeBaseUrl: 'https://mainnet-node.decentralchain.io/',
  },
  [NetworkName.Stagenet]: {
    matcherBaseUrl: 'https://stagenet-matcher.decentralchain.io/',
    name: NetworkName.Stagenet,
    networkCode: 'S',
    nodeBaseUrl: 'https://stagenet-node.decentralchain.io/',
  },
  [NetworkName.Custom]: {
    matcherBaseUrl: '',
    name: NetworkName.Custom,
    networkCode: '',
    nodeBaseUrl: '',
  },
};

export const DEFAULT_MAIN_CONFIG = {
  assets: {
    maxAssetsPerRequest: 100,
  },
  idle: {
    '1h': 60 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '20m': 20 * 60 * 1000,
    '40m': 40 * 60 * 1000,
    idle: 0,
  },
  ignoreErrors: {
    beforeSend: [
      'An operation that changes interface state is in progress',
      'Failed to fetch',
      'NetworkError when attempting to fetch resource',
      'No device selected',
      'The operation was aborted',
    ],
    beforeSendAccounts: [] as string[],
    beforeSendBackground: [] as string[],
    beforeSendPopup: [] as string[],
    contentScriptApprove: [] as string[],
    ignoreAll: false,
    popupApprove: [] as string[],
  },
  messages_config: {
    message_expiration_ms: 30 * 60 * 1000,
    notification_interval_min: 30 * 1000,
    notification_message_max: 250,
    notification_title_max: 20,
    update_messages_ms: 30 * 1000,
  },
  networks: ['mainnet', 'testnet', 'stagenet', 'custom'],
  nfts: {
    signArtImgUrl: 'https://signart.infura-ipfs.io/ipfs/{domain}/{filename}',
  },
  pack_config: {
    allow_tx: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    max: 7,
  },
  whitelist: ['decentralchain.io', 'explorer.decentralchain.io'],
};

export type MainConfig = typeof DEFAULT_MAIN_CONFIG;
export type AssetsConfig = MainConfig['assets'];
export type IgnoreErrorsConfig = MainConfig['ignoreErrors'];
export type NftConfig = MainConfig['nfts'];

export type IgnoreErrorsContext = {
  [K in keyof IgnoreErrorsConfig]: IgnoreErrorsConfig[K] extends string[] ? K : never;
}[keyof IgnoreErrorsConfig];
