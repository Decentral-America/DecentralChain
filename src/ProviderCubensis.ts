/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * CubensisConnect browser wallet provider for DCC Signer.
 * Implements the Provider interface to bridge Signer with the CubensisConnect browser extension.
 */

import {
  type AuthEvents,
  type ConnectOptions,
  type Handler,
  type Provider,
  type SignedTx,
  type SignerTx,
  type TOrderArgs,
  type TSignedOrder,
  type TypedData,
  type UserData,
} from '@decentralchain/signer';
import { EventEmitter } from 'typed-ts-events';
import { keeperTxFactory, signerTxFactory } from './adapter';
import { base16Encode, base64Encode, randomBytes, stringToBytes } from './crypto';
import { ensureNetwork } from './decorators';
import { TRANSACTION_TYPE } from './transaction-type';
import { calculateFee } from './utils';

/** Default timeout for wallet extension operations (2 minutes). */
const EXTENSION_TIMEOUT_MS = 120_000;

/**
 * Wraps a Promise with a timeout to prevent indefinite hangs
 * when the wallet extension becomes unresponsive.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`CubensisConnect: ${label} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}

/** EventEmitter subclass that exposes the protected `trigger` as a public `emit`. */
class Emitter<T extends Record<string, unknown>> extends EventEmitter<T> {
  public emit<K extends keyof T>(event: K, data: T[K]): this {
    return this.trigger(event, data);
  }
}

/**
 * CubensisConnect browser wallet provider for DCC Signer.
 *
 * Bridges the Signer protocol with the CubensisConnect browser extension,
 * enabling transaction signing, authentication, and message signing
 * through the user's browser wallet.
 *
 * @example
 * ```ts
 * import { ProviderCubensis } from '@decentralchain/cubensis-connect-provider';
 * import { Signer } from '@decentralchain/signer';
 *
 * const signer = new Signer({ NODE_URL: 'https://mainnet-node.decentralchain.io' });
 * signer.setProvider(new ProviderCubensis());
 * ```
 */
export class ProviderCubensis implements Provider {
  /** The currently authenticated user, or `null` if not logged in. */
  public user: UserData | null = null;

  private _authData: CubensisConnect.IAuthData;
  private _api!: CubensisConnect.ICubensisConnectApi;
  private _options: ConnectOptions = {
    NETWORK_BYTE: '?'.charCodeAt(0),
    NODE_URL: 'https://mainnet-node.decentralchain.io',
  };
  private readonly _emitter: Emitter<AuthEvents> = new Emitter<AuthEvents>();
  private readonly _maxRetries = 10;

  constructor() {
    this._authData = { data: base16Encode(randomBytes(16)) };
  }

  /** Registers an event handler for the specified auth event. */
  public on<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Provider {
    this._emitter.on(event, handler);

    return this;
  }

  /** Registers a one-time event handler for the specified auth event. */
  public once<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Provider {
    this._emitter.once(event, handler);

    return this;
  }

  /** Removes an event handler for the specified auth event. */
  public off<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Provider {
    this._emitter.off(event, handler);

    return this;
  }

  /**
   * Connects to the CubensisConnect browser extension.
   *
   * Polls for the CubensisConnect global on `window` with up to {@link _maxRetries}
   * attempts (100ms interval). Rejects if the extension is not installed.
   *
   * @param options - Network connection options (node URL, network byte)
   * @throws {Error} If CubensisConnect extension is not detected after max retries
   */
  public connect(options: ConnectOptions): Promise<void> {
    this._options = options;

    const poll = (
      resolve: (value: void | PromiseLike<void>) => void,
      reject: (reason: Error) => void,
      attempt = 0,
    ) => {
      if (attempt > this._maxRetries) {
        reject(new Error('CubensisConnect is not installed.'));
        return;
      }

      if (window.CubensisConnect) {
        void window.CubensisConnect.initialPromise
          .then(() => {
            this._api = window.CubensisConnect as CubensisConnect.ICubensisConnectApi;
            resolve();
          })
          .catch((err: unknown) => {
            reject(
              err instanceof Error
                ? err
                : new Error('CubensisConnect initialization failed', { cause: err }),
            );
          });
      } else {
        setTimeout(() => {
          poll(resolve, reject, ++attempt);
        }, 100);
      }
    };

    return new Promise(poll);
  }

  /**
   * Authenticates the user via CubensisConnect.
   *
   * Prompts the wallet extension for auth approval and returns the user's
   * address and public key. Emits a `login` event on success.
   *
   * @returns The authenticated user's address and public key
   * @throws {Error} If network mismatch or user rejects
   */
  @ensureNetwork
  public login(): Promise<UserData> {
    // Regenerate nonce on every login to prevent replay attacks
    this._authData = { data: base16Encode(randomBytes(16)) };
    return withTimeout(
      this._api.auth(this._authData).then((auth: CubensisConnect.IAuthResponse) => {
        this.user = { address: auth.address, publicKey: auth.publicKey };

        this._emitter.emit('login', this.user);
        return this.user;
      }),
      EXTENSION_TIMEOUT_MS,
      'auth',
    );
  }

