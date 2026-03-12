import { BigNumber } from '@decentralchain/bignumber';
import { Money } from '@decentralchain/data-entities';
import { libs } from '@decentralchain/transactions';

const { stringToBytes, base58Decode, keccak, blake2b } = libs.crypto;

const TRANSFERS = {
  ATTACHMENT: 140,
};

const ALIAS = {
  AVAILABLE_CHARS: '-.0123456789@_abcdefghijklmnopqrstuvwxyz',
  MAX_ALIAS_LENGTH: 30,
  MIN_ALIAS_LENGTH: 4,
};

const ADDRESS = {
  MAX_ADDRESS_LENGTH: 45,
};

const ASSETS = {
  NAME_MIN_BYTES: 4,
  NAME_MAX_BYTES: 16,
  DESCRIPTION_MAX_BYTES: 1000,
};

export const ERROR_MSG = {
  REQUIRED: 'field is required',
  WRONG_TYPE: 'field is wrong type',
  WRONG_NUMBER: 'field is not number',
  WRONG_TIMESTAMP: 'field is not timestamp',
  SMALL_FIELD: 'field is small',
  LARGE_FIELD: 'field is large',
  WRONG_SYMBOLS: 'field has wrong symbols',
  WRONG_ADDRESS: 'field is wrong address',
  WRONG_BOOLEAN: 'field is wrong boolean',
  WRONG_ASSET_ID: 'field is wrong assetId',
  WRONG_ORDER_TYPE: 'field is wrong order type. Field can be "buy" or "sell"',
  NOT_HTTPS_URL: 'field can be url with https protocol',
  BASE64: 'field can be base64 string with prefix "base64:"',
  EMPTY_BASE64: 'field can be not empty base64"',
  BASE58: 'field can be base58 string',
  PUB_KEY: 'field can be base58 publicKey',
  NULL_VALUE: 'field is not null',
};

export const isValidAddress = (address: string, networkByte: number) => {
  if (!address || typeof address !== 'string') {
    throw new Error('Missing or invalid address');
  }

  const addressBytes = base58Decode(address);

  if (addressBytes[0] !== 1 || addressBytes[1] !== networkByte) {
    return false;
  }

  const key = addressBytes.slice(0, 22);
  const check = addressBytes.slice(22, 26);
  const keyHash = keccak(blake2b(key)).slice(0, 4);

  for (let i = 0; i < 4; i++) {
    if (check[i] !== keyHash[i]) {
      return false;
    }
  }
  return true;
};

const isBase64 = (value: string): boolean => {
  if (value === '') {
    return true;
  }
  const regExp = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
  return regExp.test(value);
};

const getBytesFromString = (value: string) => {
  return stringToBytes(value);
};

const numberToString = (num: unknown) => (num && typeof num === 'number' ? num.toString() : num);

const error = ({ value, ...options }: IFieldOptions, message: unknown): never => {
  const { name: field, type } = options;
  throw { value, field, type, message };
};

const required = (options: IFieldOptions) => {
  const { value, optional } = options;

  if (!optional && value == null) {
    error(options, ERROR_MSG.REQUIRED);
  }
};

const string = (options: IFieldOptions) => {
  options = { ...options, value: numberToString(options.value) };
  required(options);
  const { value, optional } = options;

  if (!optional && value != null && typeof value !== 'string') {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }
};

const attachment = (options: IFieldOptions) => {
  const { value } = options;

  if (value == null) {
    return;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    string(options);

    if (typeof value !== 'string') {
      return error(options, ERROR_MSG.WRONG_TYPE);
    }
    if (getBytesFromString(value).length > TRANSFERS.ATTACHMENT) {
      return error(options, ERROR_MSG.LARGE_FIELD);
    }

    return;
  }

  if (typeof value === 'object' && value !== null) {
    const sized = value as { length: number };

    if (typeof sized.length !== 'number' || sized.length < 0) {
      return error(options, ERROR_MSG.WRONG_TYPE);
    }
    if (sized.length > TRANSFERS.ATTACHMENT) {
      return error(options, ERROR_MSG.LARGE_FIELD);
    }

    return;
  }

  error(options, ERROR_MSG.WRONG_TYPE);
};

