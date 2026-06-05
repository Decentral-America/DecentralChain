// Node gRPC channel factories

// Re-export all gRPC service schemas and request/response types for convenience.
// Consumers can import types directly from this package without a separate
// @decentralchain/protobuf-schemas/grpc import.
export * from '@decentralchain/protobuf-schemas/grpc';
// BlockchainUpdates API client factory
export {
  type BlockchainUpdatesApiClient,
  mkBlockchainUpdatesApi,
} from './blockchain-updates-api.js';
export {
  BLOCKCHAIN_UPDATES_PORT,
  type Channel,
  mkDefaultBlockchainUpdatesChannel,
  mkDefaultChannel,
  NODE_GRPC_PORT,
} from './channel.js';
// Node gRPC API client factories
export {
  type AccountsApiClient,
  type AssetsApiClient,
  type BlockchainApiClient,
  type BlocksApiClient,
  mkAccountsApi,
  mkAssetsApi,
  mkBlockchainApi,
  mkBlocksApi,
  mkTransactionsApi,
  type TransactionsApiClient,
} from './node-api.js';
