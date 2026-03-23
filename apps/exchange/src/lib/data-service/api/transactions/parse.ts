import { BigNumber } from '@decentralchain/bignumber';
import { type Asset, AssetPair, Money } from '@decentralchain/data-entities';
import { DCC_ID, TRANSACTION_TYPE_NUMBER } from '@decentralchain/signature-adapter';
import { base58Decode } from '@decentralchain/ts-lib-crypto';
import { pipe } from 'ramda';
import { type IHash, type TOrderType } from '../../interface';
import { getSignatureApi } from '../../sign';
import {
  normalizeAssetId,
  normalizeAssetPair,
  normalizeRecipient,
  toHash,
  tokensMoneyFactory,
} from '../../utils/utils';
import { get } from '../assets/assets';
import { factory, type IFactory } from '../matcher/getOrders';
import {
  type IBurn,
  type ICancelLeasing,
  type ICreateAlias,
  type IData,
  type IExchange,
  type IExchangeOrder,
  type IIssue,
  type ILease,
  type IMassTransfer,
  type IReissue,
  type IScriptInvocation,
  type ISetAssetScript,
  type ISetScript,
  type ISponsorship,
  type ITransfer,
  type T_API_TX,
  type T_TX,
  type txApi,
} from './interface';

const SCRIPT_INVOCATION_NUMBER = 16;

const parseAttachment: (data: string | number) => Uint8Array = pipe(String, base58Decode);

const getFactory = (isTokens: boolean): IFactory => {
  if (isTokens) {
    return {
      money: tokensMoneyFactory,
      price: (price, pair) => Money.fromTokens(price, pair.priceAsset),
    };
  } else {
    return factory;
  }
};

