/**
 * Transaction Utilities
 * Helpers for creating and signing blockchain transactions
 * Uses data-service and @decentralchain/signature-adapter
 */

import { SIGN_TYPE } from '@decentralchain/signature-adapter';
import * as ds from 'data-service';
import { logger } from '@/lib/logger';

// Standard transaction fees in wavelets (smallest unit)
const TRANSFER_FEE_WAVELETS = 100000; // 0.001 DCC

/**
 * Transfer transaction parameters
 */
export interface TransferParams {
  recipient: string;
  amount: number;
  assetId?: string | null;
  attachment?: string;
  fee?: number; // Optional - will be fetched from node if not provided
  timestamp?: number;
}

/**
 * Lease transaction parameters
 */
export interface LeaseParams {
  recipient: string;
  amount: number;
  fee?: number;
}

/**
 * Transaction result after signing and getting ID
 */
export interface Transaction {
  id?: string;
  type: number;
  version: number;
  sender?: string;
  senderPublicKey?: string;
  fee: number;
  timestamp: number;
  proofs?: string[];
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  attachment?: string;
  leaseId?: string;
  [key: string]: unknown;
}

/**
 * Create and sign a transfer transaction using data-service signature adapter
 * This properly signs the transaction with the user's seed through the signature adapter
 * Matches the Angular implementation approach
 */
export const createTransferTransaction = async (
  params: TransferParams,
  _seed: string,
): Promise<Record<string, unknown>> => {
  // Get the signature API from data-service
  // It should already be initialized with the user's seed via ds.app.login()
  const signApi = ds.signature.getSignatureApi();

  if (!signApi) {
    throw new Error('Signature API not initialized. Please log in again.');
  }

  // Convert amount to Money object using moneyFromTokens (matches Angular)
  const amountMoney = await ds.moneyFromTokens(params.amount.toString(), params.assetId || 'DCC');

  // Get the fee as Money object using wavelets (smallest unit)
  const feeMoney = await ds.moneyFromCoins(TRANSFER_FEE_WAVELETS, 'DCC');

  // Convert attachment string to bytes array using TextEncoder (standard browser API)
  const attachmentBytes = params.attachment
    ? Array.from(new TextEncoder().encode(params.attachment))
    : [];

  // Create transaction data object (simplified version without dcc.node.transactions)
  const txData = {
    recipient: params.recipient,
    amount: amountMoney,
    assetId: params.assetId || null,
    attachment: attachmentBytes,
    fee: feeMoney,
    timestamp: params.timestamp || Date.now(),
  };

  logger.debug('[createTransferTransaction] Transaction prepared');

  // Create a signable transaction using the signature adapter
  const signable = signApi.makeSignable({
    type: SIGN_TYPE.TRANSFER,
    data: txData,
  });

  // Get the transaction ID (this signs it)
  await signable.getId();

  // Get the data formatted for API broadcast
  const rawTx = await signable.getDataForApi();
  const preparedTx: typeof rawTx & { amount?: unknown; fee?: unknown } = rawTx;

  // CRITICAL FIX: The node expects amount and fee as numbers, not strings
  // getDataForApi() returns them as strings, so we need to convert them
  const txForBroadcast = {
    ...preparedTx,
    amount: parseInt(String(preparedTx.amount), 10),
    fee: parseInt(String(preparedTx.fee), 10),
  };

  return txForBroadcast;
};

/**
 * Create and sign a lease transaction using data-service signature adapter
 */
export const createLeaseTransaction = async (
  params: LeaseParams,
  _seed: string,
): Promise<Record<string, unknown>> => {
  const signApi = ds.signature.getSignatureApi();

  if (!signApi) {
    throw new Error('Signature API not initialized. Please log in again.');
  }

  // Convert amount and fee to Money objects
  const amount = await ds.moneyFromCoins(params.amount, 'DCC');
  const fee = await ds.moneyFromCoins(params.fee || 100000, 'DCC');

  const signable = signApi.makeSignable({
    type: SIGN_TYPE.LEASE,
    data: {
      recipient: params.recipient,
      amount: amount,
      fee: fee,
      timestamp: Date.now(),
    },
  });

  await signable.getId();
  const preparedTx = await signable.getDataForApi();

  return preparedTx;
};

/**
 * Create and sign a lease transaction using data-service signature adapter
 */
