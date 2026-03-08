import { TRANSACTION_TYPE, type TransactionType } from '@decentralchain/ts-types';
import { type SignerOptions } from './types/index.js';
import {
  isArray,
  isAssetId,
  isAttachment,
  isBase64,
  isBoolean,
  isNonNegativeAmount,
  isNumber,
  isPositiveAmount,
  isPublicKey,
  isRecipient,
  isRequired,
  isString,
  isValidAliasName,
  isValidAssetDescription,
  isValidAssetName,
  isValidData,
  noop,
  orderValidator,
  orEq,
  validateBySchema,
  validatePipe,
} from './validators.js';

const shouldValidate = (value: unknown): boolean => value !== undefined;

const validateOptional = (validator: (value: unknown) => boolean) => (value: unknown) =>
  shouldValidate(value) ? validator(value) : true;

type ValidatorFn = (
  scheme: Record<string, (value: unknown) => boolean>,
  method: string,
) => (args: Record<string, unknown>) => {
  isValid: boolean;
  transaction: unknown;
  method: string;
  invalidFields?: string[];
};

/**
 * Validates a transaction against a schema and collects individual field errors.
 */
export const validator: ValidatorFn = (scheme, method) => (transaction) => {
  const invalidFields: string[] = [];

  for (const [fieldName, validationScheme] of Object.entries(scheme)) {
    try {
      validateBySchema({ [fieldName]: validationScheme }, noop)(transaction);
    } catch {
      invalidFields.push(fieldName);
    }
  }

  return {
    isValid: invalidFields.length === 0,
    transaction,
    method,
    invalidFields,
  };
};

const getCommonValidators = (transactionType: TransactionType) => ({
  type: (value: unknown) => value === transactionType,
  version: validateOptional(orEq([undefined, 1, 2, 3])),
  senderPublicKey: validateOptional(isPublicKey),
  fee: validateOptional(isNonNegativeAmount),
  proofs: validateOptional(isArray),
});

export const issueArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.ISSUE),
  name: isValidAssetName,
  description: validateOptional(isValidAssetDescription),
  quantity: isPositiveAmount,
  decimals: isNumber,
  reissuable: validateOptional(isBoolean),
  script: validateOptional(isBase64),
  chainId: validateOptional(isNumber),
};
export const issueArgsValidator = validator(issueArgsScheme, 'issue');

export const transferArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.TRANSFER),
  amount: isPositiveAmount,
  recipient: isRecipient,
  assetId: validateOptional(isAssetId),
  feeAssetId: validateOptional(isAssetId),
  attachment: validateOptional(isAttachment),
};
export const transferArgsValidator = validator(transferArgsScheme, 'transfer');

export const reissueArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.REISSUE),
  assetId: isAssetId,
  quantity: isPositiveAmount,
  reissuable: isBoolean,
  chainId: validateOptional(isNumber),
};
export const reissueArgsValidator = validator(reissueArgsScheme, 'reissue');

export const burnArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.BURN),
  assetId: isString,
  amount: isPositiveAmount,
  chainId: validateOptional(isNumber),
};
export const burnArgsValidator = validator(burnArgsScheme, 'burn');

export const leaseArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.LEASE),
  amount: isPositiveAmount,
  recipient: isRecipient,
};
export const leaseArgsValidator = validator(leaseArgsScheme, 'lease');

export const cancelLeaseArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.CANCEL_LEASE),
  leaseId: isString,
  chainId: validateOptional(isNumber),
};
export const cancelLeaseArgsValidator = validator(cancelLeaseArgsScheme, 'cancel lease');

export const aliasArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.ALIAS),
  alias: (value: unknown) => (typeof value === 'string' ? isValidAliasName(value) : false),
};
export const aliasArgsValidator = validator(aliasArgsScheme, 'alias');

export const massTransferArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.MASS_TRANSFER),
  transfers: validatePipe(
    isArray,
    (data) => {
      const arr = data as unknown[];
      return arr.length > 0 && arr.length <= 100;
    },
    (data) =>
      (data as Array<Record<string, unknown>>).every(
        (item) => item != null && isRecipient(item.recipient) && isPositiveAmount(item.amount),
      ),
  ),
  assetId: validateOptional(isAssetId),
  attachment: validateOptional(isAttachment),
};
export const massTransferArgsValidator = validator(massTransferArgsScheme, 'mass transfer');

export const dataArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.DATA),
  data: (data: unknown) => isArray(data) && (data as unknown[]).every((item) => isValidData(item)),
};
export const dataArgsValidator = validator(dataArgsScheme, 'data');

export const setScriptArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.SET_SCRIPT),
  script: isBase64,
  chainId: validateOptional(isNumber),
};
export const setScriptArgsValidator = validator(setScriptArgsScheme, 'set script');