const number = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (value != null && new BigNumber(value as string | number).isNaN()) {
    return error(options, ERROR_MSG.WRONG_NUMBER);
  }
};

const boolean = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (value != null && typeof value !== 'boolean') {
    return error(options, ERROR_MSG.WRONG_BOOLEAN);
  }
};

const money = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (value == null) {
    return;
  }

  switch (true) {
    case !(value instanceof Money):
      return error(options, ERROR_MSG.WRONG_TYPE);
    case value instanceof Money && value.getCoins().isNaN():
      return error(options, ERROR_MSG.WRONG_NUMBER);
  }
};

const numberLike = (options: IFieldOptions, min?: string | number, max?: string | number) => {
  required(options);
  const { value } = options;

  if (value == null) {
    return;
  }

  const checkInterval = (bigNumber: BigNumber) => {
    if (min != null) {
      if (bigNumber.lt(new BigNumber(min))) {
        error(options, ERROR_MSG.SMALL_FIELD);
      }
    }

    if (max != null) {
      if (bigNumber.gt(new BigNumber(max))) {
        error(options, ERROR_MSG.LARGE_FIELD);
      }
    }
  };

  switch (true) {
    case value instanceof BigNumber:
      if (value.isNaN()) {
        error(options, ERROR_MSG.WRONG_TYPE);
      }
      checkInterval(value);
      break;
    case value instanceof Money: {
      const coins = value.getCoins();

      if (coins.isNaN()) {
        error(options, ERROR_MSG.WRONG_NUMBER);
      }
      checkInterval(coins);
      break;
    }
    case typeof value === 'string' && !value:
      error(options, ERROR_MSG.WRONG_NUMBER);
      break;
    case new BigNumber(value as string | number).isNaN():
      return error(options, ERROR_MSG.WRONG_NUMBER);
    default:
      checkInterval(new BigNumber(value as string | number));
  }
};

const isNull = (options: IFieldOptions) => {
  if (options.value !== null) {
    error(options, ERROR_MSG.NULL_VALUE);
  }
};

const aliasName = (options: IFieldOptions) => {
  options = { ...options, value: numberToString(options.value) };
  required(options);
  const { value } = options;

  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }

  if (value.length < ALIAS.MIN_ALIAS_LENGTH) {
    return error(options, ERROR_MSG.SMALL_FIELD);
  }
  if (value.length > ALIAS.MAX_ALIAS_LENGTH) {
    return error(options, ERROR_MSG.LARGE_FIELD);
  }
  if (!value.split('').every((char: string) => ALIAS.AVAILABLE_CHARS.includes(char))) {
    return error(options, ERROR_MSG.WRONG_SYMBOLS);
  }
};

const address = (options: IFieldOptions) => {
  options = { ...options, value: numberToString(options.value) };
  required(options);
  const { value } = options;
  const validateAddress = (address: string) => {
    try {
      return isValidAddress(address, options.optionalData as number);
    } catch {
      return false;
    }
  };

  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }

  if (value.length <= ALIAS.MAX_ALIAS_LENGTH) {
    return error(options, ERROR_MSG.SMALL_FIELD);
  }
  if (value.length > ADDRESS.MAX_ADDRESS_LENGTH) {
    return error(options, ERROR_MSG.LARGE_FIELD);
  }
  if (!validateAddress(value)) {
    return error(options, ERROR_MSG.WRONG_ADDRESS);
  }
};

const aliasOrAddress = (options: IFieldOptions) => {
  try {
    aliasName(options);
  } catch {
    address(options);
  }
};

