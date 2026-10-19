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

type MethodDecorator = (target: never, context: ClassMethodDecoratorContext) => unknown;

/**
 * Applies TC39-style method decorators to `ctor.prototype[name]` at runtime.
 *
 * These guards used to be attached with `@decorator` syntax, but tsdown/rolldown
 * only lowers legacy decorators, so standard decorator syntax reached `dist/`
 * verbatim and Node 24 could not parse the published module. Applying the same
 * decorator functions here keeps their behaviour and emits plain JavaScript.
 *
 * `decorators` are listed top-to-bottom as they would appear above the method;
 * like the language feature, the one closest to the method is applied first.
 */
export function applyMethodDecorators(
  ctor: { prototype: object },
  name: string,
  ...decorators: MethodDecorator[]
): void {
  const proto = ctor.prototype as Record<string, unknown>;
  const original = proto[name];
  if (typeof original !== 'function') {
    throw new TypeError(`applyMethodDecorators: ${name} is not a method`);
  }
  const context = {
    access: {
      get: (obj: object) => (obj as Record<string, unknown>)[name],
      has: (obj: object) => name in obj,
    },
    addInitializer: () => undefined,
    kind: 'method',
    metadata: undefined,
    name,
    private: false,
    static: false,
  } as unknown as ClassMethodDecoratorContext;
  let method: unknown = original;
  for (const decorate of [...decorators].reverse()) {
    method = decorate(method as never, context);
  }
  Object.defineProperty(proto, name, {
    configurable: true,
    enumerable: false,
    value: method,
    writable: true,
  });
}
