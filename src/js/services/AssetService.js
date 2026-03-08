import Currency from '../shared/Currency';
import DateTime from '../shared/DateTime';
import Money from '../shared/Money';
import { ApiClientService } from './ApiClientService';

export class AssetService extends ApiClientService {
  async loadAssetDetails(assetId) {
    return this.getApi()
      .assets.details(assetId)
      .then((data) => {
        const currency = Currency.fromAssetDetails(data);

        return {
          id: data.assetId,
          issued: {
            height: data.issueHeight,
            timestamp: new DateTime(data.issueTimestamp),
          },
          issuer: data.issuer,
          name: data.name,
          description: data.description,
          decimals: data.decimals,
          reissuable: data.reissuable,
          quantity: Money.fromCoins(data.quantity, currency),
          scripted: data.scripted,
          scriptDetails: data.scripted ? data.scriptDetails : null,
          minSponsoredFee: data.minSponsoredAssetFee
            ? Money.fromCoins(data.minSponsoredAssetFee, currency)
            : null,
          originTransactionId: data.originTransactionId,
        };
      });
  }

  async loadAssetsDetails(assetsId) {
    const dataArray = await this.getApi().assets.detailsMultiple(assetsId);
    return dataArray.map((data) => {
      const currency = Currency.fromAssetDetails(data);
      return {
        id: data.assetId,
        issued: {
          height: data.issueHeight,
          timestamp: new DateTime(data.issueTimestamp),
        },
        issuer: data.issuer,
        name: data.name,
        description: data.description,
        decimals: data.decimals,
        reissuable: data.reissuable,
        quantity: Money.fromCoins(data.quantity, currency),
        scripted: data.scripted,
        scriptDetails: data.scripted ? data.scriptDetails : null,
        minSponsoredFee: data.minSponsoredAssetFee
          ? Money.fromCoins(data.minSponsoredAssetFee, currency)
          : null,
        originTransactionId: data.originTransactionId,
      };
    });
  }

  async loadDetails(assetId) {
    return Array.isArray(assetId)
      ? await this.loadAssetsDetails(assetId)
      : await this.loadAssetDetails(assetId);
  }

  async convertEth2Dcc(assetId) {
    return this.getApi()
      .assets.convertEth2Dcc(assetId)
      .then((resp) => resp[0].assetId);
  }
}
