import { BigNumber } from '@decentralchain/bignumber';
import {
  base58Decode,
  base58Encode,
  base64Decode,
  createAddress,
  utf8Encode,
} from '@decentralchain/crypto';
import { Money } from '@decentralchain/data-entities';
import { binary } from '@decentralchain/marshall';
import {
  create,
  DataEntrySchema,
  DataTransactionDataSchema,
  toBinary,
} from '@decentralchain/protobuf-schemas';
import type { LeaseTransactionFromNode } from '@decentralchain/types';
import { TRANSACTION_TYPE } from '@decentralchain/types';
import invariant from 'tiny-invariant';
import type { AssetsRecord } from '#assets/types';
import type { BalancesItem } from '#balances/types';
import { computeTxHash, makeTxBytes, processAliasOrAddress } from '#messages/utils';
import {
  getExtraFee,
  getFeeOptions,
  getSpendingAmountsForSponsorableTx,
  isEnoughBalanceForFeeAndSpendingAmounts,
} from '../fee/utils';
import { ERRORS } from '../lib/keeperError';
import type {
  MessageInputTx,
  MessageTx,
  MessageTxInvokeScript,
  MessageTxTransfer,
  MoneyLike,
} from '../messages/types';
import type { PreferencesAccount } from '../preferences/types';
import { getTxVersions } from '../wallets/getTxVersions';
import { moneyLikeToMoney, pickDefaultTxVersion } from './messageUtils';

/**
 * The subset of a transaction needed to compute fee options for sponsorable
 * transaction types (Transfer and InvokeScript). Extracted as a named type so
 * it can be used both in the private function signature and in call-site casts
 * (TypeScript does not allow `typeof this.#privateMethod` in generic positions).
 */
type SponsorableTxParams = {
  fee?: MessageTx['fee'] | undefined;
  initialFee?: MessageTx['initialFee'] | undefined;
} & (
  | (Omit<MessageTxTransfer, 'fee' | 'id' | 'initialFee' | 'initialFeeAssetId'> &
      Partial<Pick<MessageTxTransfer, 'initialFeeAssetId'>>)
  | (Omit<MessageTxInvokeScript, 'fee' | 'id' | 'initialFee' | 'initialFeeAssetId'> &
      Partial<Pick<MessageTxInvokeScript, 'initialFeeAssetId'>>)
);

function getMoneyLikeValue(moneyLike: MoneyLike) {
  for (const key of ['tokens', 'coins', 'amount'] as const) {
    if (key in moneyLike) {
      return moneyLike[key] as Exclude<(typeof moneyLike)[typeof key], BigNumber>;
    }
  }

  return null;
}

export function isNumberLikePositive(numberLike: string | number) {
  const bn = new BigNumber(numberLike);

  return bn.isFinite() && bn.gt(0);
}

export function isMoneyLikeValuePositive(
  moneyLike: MoneyLike | string | number | null | undefined,
) {
  if (typeof moneyLike !== 'object' || moneyLike === null) {
    return false;
  }

  const value = getMoneyLikeValue(moneyLike);

  if (value == null) {
    return false;
  }

  return isNumberLikePositive(value);
}

/** Collaborators #generateMessageTx needs from MessageController - passed in rather than accessed via `this`. */
export interface BuildTransactionDeps {
  getAccountBalance: () => BalancesItem | undefined;
  getAssets: () => AssetsRecord;
  getNetworkCode: () => string;
  getNode: () => string;
  getUsdPrices: () => Partial<Record<string, string>>;
  updateAssets: (assetIds: Array<string | null | undefined>) => Promise<void>;
}