  /** Logs out the current user and emits a `logout` event. */
  public logout(): Promise<void> {
    this.user = null;

    this._emitter.emit('logout', void 0);
    return Promise.resolve();
  }

  /**
   * Signs an arbitrary message using CubensisConnect.
   *
   * @param data - The message to sign (string or number, converted to string)
   * @returns The base64-encoded signature
   */
  @ensureNetwork
  public signMessage(data: string | number): Promise<string> {
    return withTimeout(
      this._api
        .signCustomData({
          version: 1,
          binary: `base64:${base64Encode(stringToBytes(String(data)))}`,
        })
        .then((data: CubensisConnect.TSignCustomDataResponseV1) => data.signature),
      EXTENSION_TIMEOUT_MS,
      'signMessage',
    );
  }

  /**
   * Signs an exchange order using CubensisConnect.
   *
   * @param data - The order arguments to sign
   * @returns The signed order with id, proofs, and senderPublicKey
   * @throws {Error} If network mismatch or user rejects
   */
  @ensureNetwork
  public signOrder(data: TOrderArgs): Promise<TSignedOrder> {
    return this._api
      .signOrder({
        type: 1002,
        data: {
          matcherPublicKey: data.matcherPublicKey,
          orderType: data.orderType,
          expiration: data.expiration,
          amount: {
            assetId: data.assetPair.amountAsset ?? 'DCC',
            coins: data.amount,
          },
          price: {
            assetId: data.assetPair.priceAsset ?? 'DCC',
            coins: data.price,
          },
          matcherFee: {
            assetId: data.matcherFeeAssetId ?? 'DCC',
            coins: data.matcherFee,
          },
        },
      })
      .then((signedStr: string) => {
        const parsed = JSON.parse(signedStr);
        // Basic structural validation of the signed order
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          typeof parsed.id !== 'string' ||
          !Array.isArray(parsed.proofs) ||
          parsed.proofs.length === 0
        ) {
          throw new Error('Invalid signed order response from CubensisConnect');
        }
        return parsed as TSignedOrder;
      });
  }

  /**
   * Signs typed/structured data using CubensisConnect.
   *
   * @param data - Array of typed data entries to sign
   * @returns The base64-encoded signature
   */
  @ensureNetwork
  public signTypedData(data: TypedData[]): Promise<string> {
    return withTimeout(
      this._api
        .signCustomData({
          version: 2,
          data: data as CubensisConnect.TTypedData[],
        })
        .then((data: CubensisConnect.TSignCustomDataResponseV2) => data.signature),
      EXTENSION_TIMEOUT_MS,
      'signTypedData',
    );
  }

  /**
   * Signs one or more transactions via CubensisConnect.
   *
   * For invoke script transactions without a fee, automatically calculates
   * the fee by querying the connected node.
   *
   * @param toSign - Array of Signer transactions to sign
   * @returns Array of signed transactions
   */
  public async sign<T extends SignerTx>(toSign: T[]): Promise<SignedTx<T>>;
  @ensureNetwork
  public async sign<T extends SignerTx[]>(toSign: T): Promise<SignedTx<T>> {
    const toSignWithFee = await Promise.all(toSign.map((tx) => this._txWithFee(tx)));

    if (toSignWithFee.length === 1) {
      const firstTx = toSignWithFee[0];
      if (!firstTx) {
        throw new Error('Expected at least one transaction to sign');
      }
      return withTimeout(
        this._api
          .signTransaction(keeperTxFactory(firstTx))
          .then((data: string) => [signerTxFactory(data)]) as Promise<SignedTx<T>>,
        EXTENSION_TIMEOUT_MS,
        'signTransaction',
      );
    }

    return withTimeout(
      this._api
        .signTransactionPackage(
          toSignWithFee.map((tx) =>
            keeperTxFactory(tx),
          ) as CubensisConnect.TSignTransactionPackageData,
        )
        .then((data: string[]) => data.map((tx: string) => signerTxFactory(tx))) as Promise<
        SignedTx<T>
      >,
      EXTENSION_TIMEOUT_MS,
      'signTransactionPackage',
    );
  }

  /** Resolves the current user's public key, falling back to the extension's state. */
  private _publicKeyPromise(): Promise<string | undefined> {
    return this.user?.publicKey
      ? Promise.resolve(this.user.publicKey)
      : this._api
          .publicState()
          .then((state: CubensisConnect.IPublicStateResponse) => state.account?.publicKey);
  }

  /** Ensures invoke-script transactions have a fee, calculating via node API if missing. */
  private async _txWithFee(tx: SignerTx): Promise<SignerTx> {
    if (tx.type === TRANSACTION_TYPE.INVOKE_SCRIPT && !tx.fee) {
      const pubKey = await this._publicKeyPromise();
      return calculateFee(this._options.NODE_URL, {
        ...tx,
        payment: tx.payment ?? [],
        ...(pubKey != null && { senderPublicKey: pubKey }),
      });
    }
    return Promise.resolve(tx);
  }
}
