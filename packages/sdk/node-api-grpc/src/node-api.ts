import { type Client, createClient } from '@connectrpc/connect';
import {
  AccountsApi,
  AssetsApi,
  BlockchainApi,
  BlocksApi,
  TransactionsApi,
} from '@decentralchain/protobuf-serialization/grpc';
import { type Channel } from './channel.js';

/**
 * Creates a typed AccountsApi gRPC client.
 * Methods: getBalances, getScript, getActiveLeases, getDataEntries, resolveAlias
 */
export const mkAccountsApi = (channel: Channel): Client<typeof AccountsApi> =>
  createClient(AccountsApi, channel);

/**
 * Creates a typed AssetsApi gRPC client.
 * Methods: getInfo, getNFTList
 */
export const mkAssetsApi = (channel: Channel): Client<typeof AssetsApi> =>
  createClient(AssetsApi, channel);

/**
 * Creates a typed BlockchainApi gRPC client.
 * Methods: getActivationStatus, getBaseTarget, getCumulativeScore
 */
export const mkBlockchainApi = (channel: Channel): Client<typeof BlockchainApi> =>
  createClient(BlockchainApi, channel);

/**
 * Creates a typed BlocksApi gRPC client.
 * Methods: getBlock, getBlockRange
 */
export const mkBlocksApi = (channel: Channel): Client<typeof BlocksApi> =>
  createClient(BlocksApi, channel);

/**
 * Creates a typed TransactionsApi gRPC client.
 * Methods: getTransactions, getTransactionSnapshots, getStateChanges,
 *          getStatuses, getUnconfirmed, sign, broadcast
 */
export const mkTransactionsApi = (channel: Channel): Client<typeof TransactionsApi> =>
  createClient(TransactionsApi, channel);

/** Typed client for AccountsApi — balances, scripts, leases, data entries, aliases */
export type AccountsApiClient = Client<typeof AccountsApi>;

/** Typed client for AssetsApi — asset info, NFTs */
export type AssetsApiClient = Client<typeof AssetsApi>;

/** Typed client for BlockchainApi — activation status, base target, cumulative score */
export type BlockchainApiClient = Client<typeof BlockchainApi>;

/** Typed client for BlocksApi — blocks by height/range */
export type BlocksApiClient = Client<typeof BlocksApi>;

/** Typed client for TransactionsApi — transactions, snapshots, state changes, broadcast */
export type TransactionsApiClient = Client<typeof TransactionsApi>;
