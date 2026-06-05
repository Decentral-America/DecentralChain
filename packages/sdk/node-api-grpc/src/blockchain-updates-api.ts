import { type Client, createClient } from '@connectrpc/connect';
import { BlockchainUpdatesApi } from '@decentralchain/protobuf-schemas/grpc';
import { type Channel } from './channel.js';

/**
 * Creates a typed BlockchainUpdatesApi gRPC client.
 * Methods: getBlockUpdate, getBlockUpdatesRange, subscribe (server-streaming)
 *
 * Connect on port 6881 (use mkDefaultBlockchainUpdatesChannel for the channel).
 */
export const mkBlockchainUpdatesApi = (channel: Channel): Client<typeof BlockchainUpdatesApi> =>
  createClient(BlockchainUpdatesApi, channel);

/** Typed client for BlockchainUpdatesApi — real-time blockchain event stream */
export type BlockchainUpdatesApiClient = Client<typeof BlockchainUpdatesApi>;