export const sponsorshipArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.SPONSORSHIP),
  assetId: isString,
  minSponsoredAssetFee: (value: unknown) => value === null || isNonNegativeAmount(value),
};
export const sponsorshipArgsValidator = validator(sponsorshipArgsScheme, 'sponsorship');

export const exchangeArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.EXCHANGE),
  order1: validatePipe(isRequired(true), orderValidator),
  order2: validatePipe(isRequired(true), orderValidator),
  amount: isPositiveAmount,
  price: isPositiveAmount,
  buyMatcherFee: isNonNegativeAmount,
  sellMatcherFee: isNonNegativeAmount,
};
export const exchangeArgsValidator = validator(exchangeArgsScheme, 'exchange');

export const setAssetScriptArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.SET_ASSET_SCRIPT),
  script: isBase64,
  assetId: isAssetId,
  chainId: validateOptional(isNumber),
};
export const setAssetScriptArgsValidator = validator(setAssetScriptArgsScheme, 'set asset script');

export const invokeArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.INVOKE_SCRIPT),
  dApp: isRecipient,
  call: validateOptional(
    validatePipe(
      (v) => isString((v as Record<string, unknown>)?.function),
      (v) => ((v as Record<string, unknown>)?.function as string)?.length >= 0,
      (v) => isArray((v as Record<string, unknown>)?.args),
    ),
  ),
  payment: validateOptional(
    validatePipe(isArray, (data) =>
      (data as Array<Record<string, unknown>>).every(
        (item) => isPositiveAmount(item.amount) && isAssetId(item.assetId),
      ),
    ),
  ),
  feeAssetId: validateOptional(isAssetId),
  chainId: validateOptional(isNumber),
};
export const invokeArgsValidator = validator(invokeArgsScheme, 'invoke');

export const argsValidators: Record<number, ReturnType<typeof validator>> = {
  [TRANSACTION_TYPE.ISSUE]: issueArgsValidator,
  [TRANSACTION_TYPE.TRANSFER]: transferArgsValidator,
  [TRANSACTION_TYPE.REISSUE]: reissueArgsValidator,
  [TRANSACTION_TYPE.BURN]: burnArgsValidator,
  [TRANSACTION_TYPE.LEASE]: leaseArgsValidator,
  [TRANSACTION_TYPE.CANCEL_LEASE]: cancelLeaseArgsValidator,
  [TRANSACTION_TYPE.ALIAS]: aliasArgsValidator,
  [TRANSACTION_TYPE.MASS_TRANSFER]: massTransferArgsValidator,
  [TRANSACTION_TYPE.DATA]: dataArgsValidator,
  [TRANSACTION_TYPE.SET_SCRIPT]: setScriptArgsValidator,
  [TRANSACTION_TYPE.SPONSORSHIP]: sponsorshipArgsValidator,
  [TRANSACTION_TYPE.EXCHANGE]: exchangeArgsValidator,
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: setAssetScriptArgsValidator,
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: invokeArgsValidator,
};

type SignerOptionsValidation = { isValid: boolean; invalidOptions: string[] };

export const validateSignerOptions = (options: Partial<SignerOptions>): SignerOptionsValidation => {
  const res: SignerOptionsValidation = {
    isValid: true,
    invalidOptions: [],
  };

  const isValidLogLevel = (level: unknown) =>
    ['verbose', 'production', 'error'].includes(String(level));

  if (!isString(options.NODE_URL)) {
    res.isValid = false;
    res.invalidOptions.push('NODE_URL');
  } else {
    // Validate URL format and enforce HTTPS in production contexts
    try {
      const url = new URL(options.NODE_URL);
      if (!['http:', 'https:'].includes(url.protocol)) {
        res.isValid = false;
        res.invalidOptions.push('NODE_URL');
      }
    } catch {
      res.isValid = false;
      res.invalidOptions.push('NODE_URL');
    }
  }

  if (!validateOptional(isValidLogLevel)(options.LOG_LEVEL)) {
    res.isValid = false;
    res.invalidOptions.push('LOG_LEVEL');
  }

  return res;
};

export const validateProviderInterface = (
  provider: Record<string, unknown>,
): { isValid: boolean; invalidProperties: string[] } => {
  const isFunction = (value: unknown): boolean => typeof value === 'function';

  const scheme: Record<string, (value: unknown) => boolean> = {
    connect: isFunction,
    login: isFunction,
    logout: isFunction,
    signMessage: isFunction,
    signTypedData: isFunction,
    sign: isFunction,
  };

  const invalidProperties: string[] = [];

  for (const [fieldName, fieldValidator] of Object.entries(scheme)) {
    if (!fieldValidator(provider[fieldName])) {
      invalidProperties.push(fieldName);
    }
  }

  return {
    isValid: invalidProperties.length === 0,
    invalidProperties,
  };
};