function getFeeInAssetWithEnoughBalance(
  deps: Pick<BuildTransactionDeps, 'getAccountBalance' | 'getUsdPrices'>,
  assets: AssetsRecord,
  txParams: SponsorableTxParams,
  feeMoneyLike: MoneyLike,
) {
  const balance = deps.getAccountBalance();

  const feeMoney = moneyLikeToMoney(feeMoneyLike, assets);

  const spendingAmounts = getSpendingAmountsForSponsorableTx({
    assets,
    messageTx: txParams,
  });

  if (
    isEnoughBalanceForFeeAndSpendingAmounts({
      balance: balance?.assets?.[feeMoney.asset.id]?.balance ?? 0,
      fee: feeMoney,
      spendingAmounts,
    })
  ) {
    return;
  }

  const feeOption = getFeeOptions({
    assets,
    balance,
    initialFee: feeMoney,
    txType: txParams.type,
    usdPrices: deps.getUsdPrices(),
  }).find((option) =>
    isEnoughBalanceForFeeAndSpendingAmounts({
      balance: option.assetBalance.balance,
      fee: option.money,
      spendingAmounts,
    }),
  );

  if (!feeOption) return;

  const fee = feeOption.money.toCoins();

  const feeAssetId = feeOption.money.asset.id === 'DCC' ? null : feeOption.money.asset.id;

  const { initialFee = fee, initialFeeAssetId = feeAssetId } = txParams;

  return {
    fee,
    feeAssetId,
    initialFee,
    initialFeeAssetId,
  };
}

/**
 * Builds a fully-populated MessageTx (fee, id, per-type fields) from a raw
 * MessageInputTx. Extracted from MessageController#generateMessageTx as-is -
 * same logic, same behavior, verified via message.test.ts's per-type coverage
 * before and after this extraction.
 */
