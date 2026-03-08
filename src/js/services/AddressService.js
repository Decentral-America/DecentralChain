import { ethAddress2dcc } from '@decentralchain/node-api-js';
import groupBy from 'lodash/groupBy';
import config from '../configuration/config.mainnet';
import Alias from '../shared/Alias';
import Currency from '../shared/Currency';
import Money from '../shared/Money';
import { getNetworkByte } from '../shared/utils';
import { ApiClientService } from './ApiClientService';

export class AddressService extends ApiClientService {
  constructor(transactionTransformerService, currencyService, configurationService, networkId) {
    super(configurationService, networkId);

    this.transformer = transactionTransformerService;
    this.currencyService = currencyService;
  }

  loadBalance = async (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));
    return this.getApi()
      .addresses.details(address)
      .then((data) => {
        return {
          regular: Money.fromCoins(data.regular, Currency.DCC).toString(),
          generating: Money.fromCoins(data.generating, Currency.DCC).toString(),
          available: Money.fromCoins(data.available, Currency.DCC).toString(),
          effective: Money.fromCoins(data.effective, Currency.DCC).toString(),
        };
      });
  };

  loadTransactions = (address, limit, after) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));

    return this.getApi()
      .transactions.address(address, limit, after)
      .then((transactionsResponse) => {
        return this.transformer.transform(transactionsResponse);
      });
  };

  loadRawAliases = (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));
    return this.getApi().addresses.aliases(address);
  };

  transformAndGroupAliases = (rawAliases) => {
    const lines = rawAliases.map((item) => Alias.fromString(item).alias);
    const grouped = groupBy(lines, (item) => item.toUpperCase().charAt(0));
    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        letter,
        aliases: grouped[letter].sort(),
      }));
  };

  loadAliases = (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));

    return this.loadRawAliases(address).then((rawAliases) =>
      this.transformAndGroupAliases(rawAliases),
    );
  };

  loadAssets = async (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));

    const api = this.getApi().assets;
    const balanceResponse = await api.balance(address);
    const detailsArray = await api.detailsMultiple(
      balanceResponse.balances.map(({ assetId }) => assetId),
    );
    const details = Object.fromEntries(detailsArray.map((val) => [val.assetId, val]));
    return balanceResponse.balances.map((item) => {
      const currency = new Currency({
        id: details[item.assetId].originTransactionId,
        displayName: details[item.assetId].name,
        precision: details[item.assetId].decimals,
      });

      this.currencyService.put(currency);

      const amount = Money.fromCoins(item.balance, currency);

      return {
        id: item.assetId,
        name: currency.toString(),
        amount: amount.formatAmount(),
      };
    });
  };

  loadNftTokens = async (address, limit, after) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));

    const balanceResponse = await this.getApi().assets.nft(address, limit, after);
    return balanceResponse.map((item) => {
      return {
        id: item.id || item.assetId,
        name: item.name,
      };
    });
  };

  loadData = (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));
    return this.getApi().addresses.data(address);
  };

  loadScript = (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));
    return this.getApi().addresses.scriptInfo(address);
  };

  loadScriptMeta = (address) => {
    if (address.startsWith('0x') && address.length === 42)
      address = ethAddress2dcc(address, getNetworkByte(this.networkId));

    return this.getApi().addresses.scriptMeta(address);
  };

  loadDApps = () => {
    return fetch(config.dappsUrl, { signal: AbortSignal.timeout(30_000) })
      .then((resp) => {
        if (!resp.ok) throw new Error(`Failed to load dApps: ${resp.status}`);
        return resp.json();
      })
      .catch(() => []);
  };
  validate = (address) => {
    return this.getApi()
      .addresses.validate(address)
      .then((validateResponse) => validateResponse.valid);
  };
}