const assetId = (options: IFieldOptions) => {
  options = { ...options, value: numberToString(options.value) };
  required(options);
  const { value } = options;

  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }

  let isAssetId = false;

  try {
    isAssetId = base58Decode(value.trim()).length === 32;
  } catch {
    // isAssetId remains false
  }

  if (!isAssetId && value !== 'DCC') {
    return error(options, ERROR_MSG.WRONG_ASSET_ID);
  }
};

const timestamp = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (
    Number.isNaN(value as number) ||
    (value && !(value instanceof Date || typeof value === 'number' || +(value as string | number)))
  ) {
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
      return error(options, ERROR_MSG.WRONG_TIMESTAMP);
    }
  }
};

const orderType = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }

  if (value !== 'sell' && value !== 'buy') {
    return error(options, ERROR_MSG.WRONG_ORDER_TYPE);
  }
};

const assetName = (options: IFieldOptions) => {
  options = { ...options, value: numberToString(options.value) };
  required(options);
  const { value } = options;

  if (value != null) {
    if (typeof value !== 'string') {
      return error(options, ERROR_MSG.WRONG_TYPE);
    }

    const bytesLength = getBytesFromString(value).length;

    if (bytesLength < ASSETS.NAME_MIN_BYTES) {
      error(options, ERROR_MSG.SMALL_FIELD);
    }

    if (bytesLength > ASSETS.NAME_MAX_BYTES) {
      error(options, ERROR_MSG.LARGE_FIELD);
    }
  }
};

const assetDescription = (options: IFieldOptions) => {
  options = { ...options, value: numberToString(options.value) };
  required(options);
  const { value } = options;

  if (value != null) {
    if (typeof value !== 'string') {
      return error(options, ERROR_MSG.WRONG_TYPE);
    }

    const bytesLength = getBytesFromString(value).length;
    if (bytesLength > ASSETS.DESCRIPTION_MAX_BYTES) {
      error(options, ERROR_MSG.LARGE_FIELD);
    }
  }
};

const precision = (options: IFieldOptions) => {
  required(options);
  numberLike(options, 0, 8);
};

const httpsUrl = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  const isNotUrl = (url: string) => {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  };

  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }
  if (value.indexOf('https://') === -1) {
    return error(options, ERROR_MSG.NOT_HTTPS_URL);
  }
  if (isNotUrl(value)) {
    return error(options, ERROR_MSG.NOT_HTTPS_URL);
  }
};

const transfers = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (!Array.isArray(value)) {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }

  if (!options.optional && value.length === 0) {
    error(options, ERROR_MSG.REQUIRED);
  }

  const items = value as Array<{ recipient?: string; amount?: unknown; name?: string }>;
  const errors = items
    .map(({ recipient, amount, name }, index) => {
      const dataErrors: unknown[] = [];

      try {
        numberLike({
          ...options,
          value: amount,
          name: `${options.name}:${index}:amount`,
          optional: false,
        });
      } catch (e) {
        dataErrors.push(e);
      }

      try {
        aliasOrAddress({
          ...options,
          value: recipient || name,
          name: `${options.name}:${index}:recipient`,
          optional: false,
        });
      } catch (e) {
        dataErrors.push(e);
      }

      return dataErrors;
    })
    .filter((item: unknown[]) => item.length);

  if (errors.length) {
    error(options, errors);
  }
};