export async function buildTransaction(
  deps: BuildTransactionDeps,
  account: PreferencesAccount,
  messageInputTx: MessageInputTx,
): Promise<MessageTx> {
  if ('fee' in messageInputTx.data && !isMoneyLikeValuePositive(messageInputTx.data.fee)) {
    throw ERRORS.REQUEST_ERROR('fee is not valid', messageInputTx);
  }

  if (
    'chainId' in messageInputTx.data &&
    messageInputTx.data.chainId !== deps.getNetworkCode().charCodeAt(0)
  ) {
    throw ERRORS.REQUEST_ERROR('chainId does not match current network', messageInputTx);
  }

  const chainId = messageInputTx.data.chainId ?? account.networkCode.charCodeAt(0);

  const proofs = messageInputTx.data.proofs ?? [];

  const senderPublicKey = messageInputTx.data.senderPublicKey ?? account.publicKey;

  const getSenderExtraFee = () =>
    getExtraFee(
      base58Encode(createAddress(base58Decode(senderPublicKey), chainId)),
      deps.getNode(),
    );

  const timestamp = messageInputTx.data.timestamp ?? Date.now();

  const assets = deps.getAssets();

  function getRoundedUpKbs(byteCount: number) {
    return ((byteCount - 1) >> 10) + 1;
  }

  switch (messageInputTx.type) {
    case TRANSACTION_TYPE.ISSUE: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      if (!isNumberLikePositive(messageInputTx.data.quantity)) {
        throw ERRORS.REQUEST_ERROR('quantity is not valid', messageInputTx);
      }

      if (
        typeof messageInputTx.data.precision !== 'number' ||
        messageInputTx.data.precision < 0 ||
        messageInputTx.data.precision > 8
      ) {
        throw ERRORS.REQUEST_ERROR('precision is not valid', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
      ]);

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee())
          .add(
            !messageInputTx.data.reissuable &&
              messageInputTx.data.precision === 0 &&
              new BigNumber(messageInputTx.data.quantity).eq(1)
              ? 10_0000
              : 1_0000_0000,
          )
          .toString();
      }

      const tx = {
        chainId,
        decimals: messageInputTx.data.precision,
        description: messageInputTx.data.description,
        fee,
        initialFee: messageInputTx.data.initialFee
          ? moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins()
          : fee,
        name: messageInputTx.data.name,
        proofs: messageInputTx.data.proofs ?? [],
        quantity: messageInputTx.data.quantity,
        reissuable: messageInputTx.data.reissuable,
        script: messageInputTx.data.script || null,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.TRANSFER: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      if (!isMoneyLikeValuePositive(messageInputTx.data.amount)) {
        throw ERRORS.REQUEST_ERROR('amount is not valid', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.amount.assetId,
      ]);

      const txParams = {
        amount: moneyLikeToMoney(messageInputTx.data.amount, assets).toCoins(),
        assetId:
          messageInputTx.data.amount.assetId === 'DCC' ? null : messageInputTx.data.amount.assetId,
        attachment: Array.isArray(messageInputTx.data.attachment)
          ? base58Encode(new Uint8Array(messageInputTx.data.attachment))
          : messageInputTx.data.attachment
            ? base58Encode(utf8Encode(messageInputTx.data.attachment))
            : undefined,
        chainId,
        fee: messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins(),
        feeAssetId:
          messageInputTx.data.fee?.assetId === 'DCC'
            ? null
            : (messageInputTx.data.fee?.assetId ?? null),
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        initialFeeAssetId:
          messageInputTx.data.initialFee &&
          (messageInputTx.data.initialFee.assetId === 'DCC'
            ? null
            : (messageInputTx.data.initialFee.assetId ?? null)),
        proofs,
        recipient: processAliasOrAddress(messageInputTx.data.recipient, chainId),
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let { fee } = txParams;
      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee())
          .add(txParams.assetId && assets[txParams.assetId]?.hasScript ? 50_0000 : 10_0000)
          .toString();
      }

      const { feeAssetId, initialFee = fee, initialFeeAssetId = feeAssetId } = txParams;

      const tx = {
        ...txParams,
        ...((senderPublicKey === account.publicKey &&
          getFeeInAssetWithEnoughBalance(deps, assets, txParams as SponsorableTxParams, {
            assetId: feeAssetId,
            coins: fee,
            // biome-ignore lint/nursery/useNullishCoalescing: (A && B) || C pattern — when A is false, B is not null/undefined but false; || correctly provides the fallback while ?? would not
          })) || {
          fee,
          feeAssetId,
          initialFee,
          initialFeeAssetId,
        }),
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx as Parameters<typeof makeTxBytes>[0]))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.REISSUE: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      const quantityInput =
        'quantity' in messageInputTx.data
          ? messageInputTx.data.quantity
          : messageInputTx.data.amount;

      if (!isMoneyLikeValuePositive(quantityInput)) {
        if (typeof quantityInput !== 'object' && !isNumberLikePositive(quantityInput)) {
          throw ERRORS.REQUEST_ERROR('quantity is not valid', messageInputTx);
        }
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.assetId,
      ]);

      const quantityMaybeMoney =
        typeof quantityInput === 'object' ? moneyLikeToMoney(quantityInput, assets) : quantityInput;

      let assetId: string;
      let quantity: string | number;

      if (quantityMaybeMoney instanceof Money) {
        assetId = quantityMaybeMoney.asset.id;
        quantity = quantityMaybeMoney.toCoins();
      } else {
        invariant(messageInputTx.data.assetId);
        assetId = messageInputTx.data.assetId;
        quantity = quantityMaybeMoney;
      }

      const txParams = {
        assetId,
        chainId,
        proofs,
        quantity,
        reissuable: messageInputTx.data.reissuable,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee())
          .add(txParams.assetId && assets[txParams.assetId]?.hasScript ? 50_0000 : 10_0000)
          .toString();
      }

      const tx = {
        ...txParams,
        fee,
        initialFee: messageInputTx.data.initialFee
          ? moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins()
          : fee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.BURN: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      const amountInput =
        'quantity' in messageInputTx.data
          ? messageInputTx.data.quantity
          : messageInputTx.data.amount;

      if (!isMoneyLikeValuePositive(amountInput)) {
        if (typeof amountInput !== 'object' && !isNumberLikePositive(amountInput)) {
          throw ERRORS.REQUEST_ERROR('amount is not valid', messageInputTx);
        }
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.assetId,
      ]);

      const amountMaybeMoney =
        typeof amountInput === 'object' ? moneyLikeToMoney(amountInput, assets) : amountInput;

      let assetId: string;
      let amount: string | number;
      if (amountMaybeMoney instanceof Money) {
        assetId = amountMaybeMoney.asset.id;
        amount = amountMaybeMoney.toCoins();
      } else {
        assetId = messageInputTx.data.assetId;
        amount = amountMaybeMoney;
      }

      const txParams = {
        amount,
        assetId,
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee())
          .add(txParams.assetId && assets[txParams.assetId]?.hasScript ? 50_0000 : 10_0000)
          .toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.LEASE: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      if (!isMoneyLikeValuePositive(messageInputTx.data.amount)) {
        if (
          typeof messageInputTx.data.amount !== 'object' &&
          !isNumberLikePositive(messageInputTx.data.amount)
        ) {
          throw ERRORS.REQUEST_ERROR('amount is not valid', messageInputTx);
        }
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
      ]);

      const amount = moneyLikeToMoney(
        typeof messageInputTx.data.amount === 'object'
          ? messageInputTx.data.amount
          : { assetId: 'DCC', coins: messageInputTx.data.amount },
        assets,
      ).toCoins();

      const txParams = {
        amount,
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        recipient: processAliasOrAddress(messageInputTx.data.recipient, chainId),
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee()).add(10_0000).toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.CANCEL_LEASE: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
      ]);

      const response = await fetch(
        new URL(`/transactions/info/${messageInputTx.data.leaseId}`, deps.getNode()),
        {
          headers: {
            accept: 'application/json; large-significand-format=string',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Could not fetch lease transaction: ${await response.text()}`);
      }

      const lease: LeaseTransactionFromNode = await response.json();

      const txParams = {
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        leaseId: messageInputTx.data.leaseId,
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee()).add(10_0000).toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
        lease,
      };
    }
    case TRANSACTION_TYPE.ALIAS: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
      ]);

      const txParams = {
        alias: messageInputTx.data.alias,
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee()).add(10_0000).toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.MASS_TRANSFER: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      messageInputTx.data.transfers.forEach(({ amount }) => {
        if (typeof amount === 'object') {
          if (isMoneyLikeValuePositive(amount)) return;
        } else {
          if (isNumberLikePositive(amount)) return;
        }

        throw ERRORS.REQUEST_ERROR('amount is not valid', messageInputTx);
      });

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.totalAmount.assetId,
      ]);

      const txParams = {
        assetId:
          messageInputTx.data.totalAmount.assetId === 'DCC'
            ? null
            : messageInputTx.data.totalAmount.assetId,
        attachment: Array.isArray(messageInputTx.data.attachment)
          ? base58Encode(new Uint8Array(messageInputTx.data.attachment))
          : messageInputTx.data.attachment
            ? base58Encode(utf8Encode(messageInputTx.data.attachment))
            : undefined,
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        senderPublicKey,
        timestamp,
        transfers: messageInputTx.data.transfers.map((transfer) => ({
          amount:
            typeof transfer.amount === 'object'
              ? moneyLikeToMoney(transfer.amount, assets).toCoins()
              : transfer.amount,
          recipient: processAliasOrAddress(transfer.recipient, chainId),
        })),
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee())
          .add(
            (((txParams.transfers.length + 1) >> 1) + 1) *
              (txParams.assetId && assets[txParams.assetId]?.hasScript ? 50_0000 : 10_0000),
          )
          .toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.DATA: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      messageInputTx.data.data.forEach((item) => {
        if (item.type === 'integer') {
          const { value } = item;

          if (!new BigNumber(value).isInt()) {
            throw ERRORS.REQUEST_ERROR(
              `'${
                item.key
              }' data key value must be a string or number representing an integer, got: ${
                value === '' ? "''" : value
              }`,
              messageInputTx,
            );
          }
        }
      });

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
      ]);

      const txParams = {
        chainId,
        data: messageInputTx.data.data,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        const bytes =
          txParams.version === 1
            ? binary.serializeTx({ ...txParams, fee: 0 })
            : toBinary(
                DataTransactionDataSchema,
                create(DataTransactionDataSchema, {
                  data: txParams.data.map((entry) =>
                    create(DataEntrySchema, {
                      key: entry.key,
                      value:
                        entry.type === 'integer'
                          ? { case: 'intValue' as const, value: BigInt(entry.value) }
                          : entry.type === 'boolean'
                            ? { case: 'boolValue' as const, value: entry.value }
                            : entry.type === 'binary'
                              ? {
                                  case: 'binaryValue' as const,
                                  value: base64Decode(entry.value.replace(/^base64:/, '')),
                                }
                              : entry.type === 'string'
                                ? { case: 'stringValue' as const, value: entry.value }
                                : { case: undefined },
                    }),
                  ),
                }),
              );

        fee = new BigNumber(await getSenderExtraFee())
          .add(getRoundedUpKbs(bytes.length) * 10_0000)
          .toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.SET_SCRIPT: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
      ]);

      const txParams = {
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        script: messageInputTx.data.script || null,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        if (txParams.script == null) {
          fee = new BigNumber(await getSenderExtraFee()).add(10_0000).toString();
        } else {
          const kbs = getRoundedUpKbs(base64Decode(txParams.script.replace(/^base64:/, '')).length);

          fee = new BigNumber(await getSenderExtraFee()).add(kbs * 10_0000).toString();
        }
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.SPONSORSHIP: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      const assetId = messageInputTx.data.minSponsoredAssetFee.assetId;

      if (typeof assetId !== 'string') {
        throw ERRORS.REQUEST_ERROR('assetId must be a string', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.minSponsoredAssetFee.assetId,
      ]);

      const minSponsoredAssetFee = moneyLikeToMoney(
        messageInputTx.data.minSponsoredAssetFee,
        assets,
      ).getCoins();

      const txParams = {
        assetId,
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        minSponsoredAssetFee: minSponsoredAssetFee.eq(0) ? null : minSponsoredAssetFee.toString(),
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee()).add(10_0000).toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.assetId,
      ]);

      const txParams = {
        assetId: messageInputTx.data.assetId,
        chainId,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        proofs,
        script: messageInputTx.data.script,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee()).add(1_0000_0000).toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.INVOKE_SCRIPT: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      const payment = messageInputTx.data.payment ?? [];

      payment.forEach((p) => {
        if (!isMoneyLikeValuePositive(p)) {
          throw ERRORS.REQUEST_ERROR('payment is not valid', messageInputTx);
        }
      });

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        ...payment.map((p) => p.assetId),
      ]);

      const txParams = {
        call:
          messageInputTx.data.call == null
            ? null
            : {
                ...messageInputTx.data.call,
                args: messageInputTx.data.call.args ?? [],
              },
        chainId,
        dApp: processAliasOrAddress(messageInputTx.data.dApp, chainId),
        feeAssetId:
          messageInputTx.data.fee?.assetId === 'DCC'
            ? null
            : (messageInputTx.data.fee?.assetId ?? null),
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        initialFeeAssetId:
          messageInputTx.data.initialFee &&
          (messageInputTx.data.initialFee.assetId === 'DCC'
            ? null
            : messageInputTx.data.initialFee.assetId),
        payment: payment.map((p) => ({
          amount: moneyLikeToMoney(p, assets).toCoins(),
          assetId: p.assetId === 'DCC' ? null : p.assetId,
        })),
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee()).add(50_0000).toString();
      }

      const { feeAssetId, initialFee = fee, initialFeeAssetId = feeAssetId } = txParams;

      const tx = {
        ...txParams,
        ...((senderPublicKey === account.publicKey &&
          getFeeInAssetWithEnoughBalance(deps, assets, txParams as SponsorableTxParams, {
            assetId: feeAssetId,
            coins: fee,
            // biome-ignore lint/nursery/useNullishCoalescing: (A && B) || C pattern — when A is false, B is not null/undefined but false; || correctly provides the fallback while ?? would not
          })) || {
          fee,
          feeAssetId,
          initialFee,
          initialFeeAssetId,
        }),
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx as Parameters<typeof makeTxBytes>[0]))),
        ...tx,
      };
    }
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO: {
      const versions = getTxVersions(account.type)[messageInputTx.type];
      const version =
        messageInputTx.data.version ?? pickDefaultTxVersion(versions, messageInputTx.type);

      if (!versions.includes(version)) {
        throw ERRORS.REQUEST_ERROR('unsupported tx version', messageInputTx);
      }

      await deps.updateAssets([
        messageInputTx.data.fee?.assetId,
        messageInputTx.data.initialFee?.assetId,
        messageInputTx.data.assetId,
      ]);

      const txParams = {
        assetId: messageInputTx.data.assetId,
        chainId,
        description: messageInputTx.data.description,
        initialFee:
          messageInputTx.data.initialFee &&
          moneyLikeToMoney(messageInputTx.data.initialFee, assets).toCoins(),
        name: messageInputTx.data.name,
        proofs,
        senderPublicKey,
        timestamp,
        type: messageInputTx.type,
        version,
      };

      let fee =
        messageInputTx.data.fee && moneyLikeToMoney(messageInputTx.data.fee, assets).toCoins();

      if (!fee) {
        fee = new BigNumber(await getSenderExtraFee())
          .add(txParams.assetId && assets[txParams.assetId]?.hasScript ? 50_0000 : 10_0000)
          .toString();
      }

      const { initialFee = fee } = txParams;

      const tx = {
        ...txParams,
        fee,
        initialFee,
      };

      return {
        id: base58Encode(computeTxHash(makeTxBytes(tx))),
        ...tx,
      };
    }
  }
}
