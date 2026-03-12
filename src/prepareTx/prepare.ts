import { BigNumber } from '@decentralchain/bignumber';
import { AssetPair, type Money, OrderPrice } from '@decentralchain/data-entities';
import { libs } from '@decentralchain/transactions';
import { VALIDATORS } from './fieldValidator';

export const DCC_ID = 'DCC';
const { stringToBytes, base58Encode } = libs.crypto;

const normalizeAssetId = (id: string) => (id === DCC_ID ? '' : id);

interface ICall {
  function: string;
  args?: unknown[];
}

export interface IWrappedFunction {
  from: string | string[] | null;
  to: string;
  cb: (...args: unknown[]) => unknown;
}

function _callFunc(callData?: ICall | null): ICall | null {
  if (!callData) {
    return null;
  }

  return {
    function: callData?.function || '',
    args: callData?.args || [],
  };
}

function _payments(payments: Money[]) {
  return (payments || []).map((pay) => {
    return {
      amount: _toBigNumber(pay).toString(),
      assetId: _moneyToNodeAssetId(pay),
    };
  });
}

function _paymentsToNode(payments: Money[]) {
  return (payments || []).map((pay) => {
    return {
      amount: _toBigNumber(pay),
      assetId: _moneyToNodeAssetId(pay) || null,
    };
  });
}

function _scriptProcessor(code: string): string | null {
  return (code || '').replace('base64:', '') ? code : null;
}

function _assetPair(data: Record<string, unknown>) {
  const amount = data.amount as { asset: { id: string } };
  const price = data.price as { asset: { id: string } };
  return {
    amountAsset: normalizeAssetId(amount.asset.id),
    priceAsset: normalizeAssetId(price.asset.id),
  };
}

function _signatureFromProof(proofs: string[]) {
  return proofs[0];
}

function _toBigNumber(some: string | number | BigNumber | Money): BigNumber {
  switch (typeof some) {
    case 'string':
    case 'number':
      return new BigNumber(some as string);
    case 'object':
      if (some instanceof BigNumber) {
        return some;
      } else {
        return some.getCoins();
      }
  }
}

function _toNumberString(some: string | number | BigNumber | Money) {
  return _toBigNumber(some).toString();
}

function _toSponsorshipFee(money: Money): BigNumber {
  const coins = money.getCoins();
  if (coins.eq(0)) {
    //@ts-expect-error
    return null;
  } else {
    return coins;
  }
}

function _moneyToAssetId(money: Money): string {
  return money.asset.id;
}

function _moneyToNodeAssetId(money: Money): string {
  return _idToNode(money.asset.id);
}

function _timestamp(time: string | number | Date): string | number | Date {
  if (!+time && typeof time === 'string') {
    return Date.parse(time);
  }
  return time && time instanceof Date ? time.getTime() : time;
}

function _orString(data: unknown): string {
  return (data as string) || '';
}

function _noProcess<T>(data: T): T {
  return data;
}

const _recipient = (networkByte: string) => (data: string) => {
  return data.length <= 30 ? `alias:${networkByte}:${data}` : data;
};

function _attachment(data: string | number[] | Uint8Array) {
  data = data || '';
  let value = data;

  if (typeof data === 'string') {
    value = stringToBytes(data);
  }

  return base58Encode(Uint8Array.from(value as ArrayLike<number>));
}

function _addValue(value: unknown) {
  return typeof value === 'function' ? value : () => value;
}

function _expiration(date?: number) {
  return date || new Date().setDate(new Date().getDate() + 20);
}

function _transfers<A, R>(recipient: (r: string) => string, amount: (a: A) => R) {
  return (transfers: Array<{ recipient: string; amount: A }>) =>
    transfers.map((transfer) => ({
      recipient: recipient(transfer.recipient),
      amount: amount(transfer.amount),
    }));
}

function _quantity(data: { quantity: string | number; precision: number }): BigNumber {
  return new BigNumber(data.quantity).mul(new BigNumber(10).pow(data.precision));
}

