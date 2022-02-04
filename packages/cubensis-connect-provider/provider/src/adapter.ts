import {
  SignedTx,
  SignerAliasTx,
  SignerBurnTx,
  SignerCancelLeaseTx,
  SignerDataTx,
  SignerInvokeTx,
  SignerIssueTx,
  SignerLeaseTx,
  SignerMassTransferTx,
  SignerReissueTx,
  SignerSetAssetScriptTx,
  SignerSetScriptTx,
  SignerSponsorshipTx,
  SignerTransferTx,
  SignerTx,
} from '@decentralchain/signer';
import { TRANSACTION_TYPE } from '@waves/ts-types';
import { json } from '@decentralchain/marshall';

function isAlias(source: string): boolean {
  return source.startsWith('alias:');
}

function addressFactory(address: string): string {
  return !isAlias(address) ? address : address.split(':')[2];
}

function moneyFactory(
  amount: number | string,
  assetId: string | null = 'DCC'
): CubensisConnect.IMoneyCoins {
  return {
    coins: amount,
    assetId: assetId ?? 'DCC',
  };
}

function defaultsFactory(tx: SignerTx): CubensisConnect.ITransactionBase {
  const { fee } = tx;
  let feeAssetId;

  if (
    tx.type === TRANSACTION_TYPE.TRANSFER ||
    tx.type === TRANSACTION_TYPE.INVOKE_SCRIPT
  ) {
    ({ feeAssetId } = tx);
  }

  return {
    ...(fee ? { fee: moneyFactory(fee, feeAssetId) } : {}),
  };
}

function issueAdapter(tx: SignerIssueTx): CubensisConnect.TIssueTxData {
  const { name, description, quantity, decimals, reissuable, script } = tx;
  const data: CubensisConnect.IIssueTx = {
    ...defaultsFactory(tx),
    name,
    description: description ?? '',
    quantity,
    precision: decimals,
    reissuable: reissuable ?? false,
    ...(script ? { script } : {}),
  };
  return { type: TRANSACTION_TYPE.ISSUE, data };
}

function transferAdapter(tx: SignerTransferTx): CubensisConnect.TTransferTxData {
  const { amount, assetId, fee, feeAssetId, recipient, attachment } = tx;
  const data: CubensisConnect.ITransferTx = {
    ...defaultsFactory(tx),
    amount: moneyFactory(amount, assetId),
    recipient: addressFactory(recipient),
    ...(attachment ? { attachment } : {}),
    ...(fee ? { fee: moneyFactory(fee, feeAssetId) } : {}),
  };
  return { type: TRANSACTION_TYPE.TRANSFER, data };
}

function reissueAdapter(tx: SignerReissueTx): CubensisConnect.TReissueTxData {
  const { assetId, quantity, reissuable } = tx;
  const data: CubensisConnect.IReissueTx = {
    ...defaultsFactory(tx),
    assetId,
    quantity,
    reissuable,
  };
  return { type: TRANSACTION_TYPE.REISSUE, data };
}

function burnAdapter(tx: SignerBurnTx): CubensisConnect.TBurnTxData {
  const { assetId, amount } = tx;
  const data: CubensisConnect.IBurnTx = {
    ...defaultsFactory(tx),
    assetId,
    amount,
  };
  return { type: TRANSACTION_TYPE.BURN, data };
}

function leaseAdapter(tx: SignerLeaseTx): CubensisConnect.TLeaseTxData {
  const { recipient, amount } = tx;
  const data: CubensisConnect.ILeaseTx = {
    ...defaultsFactory(tx),
    recipient: addressFactory(recipient),
    amount,
  };
  return { type: TRANSACTION_TYPE.LEASE, data };
}

function leaseCancelAdapter(
  tx: SignerCancelLeaseTx
): CubensisConnect.TLeaseCancelTxData {
  const { leaseId } = tx;
  const data: CubensisConnect.ILeaseCancelTx = {
    ...defaultsFactory(tx),
    leaseId,
  };
  return { type: TRANSACTION_TYPE.CANCEL_LEASE, data };
}

function aliasAdapter(tx: SignerAliasTx): CubensisConnect.TCreateAliasTxData {
  const { alias } = tx;
  const data: CubensisConnect.ICreateAliasTx = {
    ...defaultsFactory(tx),
    alias,
  };
  return { type: TRANSACTION_TYPE.ALIAS, data };
}

