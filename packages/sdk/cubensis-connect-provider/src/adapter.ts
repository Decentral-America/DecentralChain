/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * Adapter functions to convert between Signer and CubensisConnect transaction formats.
 */

import { json } from '@decentralchain/marshall';
import {
  type SignedTx,
  type SignerAliasTx,
  type SignerBurnTx,
  type SignerCancelLeaseTx,
  type SignerDataTx,
  type SignerInvokeTx,
  type SignerIssueTx,
  type SignerLeaseTx,
  type SignerMassTransferTx,
  type SignerReissueTx,
  type SignerSetAssetScriptTx,
  type SignerSetScriptTx,
  type SignerSponsorshipTx,
  type SignerTransferTx,
  type SignerTx,
} from '@decentralchain/signer';
import { TRANSACTION_TYPE } from './transaction-type';

/** Checks if an address string is an alias (prefixed with `alias:`). */
function isAlias(source: string): boolean {
  return source.startsWith('alias:');
}

/** Extracts the alias name from a full alias string, or returns the address as-is. */
function addressFactory(address: string): string {
  return !isAlias(address) ? address : (address.split(':')[2] ?? address);
}

/** Creates a CubensisConnect money object from an amount and optional asset ID. */
function moneyFactory(
  amount: number | string,
  assetId: string | null = 'DCC',
): CubensisConnect.IMoneyCoins {
  return {
    assetId: assetId ?? 'DCC',
    coins: amount,
  };
}

/** Extracts common transaction defaults (fee, senderPublicKey, timestamp) from a Signer transaction. */
function defaultsFactory(tx: SignerTx): CubensisConnect.ITransactionBase {
  const { fee, senderPublicKey, timestamp } = tx;
  let feeAssetId: string | null | undefined;

  if (tx.type === TRANSACTION_TYPE.TRANSFER || tx.type === TRANSACTION_TYPE.INVOKE_SCRIPT) {
    ({ feeAssetId } = tx);
  }

  return {
    ...(fee ? { fee: moneyFactory(fee, feeAssetId) } : {}),
    ...(senderPublicKey ? { senderPublicKey } : {}),
    ...(timestamp ? { timestamp } : {}),
  };
}

function issueAdapter(tx: SignerIssueTx): CubensisConnect.TIssueTxData {
  const { name, description, quantity, decimals, reissuable, script } = tx;
  const data: CubensisConnect.IIssueTx = {
    ...defaultsFactory(tx),
    description: description ?? '',
    name,
    precision: decimals,
    quantity,
    reissuable: reissuable ?? false,
    ...(script ? { script } : {}),
  };
  return { data, type: TRANSACTION_TYPE.ISSUE };
}

function transferAdapter(tx: SignerTransferTx): CubensisConnect.TTransferTxData {
  const { amount, assetId, recipient, attachment } = tx;
  const data: CubensisConnect.ITransferTx = {
    ...defaultsFactory(tx),
    amount: moneyFactory(amount, assetId),
    recipient: addressFactory(recipient),
    ...(attachment ? { attachment } : {}),
  };
  return { data, type: TRANSACTION_TYPE.TRANSFER };
}

function reissueAdapter(tx: SignerReissueTx): CubensisConnect.TReissueTxData {
  const { assetId, quantity, reissuable } = tx;
  const data: CubensisConnect.IReissueTx = {
    ...defaultsFactory(tx),
    assetId,
    quantity,
    reissuable,
  };
  return { data, type: TRANSACTION_TYPE.REISSUE };
}

function burnAdapter(tx: SignerBurnTx): CubensisConnect.TBurnTxData {
  const { assetId, amount } = tx;
  const data: CubensisConnect.IBurnTx = {
    ...defaultsFactory(tx),
    amount,
    assetId,
  };
  return { data, type: TRANSACTION_TYPE.BURN };
}

function leaseAdapter(tx: SignerLeaseTx): CubensisConnect.TLeaseTxData {
  const { recipient, amount } = tx;
  const data: CubensisConnect.ILeaseTx = {
    ...defaultsFactory(tx),
    amount,
    recipient: addressFactory(recipient),
  };
  return { data, type: TRANSACTION_TYPE.LEASE };
}

function leaseCancelAdapter(tx: SignerCancelLeaseTx): CubensisConnect.TLeaseCancelTxData {
  const { leaseId } = tx;
  const data: CubensisConnect.ILeaseCancelTx = {
    ...defaultsFactory(tx),
    leaseId,
  };
  return { data, type: TRANSACTION_TYPE.CANCEL_LEASE };
}

function aliasAdapter(tx: SignerAliasTx): CubensisConnect.TCreateAliasTxData {
  const { alias } = tx;
  const data: CubensisConnect.ICreateAliasTx = {
    ...defaultsFactory(tx),
    alias,
  };
  return { data, type: TRANSACTION_TYPE.ALIAS };
}

function massTransferAdapter(tx: SignerMassTransferTx): CubensisConnect.TMassTransferTxData {
  const { assetId, transfers, attachment } = tx;
  const data: CubensisConnect.IMassTransferTx = {
    ...defaultsFactory(tx),
    totalAmount: moneyFactory(0, assetId),
    transfers: transfers.map((transfer) => ({
      amount: transfer.amount,
      recipient: addressFactory(transfer.recipient),
    })),
    ...(attachment ? { attachment } : {}),
  };
  return { data, type: TRANSACTION_TYPE.MASS_TRANSFER };
}