export function parseTx(
  transactions: Array<T_API_TX>,
  isUTX: boolean,
  isTokens?: boolean,
): Promise<Array<T_TX>> {
  const hash = Object.create(null);
  hash[DCC_ID] = true;
  transactions.forEach((tx) => {
    getAssetsHashFromTx(tx, hash);
  });
  const api = getSignatureApi();

  return Promise.all([
    get(Object.keys(hash)).then((assets) => toHash(assets, 'id')),
    api?.getPublicKey() || Promise.resolve(null),
    api?.getSignVersions() || Promise.resolve({}),
  ]).then(([hash, sender, versions]) => {
    return transactions.map((transaction) => {
      if ('version' in transaction && versions[transaction.type] !== null) {
        const versionList = versions[transaction.type];
        const version = versionList.includes(transaction.version)
          ? transaction.version
          : versionList[versionList.lenght - 1];
        transaction.version = version;
      }

      switch (transaction.type) {
        case TRANSACTION_TYPE_NUMBER.SEND_OLD:
          return parseTransferTx(remapOldTransfer(transaction), hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.ISSUE:
          return parseIssueTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.TRANSFER:
          return parseTransferTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.REISSUE:
          return parseReissueTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.BURN:
          return parseBurnTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.EXCHANGE:
          return parseExchangeTx(transaction, hash, isUTX, isTokens, sender);
        case TRANSACTION_TYPE_NUMBER.LEASE:
          return parseLeasingTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.CANCEL_LEASING:
          return parseCancelLeasingTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.CREATE_ALIAS:
          return parseCreateAliasTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
          return parseMassTransferTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.DATA:
          return parseDataTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.SPONSORSHIP:
          return parseSponsorshipTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.SET_SCRIPT:
          return parseScriptTx(transaction, hash, isUTX);
        case TRANSACTION_TYPE_NUMBER.SET_ASSET_SCRIPT:
          return parseAssetScript(transaction, hash, isUTX);
        case SCRIPT_INVOCATION_NUMBER:
          return parseInvocationTx(transaction, hash, isUTX);
        default:
          return transaction;
      }
    });
  });
}

export function getAssetsHashFromTx(
  transaction: T_API_TX,
  hash = Object.create(null),
): IHash<boolean> {
  hash[DCC_ID] = true;
  switch (transaction.type) {
    case TRANSACTION_TYPE_NUMBER.REISSUE:
    case TRANSACTION_TYPE_NUMBER.BURN:
    case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
    case TRANSACTION_TYPE_NUMBER.SPONSORSHIP:
      hash[normalizeAssetId(transaction.assetId)] = true;
      break;
    case TRANSACTION_TYPE_NUMBER.TRANSFER:
      hash[normalizeAssetId(transaction.assetId)] = true;
      hash[normalizeAssetId(transaction.feeAssetId)] = true;
      break;
    case TRANSACTION_TYPE_NUMBER.EXCHANGE:
      hash[normalizeAssetId(transaction.order1.assetPair.amountAsset)] = true;
      hash[normalizeAssetId(transaction.order1.assetPair.priceAsset)] = true;
      hash[normalizeAssetId(transaction.order1.matcherFeeAssetId)] = true;
      hash[normalizeAssetId(transaction.order2.matcherFeeAssetId)] = true;
      break;
    case SCRIPT_INVOCATION_NUMBER:
      transaction.payment.forEach((payment) => {
        hash[normalizeAssetId(payment.assetId)] = true;
      });
      break;
  }
  return hash;
}

export function remapOldTransfer(tx: txApi.IOldTransferTx): txApi.ITransfer {
  const type = TRANSACTION_TYPE_NUMBER.TRANSFER;
  const assetId = DCC_ID;
  return { ...tx, assetId, attachment: '', feeAssetId: DCC_ID, type };
}

export function parseIssueTx(tx: txApi.IIssue, assetsHash: IHash<Asset>, isUTX: boolean): IIssue {
  const quantity = new BigNumber(tx.quantity);
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  return { ...tx, fee, isUTX, precision: tx.decimals, quantity } as IIssue;
}

export function parseTransferTx(
  tx: txApi.ITransfer,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): ITransfer {
  const attachment = parseAttachment(tx.attachment);
  const recipient = normalizeRecipient(tx.recipient);
  const amount = new Money(tx.amount, assetsHash[normalizeAssetId(tx.assetId)]);
  const fee = new Money(tx.fee, assetsHash[normalizeAssetId(tx.feeAssetId)]);
  const assetId = normalizeAssetId(tx.assetId);
  return { ...tx, amount, assetId, attachment, fee, isUTX, recipient };
}

export function parseReissueTx(
  tx: txApi.IReissue,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): IReissue {
  const quantity = new Money(tx.quantity, assetsHash[normalizeAssetId(tx.assetId)]);
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  return { ...tx, fee, isUTX, quantity };
}

export function parseBurnTx(tx: txApi.IBurn, assetsHash: IHash<Asset>, isUTX: boolean): IBurn {
  const amount = new Money(tx.amount, assetsHash[normalizeAssetId(tx.assetId)]);
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  return { ...tx, amount, fee, isUTX };
}

export function parseExchangeTx(
  tx: txApi.IExchange,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
  isTokens: boolean,
  sender: string,
): IExchange {
  const factory = getFactory(isTokens);
  const order1 = parseExchangeOrder(factory, tx.order1, assetsHash);
  const order2 = parseExchangeOrder(factory, tx.order2, assetsHash);

  const orderHash: IHash<IExchangeOrder> = {
    [order1.orderType]: order1,
    [order2.orderType]: order2,
  };
  const buyOrder = orderHash.buy;
  const sellOrder = orderHash.sell;
  const exchangeType = getExchangeType(order1, order2, sender);
  const { price, amount, total } = getExchangeTxMoneys(factory, tx, assetsHash);
  const buyMatcherFee = factory.money(tx.buyMatcherFee, buyOrder.matcherFee.asset);
  const sellMatcherFee = factory.money(tx.sellMatcherFee, sellOrder.matcherFee.asset);
  const fee = factory.money(tx.fee, assetsHash[DCC_ID]);
  return {
    ...tx,
    amount,
    buyMatcherFee,
    buyOrder,
    exchangeType,
    fee,
    isUTX,
    order1,
    order2,
    price,
    sellMatcherFee,
    sellOrder,
    total,
  };
}

export function parseScriptTx(
  tx: txApi.ISetScript,
  assetsHash: IHash<Asset>,
  isUTX?: boolean,
): ISetScript {
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  const script = tx.script || '';
  return { ...tx, fee, isUTX, script };
}

export function parseAssetScript(
  tx: txApi.ISetAssetScript,
  assetsHash: IHash<Asset>,
  isUTX?: boolean,
): ISetAssetScript {
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  const script = tx.script || '';
  return { ...tx, fee, isUTX, script };
}

export function getExchangeTxMoneys(
  factory: IFactory,
  tx: txApi.IExchange,
  assetsHash: IHash<Asset>,
) {
  const assetIdPair = normalizeAssetPair(tx.order2.assetPair);
  const pair = new AssetPair(
    assetsHash[assetIdPair.amountAsset],
    assetsHash[assetIdPair.priceAsset],
  );
  const price = factory.price(tx.price, pair);
  const amount = factory.money(tx.amount, pair.amountAsset);
  const total = Money.fromTokens(amount.getTokens().mul(price.getTokens()), price.asset);

  return { amount, price, total };
}

export function parseLeasingTx(tx: txApi.ILease, assetsHash: IHash<Asset>, isUTX: boolean): ILease {
  const amount = new Money(tx.amount, assetsHash[DCC_ID]);
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  const recipient = normalizeRecipient(tx.recipient);
  const isActive = tx.status === 'active';
  return { ...tx, amount, fee, isActive, isUTX, recipient };
}

export function parseCancelLeasingTx(
  tx: txApi.ICancelLeasing,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): ICancelLeasing {
  const lease = (tx.lease && parseLeasingTx(tx.lease, assetsHash, false)) || null;
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  return { ...tx, fee, isUTX, lease };
}

export function parseCreateAliasTx(
  tx: txApi.ICreateAlias,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): ICreateAlias {
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  return { ...tx, fee, isUTX };
}

export function parseMassTransferTx(
  tx: txApi.IMassTransfer,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): IMassTransfer {
  const attachment = parseAttachment(tx.attachment);
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  const asset = assetsHash[normalizeAssetId(tx.assetId)];

  const transfers = tx.transfers.map((transfer) => ({
    amount: new Money(transfer.amount, assetsHash[normalizeAssetId(tx.assetId)]),
    recipient: normalizeRecipient(transfer.recipient),
  }));

  const totalAmount = new Money(
    tx.totalAmount ||
      transfers.reduce((acc, item) => acc.add(item.amount), new Money(0, asset)).toCoins(),
    asset,
  );
  return { ...tx, attachment, fee, isUTX, totalAmount, transfers };
}

export function parseExchangeOrder(
  factory: IFactory,
  order: txApi.IExchangeOrder,
  assetsHash: IHash<Asset>,
): IExchangeOrder {
  const assetPair = normalizeAssetPair(order.assetPair);
  const pair = new AssetPair(assetsHash[assetPair.amountAsset], assetsHash[assetPair.priceAsset]);
  const price = factory.price(order.price, pair);
  const amount = factory.money(order.amount, assetsHash[assetPair.amountAsset]);
  const total = Money.fromTokens(amount.getTokens().mul(price.getTokens()), price.asset);
  const matcherFee = factory.money(
    order.matcherFee,
    assetsHash[normalizeAssetId(order.matcherFeeAssetId)],
  );
  return { ...order, amount, assetPair, matcherFee, price, total };
}

export function parseDataTx(tx: txApi.IData, assetsHash: IHash<Asset>, isUTX: boolean): IData {
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  const data = tx.data.map((dataItem) => {
    if (dataItem.type === 'integer') {
      return { ...dataItem, value: new BigNumber(dataItem.value) };
    } else {
      return dataItem;
    }
  });
  const txWithBigNumber = { ...tx, data };
  const stringifiedData = JSON.stringify(txWithBigNumber.data, null, 4);
  return { ...txWithBigNumber, fee, isUTX, stringifiedData };
}

export function parseInvocationTx(
  tx: txApi.IScriptInvocation,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): IScriptInvocation {
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);
  const dApp = normalizeRecipient(tx.dApp);
  const payment = tx.payment.map(
    (payment) => new Money(payment.amount, assetsHash[normalizeAssetId(payment.assetId)]),
  );
  return { ...tx, dApp, fee, isUTX, payment };
}

