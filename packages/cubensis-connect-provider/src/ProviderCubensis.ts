/**
 * @module @decentralchain/provider-cubensis
 *
 * CubensisConnect browser wallet provider for DCC Signer.
 * Implements the Provider interface to bridge Signer with the CubensisConnect browser extension.
 */

import type {
  AuthEvents,
  ConnectOptions,
  Handler,
  Provider,
  SignedTx,
  SignerTx,
  TypedData,
  UserData,
} from '@decentralchain/signer';
import { EventEmitter } from 'typed-ts-events';
import { base16Encode, base64Encode, randomBytes, stringToBytes } from './crypto';
import { keeperTxFactory, signerTxFactory } from './adapter';
import { ensureNetwork } from './decorators';
import { calculateFee } from './utils';
import { TRANSACTION_TYPE } from './transaction-type';

/**
 * CubensisConnect browser wallet provider for DCC Signer.
 *
 * Bridges the Signer protocol with the CubensisConnect browser extension,
 * enabling transaction signing, authentication, and message signing
 * through the user's browser wallet.
 *
 * @example
 * ```ts
 * import { ProviderCubensis } from '@decentralchain/provider-cubensis';
 * import { Signer } from '@decentralchain/signer';
 *
 * const signer = new Signer({ NODE_URL: 'https://mainnet-node.decentralchain.io' });
 * signer.setProvider(new ProviderCubensis());
 * ```
 */
export class ProviderCubensis implements Provider {
  /** The currently authenticated user, or `null` if not logged in. */
  public user: UserData | null = null;

  private readonly _authData: CubensisConnect.IAuthData;
  private _api!: CubensisConnect.TCubensisConnectApi;
  private _options: ConnectOptions = {
    NETWORK_BYTE: '?'.charCodeAt(0),
    NODE_URL: 'https://mainnet-node.decentralchain.io',
  };
  private readonly _emitter: EventEmitter<AuthEvents> = new EventEmitter<AuthEvents>();
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

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (window.CubensisConnect) {
        void window.CubensisConnect.initialPromise
          .then((api: CubensisConnect.TCubensisConnectApi) => {
            this._api = api;
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
    return this._api.auth(this._authData).then((auth) => {
      this.user = { address: auth.address, publicKey: auth.publicKey };

      (this._emitter as unknown as { trigger: (event: string, data: unknown) => void }).trigger(
        'login',
        this.user,
      );
      return this.user;
    });
  }

  /** Logs out the current user and emits a `logout` event. */
  public logout(): Promise<void> {
    this.user = null;

    (this._emitter as unknown as { trigger: (event: string, data: unknown) => void }).trigger(
      'logout',
      void 0,
    );
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
    return this._api
      .signCustomData({
        version: 1,
        binary: 'base64:' + base64Encode(stringToBytes(String(data))),
      })
      .then((data) => data.signature);
  }

  /**
   * Signs typed/structured data using CubensisConnect.
   *
   * @param data - Array of typed data entries to sign
   * @returns The base64-encoded signature
   */
  @ensureNetwork
  public signTypedData(data: TypedData[]): Promise<string> {
    return this._api
      .signCustomData({
        version: 2,
        data: data as CubensisConnect.TTypedData[],
      })
      .then((data) => data.signature);
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
      return this._api
        .signTransaction(keeperTxFactory(firstTx))
        .then((data) => [signerTxFactory(data)]) as Promise<SignedTx<T>>;
    }

    return this._api
      .signTransactionPackage(
        toSignWithFee.map((tx) =>
          keeperTxFactory(tx),
        ) as CubensisConnect.TSignTransactionPackageData,
      )
      .then((data) => data.map((tx) => signerTxFactory(tx))) as Promise<SignedTx<T>>;
  }

  /** Resolves the current user's public key, falling back to the extension's state. */
  private _publicKeyPromise(): Promise<string | undefined> {
    return this.user?.publicKey
      ? Promise.resolve(this.user.publicKey)
      : this._api.publicState().then((state) => state.account?.publicKey);
  }

  /** Ensures invoke-script transactions have a fee, calculating via node API if missing. */
  private async _txWithFee(tx: SignerTx): Promise<SignerTx> {
    return tx.type === TRANSACTION_TYPE.INVOKE_SCRIPT && !tx.fee
      ? calculateFee(this._options.NODE_URL, {
          ...tx,
          payment: tx.payment ?? [],
          senderPublicKey: await this._publicKeyPromise(),
        })
      : Promise.resolve(tx);
  }
}
