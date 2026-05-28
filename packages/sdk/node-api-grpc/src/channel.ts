import { type Transport } from '@connectrpc/connect';
import { createGrpcTransport, type GrpcTransportOptions } from '@connectrpc/connect-node';

/**
 * Semantic alias: a Connect Transport used as a gRPC channel.
 * Matches the @decentralchain/node-api-grpc conceptual model while using the modern
 * Connect stack instead of the legacy @grpc/grpc-js channel approach.
 */
export type Channel = Transport;

/** DCC node gRPC API port — AccountsApi, AssetsApi, BlockchainApi, BlocksApi, TransactionsApi */
export const NODE_GRPC_PORT = 6870;

/** DCC node BlockchainUpdates gRPC stream port */
export const BLOCKCHAIN_UPDATES_PORT = 6881;

/**
 * Creates a gRPC transport channel to the DCC node gRPC API.
 *
 * @param host - hostname, host:port, or full http(s):// URL.
 *   If no port is given, defaults to 6870 (NODE_GRPC_PORT).
 * @param options - optional Connect transport options (interceptors, TLS, timeouts, etc.)
 *
 * @example
 * const channel = mkDefaultChannel('mainnet-node.decentralchain.io');
 * const txApi = mkTransactionsApi(channel);
 * for await (const tx of txApi.getTransactions({ sender })) { ... }
 */
export function mkDefaultChannel(
  host: string,
  options?: Omit<GrpcTransportOptions, 'baseUrl'>,
): Channel {
  return createGrpcTransport({ baseUrl: toBaseUrl(host, NODE_GRPC_PORT), ...options });
}

/**
 * Creates a gRPC transport channel to the DCC node BlockchainUpdates API.
 *
 * @param host - hostname, host:port, or full http(s):// URL.
 *   If no port is given, defaults to 6881 (BLOCKCHAIN_UPDATES_PORT).
 * @param options - optional Connect transport options
 *
 * @example
 * const channel = mkDefaultBlockchainUpdatesChannel('mainnet-node.decentralchain.io');
 * const updatesApi = mkBlockchainUpdatesApi(channel);
 * for await (const event of updatesApi.subscribe({ fromHeight: 1 })) { ... }
 */
export function mkDefaultBlockchainUpdatesChannel(
  host: string,
  options?: Omit<GrpcTransportOptions, 'baseUrl'>,
): Channel {
  return createGrpcTransport({
    baseUrl: toBaseUrl(host, BLOCKCHAIN_UPDATES_PORT),
    ...options,
  });
}

/**
 * Normalise a host string into an http:// base URL for Connect's gRPC transport.
 * grpc:// and grpcs:// schemes (used in terraform/docker compose configs) are
 * also handled — grpcs maps to https, grpc maps to http.
 */
function toBaseUrl(host: string, defaultPort: number): string {
  // Already a full URL with supported scheme
  if (/^https?:\/\//i.test(host)) return host;
  // grpc:// → http://, grpcs:// → https://
  if (/^grpcs?:\/\//i.test(host)) {
    const secure = /^grpcs:\/\//i.test(host);
    const rest = host.replace(/^grpcs?:\/\//i, '');
    return `${secure ? 'https' : 'http'}://${rest}`;
  }
  // host:port (no scheme) → http://
  if (/:\d+$/.test(host)) return `http://${host}`;
  // bare hostname → http://hostname:defaultPort
  return `http://${host}:${defaultPort}`;
}