function parseSponsorshipTx(
  tx: txApi.ISponsorship,
  assetsHash: IHash<Asset>,
  isUTX: boolean,
): ISponsorship {
  const minSponsoredAssetFee = new Money(tx.minSponsoredAssetFee || 0, assetsHash[tx.assetId]);
  const fee = new Money(tx.fee, assetsHash[DCC_ID]);

  return { ...tx, fee, isUTX, minSponsoredAssetFee };
}

function getExchangeType(
  order1: IExchangeOrder,
  order2: IExchangeOrder,
  sender: string,
): TOrderType {
  if (isBothOwnedBy(order1, order2, sender) || isBothNotOwnedBy(order1, order2, sender)) {
    return order1.timestamp > order2.timestamp ? order1.orderType : order2.orderType;
  } else {
    return getMineOrder(order1, order2, sender).orderType;
  }
}

function getMineOrder(
  order1: IExchangeOrder,
  order2: IExchangeOrder,
  sender: string,
): IExchangeOrder {
  return order1.senderPublicKey === sender ? order1 : order2;
}

function isBothOwnedBy(order1: IExchangeOrder, order2: IExchangeOrder, sender: string) {
  return order1.senderPublicKey === sender && order2.senderPublicKey === sender;
}

function isBothNotOwnedBy(order1: IExchangeOrder, order2: IExchangeOrder, sender: string) {
  return order1.senderPublicKey !== sender && order2.senderPublicKey !== sender;
}