function massTransferAdapter(
  tx: SignerMassTransferTx
): CubensisConnect.TMassTransferTxData {
  const { assetId, transfers, attachment } = tx;
  const data: CubensisConnect.IMassTransferTx = {
    ...defaultsFactory(tx),
    totalAmount: moneyFactory(0, assetId),
    transfers: transfers.map(transfer => ({
      recipient: addressFactory(transfer.recipient),
      amount: transfer.amount,
    })),
    ...(attachment ? { attachment } : {}),
  };
  return { type: TRANSACTION_TYPE.MASS_TRANSFER, data };
}

function dataAdapter(tx: SignerDataTx): CubensisConnect.TDataTxData {
  const { data } = tx;
  const dataTx: CubensisConnect.IDataTx = {
    ...defaultsFactory(tx),
    data: data as Array<CubensisConnect.TData>,
  };
  return { type: TRANSACTION_TYPE.DATA, data: dataTx };
}

function setScriptAdapter(tx: SignerSetScriptTx): CubensisConnect.TSetScriptTxData {
  const { script } = tx;
  const data: CubensisConnect.ISetScriptTx = {
    ...defaultsFactory(tx),
    script,
  };
  return { type: TRANSACTION_TYPE.SET_SCRIPT, data };
}

function sponsorshipAdapter(
  tx: SignerSponsorshipTx
): CubensisConnect.TSponsoredFeeTxData {
  const { assetId, minSponsoredAssetFee } = tx;
  const data: CubensisConnect.ISponsoredFeeTx = {
    ...defaultsFactory(tx),
    minSponsoredAssetFee: moneyFactory(minSponsoredAssetFee, assetId),
  };
  return { type: TRANSACTION_TYPE.SPONSORSHIP, data };
}

function setAssetScriptAdapter(
  tx: SignerSetAssetScriptTx
): CubensisConnect.TSetAssetScriptTxData {
  const { assetId, script } = tx;
  const data: CubensisConnect.ISetAssetScriptTx = {
    ...defaultsFactory(tx),
    assetId,
    script,
  };
  return { type: TRANSACTION_TYPE.SET_ASSET_SCRIPT, data };
}

function invokeScriptAdapter(
  tx: SignerInvokeTx
): CubensisConnect.TScriptInvocationTxData {
  const { dApp, fee, feeAssetId, payment, call } = tx;
  const data: CubensisConnect.IScriptInvocationTx = {
    ...defaultsFactory(tx),
    dApp: addressFactory(dApp),
    payment: (payment ?? []) as Array<CubensisConnect.TMoney>,
    ...(call ? { call: call as CubensisConnect.ICall } : {}),
    ...(fee ? { fee: moneyFactory(fee, feeAssetId) } : {}),
  };
  return { type: TRANSACTION_TYPE.INVOKE_SCRIPT, data };
}

export function keeperTxFactory(tx: SignerIssueTx): CubensisConnect.TIssueTxData;
export function keeperTxFactory(
  tx: SignerTransferTx
): CubensisConnect.TTransferTxData;
export function keeperTxFactory(
  tx: SignerReissueTx
): CubensisConnect.TReissueTxData;
export function keeperTxFactory(tx: SignerBurnTx): CubensisConnect.TBurnTxData;
export function keeperTxFactory(tx: SignerLeaseTx): CubensisConnect.TLeaseTxData;
export function keeperTxFactory(
  tx: SignerCancelLeaseTx
): CubensisConnect.TLeaseCancelTxData;
export function keeperTxFactory(
  tx: SignerAliasTx
): CubensisConnect.TCreateAliasTxData;
export function keeperTxFactory(
  tx: SignerMassTransferTx
): CubensisConnect.TMassTransferTxData;
export function keeperTxFactory(tx: SignerDataTx): CubensisConnect.TDataTxData;
export function keeperTxFactory(
  tx: SignerSetScriptTx
): CubensisConnect.TSetScriptTxData;
export function keeperTxFactory(
  tx: SignerSponsorshipTx
): CubensisConnect.TSponsoredFeeTxData;
export function keeperTxFactory(
  tx: SignerSetAssetScriptTx
): CubensisConnect.TSetAssetScriptTxData;
export function keeperTxFactory(
  tx: SignerInvokeTx
): CubensisConnect.TScriptInvocationTxData;
export function keeperTxFactory(tx: SignerTx): CubensisConnect.TSignTransactionData;
export function keeperTxFactory(tx) {
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

export function signerTxFactory(signed: string): SignedTx<SignerTx> {
  return json.parseTx(signed);
}