const data = (options: IFieldOptions, noKey?: boolean, isArgs?: boolean) => {
  required(options);
  const { value } = options;
  if (!Array.isArray(value)) {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }
  const entries = value as Array<{ key?: string; type?: string; value?: unknown }>;
  const errors = entries
    .map(({ key, type, value }, index) => {
      if (!noKey) {
        try {
          string({
            ...options,
            value: key,
            name: `${options.name}:${index}:key`,
            optional: false,
          });
        } catch (e) {
          return e;
        }
      }
      const itemOptions = {
        ...options,
        name: `${options.name}:${index}:value`,
        optional: false,
        value,
      };

      try {
        switch (type) {
          case 'integer':
            numberLike(itemOptions);
            break;
          case 'boolean':
            boolean(itemOptions);
            break;
          case 'binary':
            binary(itemOptions);
            break;
          case 'string':
            string(itemOptions);
            break;
          case undefined:
            isNull(itemOptions);
            break;
          case 'list':
            if (isArgs) {
              const listValues = {
                ...itemOptions,
                name: `${itemOptions.name}:list`,
                value: itemOptions.value,
              };

              if (listValues.value) {
                data(listValues, true);
                break;
              }
            }
            break;
          default:
            error(
              { ...options, value: key, name: `${options.name}:${index}:type` },
              ERROR_MSG.WRONG_TYPE,
            );
        }
      } catch (e) {
        return e;
      }
      return undefined;
    })
    .filter((item: unknown) => item);

  if (errors.length) {
    error(options, errors);
  }
};

const binary = (options: IFieldOptions) => {
  const value = (options.value ?? '') as string;

  if (value && !value.includes('base64:')) {
    error(options, ERROR_MSG.BASE64);
  }

  if (value && !isBase64(value.replace('base64:', ''))) {
    error(options, ERROR_MSG.BASE64);
  }
};

const publicKey = (options: IFieldOptions) => {
  required(options);

  const { value = '' } = options;

  if (!value || typeof value !== 'string') {
    return error(options, ERROR_MSG.PUB_KEY);
  }
  let pk: Uint8Array | undefined;
  try {
    pk = base58Decode(value);
  } catch {
    error(options, ERROR_MSG.BASE58);
  }

  if (pk?.length === 32) {
    return void 0;
  }

  error(options, ERROR_MSG.PUB_KEY);
};

const script = (options: IFieldOptions) => {
  binary(options);
};

const asset_script = (options: IFieldOptions) => {
  const { value } = options;

  if (typeof value !== 'string' || !value.replace('base64:', '')) {
    error(options, ERROR_MSG.EMPTY_BASE64);
  }

  script(options);
};

const call = (options: IFieldOptions) => {
  required(options);
  const { value } = options;
  if (value == null) {
    return;
  }

  if (!value || typeof value !== 'object') {
    error(options, ERROR_MSG.WRONG_TYPE);
  }

  const callData = value as { function?: string; args?: unknown[] };

  const functionValue = {
    key: 'call.function',
    value: callData.function,
    optional: false,
    type: 'string',
    name: 'function',
  };

  string(functionValue);

  if (callData.function === '') {
    error(functionValue, ERROR_MSG.REQUIRED);
  }

  const argsValue = {
    key: 'call.args',
    value: callData.args,
    optional: true,
    type: 'args',
    name: 'args',
  };

  if (argsValue.value) {
    data(argsValue, true, true);
  }
};

const payment = (options: IFieldOptions) => {
  required(options);
  const { value } = options;

  if (!Array.isArray(value)) {
    return error(options, ERROR_MSG.WRONG_TYPE);
  }

  const errors = value
    .map((amount: unknown, index: number) => {
      const dataErrors: unknown[] = [];

      try {
        money({ ...options, value: amount, name: `${options.name}:${index}`, optional: false });
      } catch (e) {
        dataErrors.push(e);
      }

      return dataErrors;
    })
    .filter((item: unknown[]) => item.length);

  if (errors.length) {
    error(options, errors);
  }
};

export const VALIDATORS = {
  string,
  number,
  required,
  numberLike,
  money,
  aliasName,
  address,
  boolean,
  assetId,
  timestamp,
  orderType,
  assetName,
  assetDescription,
  httpsUrl,
  attachment,
  transfers,
  aliasOrAddress,
  data,
  script,
  asset_script,
  binary,
  precision,
  call,
  payment,
  publicKey,
};

interface IFieldOptions {
  key: string;
  value: unknown;
  optional: boolean;
  type: string;
  name: string;
  optionalData?: number;
}