function dataAdapter(tx: SignerDataTx): CubensisConnect.TDataTxData {
  const { data } = tx;
  const dataTx: CubensisConnect.IDataTx = {
    ...defaultsFactory(tx),
    data: data as CubensisConnect.TData[],
  };
  return { data: dataTx, type: TRANSACTION_TYPE.DATA };
}

function setScriptAdapter(tx: SignerSetScriptTx): CubensisConnect.TSetScriptTxData {
  const { script } = tx;
  const data: CubensisConnect.ISetScriptTx = {
    ...defaultsFactory(tx),
    script,
  };
  return { data, type: TRANSACTION_TYPE.SET_SCRIPT };
}

function sponsorshipAdapter(tx: SignerSponsorshipTx): CubensisConnect.TSponsoredFeeTxData {
  const { assetId, minSponsoredAssetFee } = tx;
  const data: CubensisConnect.ISponsoredFeeTx = {
    ...defaultsFactory(tx),
    minSponsoredAssetFee: moneyFactory(minSponsoredAssetFee ?? 0, assetId),
  };
  return { data, type: TRANSACTION_TYPE.SPONSORSHIP };
}

function setAssetScriptAdapter(tx: SignerSetAssetScriptTx): CubensisConnect.TSetAssetScriptTxData {
  const { assetId, script } = tx;
  const data: CubensisConnect.ISetAssetScriptTx = {
    ...defaultsFactory(tx),
    assetId,
    script,
  };
  return { data, type: TRANSACTION_TYPE.SET_ASSET_SCRIPT };
}

function invokeScriptAdapter(tx: SignerInvokeTx): CubensisConnect.TScriptInvocationTxData {
  const { dApp, payment, call } = tx;
  const data: CubensisConnect.IScriptInvocationTx = {
    ...defaultsFactory(tx),
    dApp: addressFactory(dApp),
    payment: (payment ?? []) as CubensisConnect.TMoney[],
    ...(call ? { call: call as CubensisConnect.ICall } : {}),
  };
  return { data, type: TRANSACTION_TYPE.INVOKE_SCRIPT };
}

export function keeperTxFactory(tx: SignerIssueTx): CubensisConnect.TIssueTxData;
export function keeperTxFactory(tx: SignerTransferTx): CubensisConnect.TTransferTxData;
export function keeperTxFactory(tx: SignerReissueTx): CubensisConnect.TReissueTxData;
export function keeperTxFactory(tx: SignerBurnTx): CubensisConnect.TBurnTxData;
export function keeperTxFactory(tx: SignerLeaseTx): CubensisConnect.TLeaseTxData;
export function keeperTxFactory(tx: SignerCancelLeaseTx): CubensisConnect.TLeaseCancelTxData;
export function keeperTxFactory(tx: SignerAliasTx): CubensisConnect.TCreateAliasTxData;
export function keeperTxFactory(tx: SignerMassTransferTx): CubensisConnect.TMassTransferTxData;
export function keeperTxFactory(tx: SignerDataTx): CubensisConnect.TDataTxData;
export function keeperTxFactory(tx: SignerSetScriptTx): CubensisConnect.TSetScriptTxData;
export function keeperTxFactory(tx: SignerSponsorshipTx): CubensisConnect.TSponsoredFeeTxData;
export function keeperTxFactory(tx: SignerSetAssetScriptTx): CubensisConnect.TSetAssetScriptTxData;
export function keeperTxFactory(tx: SignerInvokeTx): CubensisConnect.TScriptInvocationTxData;
export function keeperTxFactory(tx: SignerTx): CubensisConnect.TSignTransactionData;
export function keeperTxFactory(tx: SignerTx): CubensisConnect.TSignTransactionData {
  switch (tx.type) {
    case TRANSACTION_TYPE.ISSUE:
      return issueAdapter(tx);
    case TRANSACTION_TYPE.TRANSFER:
      return transferAdapter(tx);
    case TRANSACTION_TYPE.REISSUE:
      return reissueAdapter(tx);
    case TRANSACTION_TYPE.BURN:
      return burnAdapter(tx);
    case TRANSACTION_TYPE.LEASE:
      return leaseAdapter(tx);
    case TRANSACTION_TYPE.CANCEL_LEASE:
      return leaseCancelAdapter(tx);
    case TRANSACTION_TYPE.ALIAS:
      return aliasAdapter(tx);
    case TRANSACTION_TYPE.MASS_TRANSFER:
      return massTransferAdapter(tx);
    case TRANSACTION_TYPE.DATA:
      return dataAdapter(tx);
    case TRANSACTION_TYPE.SET_SCRIPT:
      return setScriptAdapter(tx);
    case TRANSACTION_TYPE.SPONSORSHIP:
      return sponsorshipAdapter(tx);
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      return setAssetScriptAdapter(tx);
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      return invokeScriptAdapter(tx);
    default:
      throw new Error('Unsupported transaction type');
  }
}

/**
 * Converts a signed transaction string from CubensisConnect format
 * back to the Signer signed transaction format via marshall JSON parsing.
 *
 * @param signed - JSON string of the signed transaction from CubensisConnect
 * @returns The parsed signed transaction object
 * @throws {Error} If the input is not a valid non-empty string
 */
export function signerTxFactory(signed: string): SignedTx<SignerTx> {
  if (typeof signed !== 'string' || signed.length === 0) {
    throw new Error('Expected a non-empty signed transaction string from CubensisConnect');
  }

  const parsed = json.parseTx(signed);
  if (typeof parsed !== 'object' || parsed == null || !('type' in parsed)) {
    throw new Error('Invalid signed transaction payload from CubensisConnect');
  }

  return parsed as unknown as SignedTx<SignerTx>;
}
