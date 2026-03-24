/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * Decorators for the CubensisConnect provider methods.
 */

import { type ConnectOptions } from '@decentralchain/signer';

/**
 * Normalizes a node URL for comparison by stripping trailing slashes.
 *
 * @param url - The node URL to normalize
 * @returns The normalized URL string
 */
function normalizeNodeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Method decorator that validates the CubensisConnect extension is connected
 * to the same network as the Signer before executing the decorated method.
 *
 * Compares the node URL and network byte from CubensisConnect's public state
 * against the Signer's connect options. Throws if they don't match.
 *
 * @throws {Error} If CubensisConnect network doesn't match Signer connect options
 */
export function ensureNetwork(
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const origin = descriptor.value as (...args: unknown[]) => unknown;

  descriptor.value = function (
    this: {
      _api: CubensisConnect.ICubensisConnectApi;
      _options: ConnectOptions;
    },
    ...args: unknown[]
  ) {
    const api = this._api;
    return api.publicState().then((state: CubensisConnect.IPublicStateResponse) => {
      const nodeUrl = normalizeNodeUrl(state.network.server);
      const networkByte = state.network.code.charCodeAt(0);

      if (
        nodeUrl !== normalizeNodeUrl(this._options.NODE_URL) ||
        networkByte !== this._options.NETWORK_BYTE
      ) {
        throw new Error(
          `Invalid connect options. Signer connect (${this._options.NODE_URL} ${String(this._options.NETWORK_BYTE)}) does not match CubensisConnect (${nodeUrl} ${String(networkByte)})`,
        );
      }
      return origin.apply(this, args);
    });
  };
}
