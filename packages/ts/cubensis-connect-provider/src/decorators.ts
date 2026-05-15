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

type TProviderCubensisThis = {
  _api: CubensisConnect.ICubensisConnectApi;
  _options: ConnectOptions;
};

/**
 * Method decorator that validates the CubensisConnect extension is connected
 * to the same network as the Signer before executing the decorated method.
 *
 * Compares the node URL and network byte from CubensisConnect's public state
 * against the Signer's connect options. Throws if they don't match.
 *
 * @throws {Error} If CubensisConnect network doesn't match Signer connect options
 */
export function ensureNetwork<This extends TProviderCubensisThis, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Promise<Awaited<Return>> {
  return function (this: This, ...args: Args): Promise<Awaited<Return>> {
    const api = this._api;
    return api
      .publicState()
      .then((state: CubensisConnect.IPublicStateResponse): Promise<Awaited<Return>> => {
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
        return Promise.resolve(target.call(this, ...args)) as Promise<Awaited<Return>>;
      });
  };
}
