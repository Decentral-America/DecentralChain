import ObservableStore from 'obs-store';
import Browser from 'webextension-polyfill';
import { isNotNull } from '#_core/isNotNull';
import type { AssetDetail } from '#assets/types';
import { NetworkName } from '#networks/types';

import { defaultAssetTickers } from '../assets/constants';
import type { ExtensionStorage, StorageLocalState } from '../storage/storage';
import type { NetworkController } from './network';
import type { RemoteConfigController } from './remoteConfig';

// 'WAVES' is the protocol-level native asset ID — do not rename.
const NATIVE_ASSET: AssetDetail = {
  description: '',
  displayName: 'DCC',
  height: 0,
  id: 'WAVES',
  issuer: '',
  name: 'DecentralChain',
  precision: 8,
  quantity: '10000000000000000',
  reissuable: false,
  sender: '',
  ticker: 'DCC',
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
};

const MAX_AGE = 60 * 60 * 1000;

const DATA_SERVICE_URL = 'https://api.decentralchain.io';
const SWAP_SERVICE_URL = 'https://swap-api.decentralchain.io';

const INFO_PERIOD_IN_MINUTES = 60;
const SWAPPABLE_ASSETS_UPDATE_PERIOD_IN_MINUTES = 240;

interface AssetInfoResponseItem {
  assetId: string;
  name: string;
  decimals: number;
  description: string;
  issueHeight: number;
  issueTimestamp: string;
  issuer: string;
  quantity: string;
  reissuable: boolean;
  scripted: boolean;
  minSponsoredAssetFee: string | null;
  originTransactionId: string;
}

export class AssetInfoController {
  private store;
  private getNode;
  private getNetwork;
  #remoteConfig;

  constructor({
    extensionStorage,
    getNode,
    getNetwork,
    remoteConfig,
  }: {
    extensionStorage: ExtensionStorage;
    getNode: NetworkController['getNode'];
    getNetwork: NetworkController['getNetwork'];
    remoteConfig: RemoteConfigController;
  }) {
    const initState = extensionStorage.getInitState({
      assetLogos: {},
      assets: {
        [NetworkName.Mainnet]: {
          WAVES: NATIVE_ASSET,
        },
        [NetworkName.Stagenet]: {
          WAVES: NATIVE_ASSET,
        },
        [NetworkName.Testnet]: {
          WAVES: NATIVE_ASSET,
        },
        [NetworkName.Custom]: {
          WAVES: NATIVE_ASSET,
        },
      },
      assetTickers: defaultAssetTickers,
      swappableAssetIdsByVendor: {},
      usdPrices: {},
    });
    this.store = new ObservableStore(initState);
    extensionStorage.subscribe(this.store);

    this.#remoteConfig = remoteConfig;
    this.getNode = getNode;
    this.getNetwork = getNetwork;

    void this.updateInfo();
    void this.updateSwappableAssetIdsByVendor();

    Browser.alarms.create('updateInfo', {
      periodInMinutes: INFO_PERIOD_IN_MINUTES,
    });
    Browser.alarms.create('updateSwappableAssetIdsByVendor', {
      periodInMinutes: SWAPPABLE_ASSETS_UPDATE_PERIOD_IN_MINUTES,
    });

    Browser.alarms.onAlarm.addListener(({ name }) => {
      switch (name) {
        case 'updateInfo':
          void this.updateInfo();
          break;
        case 'updateSwappableAssetIdsByVendor':
          void this.updateSwappableAssetIdsByVendor();
          break;
        default:
          break;
      }
    });
  }

  addTickersForExistingAssets() {
    const { assets, assetTickers } = this.store.getState();

    const assetIdsToUpdate = Object.keys(assetTickers).filter((assetId) => {
      const asset = assets.mainnet[assetId];
      const ticker = assetTickers[assetId];

      return asset && (asset.displayName !== ticker || asset.ticker !== ticker);
    });

    if (assetIdsToUpdate.length !== 0) {
      assetIdsToUpdate.forEach((assetId) => {
        const asset = assets.mainnet[assetId];
        if (!asset) return;
        const ticker = assetTickers[assetId];
        if (!ticker) return;

        asset.displayName = asset.ticker = ticker;
      });

      this.store.updateState({ assets });
    }
  }

  getNativeAsset() {
    return NATIVE_ASSET;
  }

  getAssets() {
    return this.store.getState().assets[this.getNetwork()];
  }

  getUsdPrices() {
    return this.store.getState().usdPrices;
  }

  isMaxAgeExceeded(lastUpdated: number | undefined) {
    return Date.now() - new Date(lastUpdated ?? 0).getTime() > MAX_AGE;
  }