function _base64(str: string): string {
  return (str || '').replace('base64:', '');
}

function _toOrderPrice(order: Record<string, unknown>) {
  const amount = order.amount as Money;
  const price = order.price as Money;
  const assetPair = new AssetPair(amount.asset, price.asset);
  const orderPrice = OrderPrice.fromTokens(price.toTokens(), assetPair);
  return orderPrice.getMatcherCoins();
}

const _processors = {
  callFunc: _callFunc,
  payments: _payments,
  paymentsToNode: _paymentsToNode,
  scriptProcessor: _scriptProcessor,
  assetPair: _assetPair,
  signatureFromProof: _signatureFromProof,
  toBigNumber: _toBigNumber,
  toNumberString: _toNumberString,
  toSponsorshipFee: _toSponsorshipFee,
  moneyToAssetId: _moneyToAssetId,
  moneyToNodeAssetId: _moneyToNodeAssetId,
  timestamp: _timestamp,
  orString: _orString,
  noProcess: _noProcess,
  recipient: _recipient,
  attachment: _attachment,
  addValue: _addValue,
  expiration: _expiration,
  transfers: _transfers,
  quantity: _quantity,
  base64: _base64,
  toOrderPrice: _toOrderPrice,
};

function _wrap(from: string | string[] | null, to: string | null, cb: unknown): IWrappedFunction {
  const resolvedTo = to ?? (typeof from === 'string' ? from : '');
  if (typeof cb !== 'function') {
    return { from, to: resolvedTo, cb: () => cb };
  }
  return { from, to: resolvedTo, cb: cb as (...args: unknown[]) => unknown };
}

const _findValue = (fromKey: string | string[], data: Record<string, unknown>) => {
  if (!Array.isArray(fromKey)) {
    return data[fromKey];
  }
  return data[(fromKey.find((key) => data[key]) ?? fromKey[0]) as string];
};

function _schema(...args: (IWrappedFunction | string)[]) {
  return (data: Record<string, unknown>) =>
    args
      .map((item) => {
        return typeof item === 'string'
          ? {
              key: item,
              value: _noProcess(data[item]),
            }
          : {
              key: item.to,
              value: item.cb(typeof item.from === 'string' ? data[item.from] : data),
            };
      })
      .reduce((result, item) => {
        result[item.key] = item.value;
        return result;
      }, Object.create(null));
}

function _signSchema(
  args: {
    name: string | string[] | null;
    field: string | null;
    processor: unknown;
    optional: boolean;
    type: string;
    optionalData: unknown;
  }[],
) {
  return (data: Record<string, unknown>, validate = false) => {
    const errors: unknown[] = [];
    const prepareData = args
      .map((item) => {
        const wrapped = _wrap(item.name, item.field, item.processor || _noProcess);
        const value = wrapped.from ? _findValue(wrapped.from, data) : data;

        const validateOptions = {
          key: wrapped.to,
          value: value,
          optional: item.optional,
          optionalData: item.optionalData,
          type: item.type,
          name: item.name,
        };
        const validator = (
          VALIDATORS as Record<string, ((...args: unknown[]) => void) | undefined>
        )[validateOptions.type];
        try {
          if (validate && validator) {
            validator(validateOptions);
          }
          return {
            key: validateOptions.key,
            value: wrapped.cb(validateOptions.value),
          };
        } catch (e) {
          errors.push(e);
        }

        return {
          key: validateOptions.key,
          value: null,
        };
      })
      .reduce((result, { key, value }) => {
        result[key] = value;
        return result;
      }, Object.create(null));

    if (errors.length) {
      throw new Error(JSON.stringify(errors));
    }

    return prepareData;
  };
}

function _idToNode(id: string): string {
  return id === DCC_ID ? '' : id;
}

export const prepare = {
  processors: _processors,
  wrap: _wrap,
  schema: _schema,
  signSchema: _signSchema,
  idToNode: _idToNode,
};