export const createCancelLeaseTransaction = async (
  leaseId: string,
  _seed: string,
): Promise<Record<string, unknown>> => {
  const signApi = ds.signature.getSignatureApi();

  if (!signApi) {
    throw new Error('Signature API not initialized. Please log in again.');
  }

  const signable = signApi.makeSignable({
    type: SIGN_TYPE.CANCEL_LEASING,
    data: {
      leaseId,
      fee: 100000, // Default fee 0.001 DCC
      timestamp: Date.now(),
    },
  });

  await signable.getId();
  const preparedTx = await signable.getDataForApi();

  return preparedTx;
};

/**
 * Create and sign an alias transaction using data-service signature adapter
 */
export const createAliasTransaction = async (
  params: { alias: string; fee: number },
  _seed: string,
): Promise<Record<string, unknown>> => {
  const signApi = ds.signature.getSignatureApi();

  if (!signApi) {
    throw new Error('Signature API not initialized. Please log in again.');
  }

  const signable = signApi.makeSignable({
    type: SIGN_TYPE.CREATE_ALIAS,
    data: {
      alias: params.alias,
      fee: params.fee,
      timestamp: Date.now(),
    },
  });

  await signable.getId();
  const rawAliasTx = await signable.getDataForApi();
  const preparedTx: typeof rawAliasTx & { fee?: unknown } = rawAliasTx;

  // CRITICAL FIX: The node expects fee as a number, not a Money object
  // The fee object from getDataForApi() has structure: {bn: BigNumber}
  let feeValue: number;

  if (typeof preparedTx.fee === 'number') {
    // Fee is already a number
    feeValue = preparedTx.fee;
  } else if (typeof preparedTx.fee === 'string') {
    // Fee is a string, parse it
    feeValue = parseInt(preparedTx.fee, 10);
  } else if (preparedTx.fee && typeof preparedTx.fee === 'object') {
    // Fee is a Money/BigNumber object - try to extract numeric value
    // biome-ignore lint/suspicious/noExplicitAny: legacy untyped fee object from signable API
    const feeObj = preparedTx.fee as any;
    if (feeObj.bn && typeof feeObj.bn.toNumber === 'function') {
      // Fee has bn.toNumber() method (most common case)
      feeValue = feeObj.bn.toNumber();
    } else if (feeObj.bn && typeof feeObj.bn.toString === 'function') {
      // Fee has bn.toString() method
      feeValue = parseInt(feeObj.bn.toString(), 10);
    } else if (typeof feeObj.getCoins === 'function') {
      // Fee is a Money object with getCoins() method
      feeValue = feeObj.getCoins();
    } else if (typeof feeObj.toCoins === 'function') {
      // Fee has toCoins() method
      feeValue = feeObj.toCoins();
    } else if (typeof feeObj.toString === 'function') {
      // Fee has toString() method
      feeValue = parseInt(preparedTx.fee.toString(), 10);
    } else {
      // Fallback: try to convert to number
      logger.warn(
        '[createAliasTransaction] Unexpected fee format, attempting conversion:',
        preparedTx.fee,
      );
      feeValue = Number(preparedTx.fee) || 100000; // Default to 0.001 DCC if conversion fails
    }
  } else {
    // Unknown type, use default fee
    logger.warn('[createAliasTransaction] Invalid fee type, using default:', preparedTx.fee);
    feeValue = 100000; // Default to 0.001 DCC
  }

  const txForBroadcast = {
    ...preparedTx,
    fee: feeValue,
  };

  return txForBroadcast;
};

/**
 * Broadcast a signed transaction to the blockchain
 * Using native fetch instead of ds.broadcast() to avoid stringifyJSON dependency
 */
export const broadcastTransaction = async (
  tx: Record<string, unknown>,
): Promise<{ id: string }> => {
  // SECURITY: Never log transaction data in production (contains signatures/proofs)

  try {
    // Get the node URL from data-service config
    const nodeUrl = ds.config.get('node');

    // SECURITY: Enforce HTTPS for transaction broadcasts in production
    const isProd = import.meta.env.PROD;
    const isLocalhost = nodeUrl?.includes('localhost') || nodeUrl?.includes('127.0.0.1');
    if (isProd && !isLocalhost && nodeUrl && !nodeUrl.startsWith('https://')) {
      throw new Error('SECURITY: Node URL must use HTTPS for transaction broadcasts');
    }

    // Prepare the request body
    const requestBody = JSON.stringify(tx);

    // Use native fetch to broadcast the transaction
    const response = await fetch(`${nodeUrl}/transactions/broadcast`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();

      let error: { message: string } | Record<string, unknown>;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      logger.error('[broadcastTransaction] HTTP Error:', response.status, error);
      throw error;
    }

    const result = await response.json();
    return result;
  } catch (error: unknown) {
    logger.error('[broadcastTransaction] Broadcast failed:', error);
    throw error;
  }
};