  async assetInfo(assetId: string | null) {
    const { assets } = this.store.getState();
    const network = this.getNetwork();

    if (assetId === '' || assetId == null || assetId.toUpperCase() === 'WAVES') {
      return assets[network].WAVES;
    }

    const API_BASE = this.getNode();
    const url = new URL(`assets/details/${assetId}`, API_BASE).toString();

    const asset = assets[network]?.[assetId];
    if (!asset || this.isMaxAgeExceeded(asset.lastUpdated)) {
      const resp = await fetch(url);
      switch (resp.status) {
        case 200: {
          const assetInfo = (await resp
            .text()
            .then((text) =>
              JSON.parse(text.replace(/(".+?"[ \t\n]*:[ \t\n]*)(\d{15,})/gm, '$1"$2"')),
            )) as AssetInfoResponseItem;

          assets[network] = assets[network] || {};
          assets[network][assetId] = {
            ...assets[network][assetId],
            ...this.toAssetDetails(assetInfo),
          };
          this.store.updateState({ assets });
          break;
        }
        case 400: {
          const error = await resp.json();
          throw new Error(`Could not find info for asset with id: ${assetId}. ${error.message}`);
        }
        default:
          throw new Error(await resp.text());
      }
    }

    const result = assets[network][assetId];
    if (!result) {
      throw new Error(`Asset ${assetId} not found after fetch`);
    }
    return result;
  }

  toAssetDetails(info: AssetInfoResponseItem) {
    const { assetTickers } = this.store.getState();

    return {
      description: info.description,
      displayName: assetTickers[info.assetId] || info.name,
      hasScript: info.scripted,
      height: info.issueHeight,
      id: info.assetId,
      issuer: info.issuer,
      lastUpdated: Date.now(),
      minSponsoredFee: info.minSponsoredAssetFee ?? undefined,
      name: info.name,
      originTransactionId: info.originTransactionId,
      precision: info.decimals,
      quantity: info.quantity,
      reissuable: info.reissuable,
      sender: info.issuer,
      ticker: assetTickers[info.assetId],
      timestamp: new Date(parseInt(info.issueTimestamp, 10)),
    };
  }

  async toggleAssetFavorite(assetId: string) {
    const { assets } = this.store.getState();
    const network = this.getNetwork();
    const asset = assets[network][assetId];

    if (!asset) {
      return;
    }

    asset.isFavorite = !asset.isFavorite;
    this.store.updateState({ assets });
  }

  async #fetchAssetsBatch(nodeUrl: string, assetIds: string[]) {
    const response = await fetch(new URL('assets/details', nodeUrl), {
      body: JSON.stringify({ ids: assetIds }),
      headers: {
        Accept: 'application/json;large-significand-format=string',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw response;
    }

    const assets: AssetInfoResponseItem[] = await response.json();

    return assets;
  }

  async updateAssets(
    assetIds: Array<string | null | undefined>,
    { ignoreCache }: { ignoreCache?: boolean } = {},
  ) {
    const { assets } = this.store.getState();
    const network = this.getNetwork();

    const assetIdsToFetch = Array.from(
      new Set(
        assetIds
          .filter(isNotNull)
          .filter((id) => id !== 'WAVES')
          .filter((assetId) => {
            const asset = assets[network][assetId];

            return ignoreCache ?? (!asset || this.isMaxAgeExceeded(asset.lastUpdated));
          }),
      ),
    );

    if (assetIdsToFetch.length === 0) {
      return;
    }

    const { maxAssetsPerRequest } = this.#remoteConfig.getAssetsConfig();

    for (let i = 0; i < assetIdsToFetch.length; i += maxAssetsPerRequest) {
      const assetInfos = await this.#fetchAssetsBatch(
        this.getNode(),
        assetIdsToFetch.slice(i, i + maxAssetsPerRequest),
      );

      assetInfos.forEach((assetInfo) => {
        assets[network][assetInfo.assetId] = {
          ...assets[network][assetInfo.assetId],
          ...this.toAssetDetails(assetInfo),
        };
      });

      this.store.updateState({ assets });
    }
  }

  async updateUsdPricesByAssetIds(assetIds: string[]) {
    const network = this.getNetwork();

    if (assetIds.length === 0 || network !== NetworkName.Mainnet) {
      return;
    }

    const { usdPrices } = this.store.getState();

    const response = await fetch(new URL('/api/v1/rates', DATA_SERVICE_URL), {
      body: JSON.stringify({ ids: assetIds }),
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Could not fetch rates [${response.status} ${response.statusText}]: ${error}`,
      );
    }

    const updatedUsdPrices: Record<string, string> = await response.json();

    this.store.updateState({
      usdPrices: {
        ...usdPrices,
        ...updatedUsdPrices,
      },
    });
  }

  async updateInfo() {
    const network = this.getNetwork();

    if (network === NetworkName.Mainnet) {
      const resp = await fetch(new URL('/api/v1/assets', DATA_SERVICE_URL));

      if (resp.ok) {
        const assets = (await resp.json()) as Array<{
          id: string;
          ticker: string;
          url: string;
        }>;

        this.store.updateState(
          assets.reduce(
            (acc, { id, ticker, url }) => ({
              assetLogos: {
                ...acc.assetLogos,
                [id]: url,
              },
              assetTickers: { ...acc.assetTickers, [id]: ticker },
            }),
            {} as {
              assetLogos: StorageLocalState['assetLogos'];
              assetTickers: StorageLocalState['assetTickers'];
            },
          ),
        );
      }
    }
  }

  async updateSwappableAssetIdsByVendor() {
    const resp = await fetch(new URL('/assets', SWAP_SERVICE_URL));
    if (resp.ok) {
      const swappableAssetIdsByVendor = (await resp.json()) as Record<string, string[]>;
      this.store.updateState({ swappableAssetIdsByVendor });
    }
  }
}
