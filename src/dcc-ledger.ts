/**
 * High-level DecentralChain Ledger hardware wallet integration.
 *
 * {@link DCCLedger} manages the device lifecycle (connect, disconnect, reconnect)
 * and exposes an ergonomic API for key derivation and signing. It delegates
 * low-level APDU framing to the {@link DCC} class internally.
 *
 * @example
 * ```ts
 * import { DCCLedger } from '@decentralchain/ledger';
 * import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
 *
 * const ledger = new DCCLedger({ transport: TransportWebUSB });
 * await ledger.tryConnect();
 *
 * const user = await ledger.getUserDataById(0);
 * console.log(user.address, user.publicKey);
 * ```
 *
 * @module dcc-ledger
 */

import { listen } from '@ledgerhq/logs';
import { DCC } from './DCC.js';
import type {
  DCCLedgerOptions,
  LedgerTransport,
  LedgerTransportFactory,
  SignData,
  SignOrderData,
  SignTxData,
  User,
} from './types.js';

/**
 * BIP-44 derivation path prefix.
 *
 * NOTE: The coin type `5741564` is the registered BIP-44 coin type used by
 * Ledger firmware. This MUST NOT be changed — doing so would cause existing
 * Ledger users to derive different addresses.
 */
const ADDRESS_PREFIX = "44'/5741564'/0'/0'/";

/**
 * High-level DCC Ledger integration.
 *
 * Manages transport lifecycle (connect / disconnect / reconnect) and exposes
 * a user-friendly API for key derivation, transaction signing, and device
 * health-checking.
 */
export class DCCLedger {
  /** Whether the transport has been successfully initialised. */
  public ready: boolean;

  private _dccLibPromise: Promise<DCC> | null;
  private _initTransportPromise: Promise<LedgerTransport> | null;
  private readonly _debug: boolean;
  private readonly _openTimeout: number | undefined;
  private readonly _listenTimeout: number | undefined;
  private readonly _exchangeTimeout: number | undefined;
  private readonly _networkCode: number;
  private _error: unknown;
  private readonly _transport: LedgerTransportFactory;
  private _unsubscribeLog: (() => void) | null = null;

  /**
   * Fire-and-forget a reconnect attempt.
   *
   * All background reconnects MUST go through this helper so that
   * promise rejections are always caught — an unhandled rejection
   * in Node.js will terminate the process.
   */
  private _backgroundReconnect(): void {
    void this.tryConnect().catch(() => {
      /* Reconnect is best-effort; errors already logged inside tryConnect. */
    });
  }

  /**
   * Create a new DCCLedger instance.
   *
   * @param options - Configuration including a required `transport` factory.
   * @throws {TypeError} If `options.transport` is not provided.
   */
  constructor(options: DCCLedgerOptions) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime guard for JS callers
    if (!options.transport) {
      throw new TypeError(
        'DCCLedger requires a transport factory. ' +
          'Pass a @ledgerhq/hw-transport-* class, e.g. { transport: TransportWebUSB }.',
      );
    }

    this.ready = false;
    this._networkCode = options.networkCode ?? 76;
    if (!Number.isInteger(this._networkCode) || this._networkCode < 0 || this._networkCode > 255) {
      throw new RangeError(
        `networkCode must be an integer in [0, 255], got ${String(this._networkCode)}`,
      );
    }
    this._dccLibPromise = null;
    this._initTransportPromise = null;
    this._debug = options.debug ?? false;
    this._openTimeout = options.openTimeout;
    this._listenTimeout = options.listenTimeout;
    this._exchangeTimeout = options.exchangeTimeout;
    this._error = null;
    this._transport = options.transport;

    this.tryConnect().catch((e: unknown) => {
      console.warn('Ledger lib is not available', e);
    });
  }

  /**
   * (Re-)connect to the Ledger device and initialise the DCC application.
   *
   * @throws If the transport cannot be opened or the DCC app is unavailable.
   */
  async tryConnect(): Promise<void> {
    try {
      await this.disconnect();
      this._initTransport();
      this._initDCCLib();
      await Promise.all([this._initTransportPromise, this._dccLibPromise]);
    } catch (cause: unknown) {
      throw new Error('Failed to connect to Ledger device', { cause });
    }
  }

  /**
   * Close the active transport connection and reset internal state.
   */
  async disconnect(): Promise<void> {
    const transportPromise = this._initTransportPromise;
    this._initTransportPromise = null;
    this._dccLibPromise = null;
    this._unsubscribeLog?.();
    this._unsubscribeLog = null;
    if (transportPromise) {
      try {
        const transport = await transportPromise;
        await transport.close();
      } catch (_e: unknown) {
        // Swallow — transport may already be closed.
      }
    }
  }

  /**
   * Get the initialised DCC protocol instance, reconnecting if necessary.
   *
   * @returns The {@link DCC} protocol wrapper.
   */
  async getTransport(): Promise<DCC> {
    try {
      if (!this._dccLibPromise) {
        throw new Error('Not connected');
      }
      return await this._dccLibPromise;
    } catch (cause: unknown) {
      await this.tryConnect();
      if (!this._dccLibPromise) {
        throw new Error('Failed to reconnect to Ledger device', { cause });
      }
      return this._dccLibPromise;
    }
  }

  /**
   * Derive wallet data (public key, address) for an account index.
   *
   * @param id - Zero-based account index.
   * @returns User data including public key, address, path, and ID.
   */
  async getUserDataById(id: number): Promise<User> {
    try {
      const dcc = await this.getTransport();
      const path = this.getPathById(id);
      const userData = await dcc.getWalletPublicKey(path, false);
      return { ...userData, id, path };
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Query the installed DCC application version on the device.
   *
   * @returns Semantic version components `[major, minor, patch]`.
   */
  async getVersion(): Promise<number[]> {
    try {
      const dcc = await this.getTransport();
      return await dcc.getVersion();
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Retrieve wallet data for a range of consecutive account indices.
   *
   * @param from  - Starting account index (inclusive).
   * @param limit - Number of accounts to retrieve.
   * @returns Array of user objects in order.
   */
  async getPaginationUsersData(from: number, limit: number): Promise<User[]> {
    if (!Number.isInteger(from) || from < 0) {
      throw new RangeError(`'from' must be a non-negative integer, got ${String(from)}`);
    }
    if (!Number.isInteger(limit) || limit < 0) {
      throw new RangeError(`'limit' must be a non-negative integer, got ${String(limit)}`);
    }

    const usersData: User[] = [];

    try {
      for (let id = from; id < from + limit; id++) {
        const userData = await this.getUserDataById(id);
        usersData.push(userData);
      }
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }

    return usersData;
  }

  /**
   * Sign a transaction.
   *
   * @param userId - Account index for key derivation.
   * @param sData  - Transaction payload.
   * @returns Base58-encoded signature.
   */
  async signTransaction(userId: number, sData: SignTxData): Promise<string> {
    const path = this.getPathById(userId);
    try {
      const dcc = await this.getTransport();
      return await dcc.signTransaction(path, sData);
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Sign an exchange order.
   *
   * @param userId - Account index for key derivation.
   * @param sData  - Order payload.
   * @returns Base58-encoded signature.
   */
  async signOrder(userId: number, sData: SignOrderData): Promise<string> {
    const path = this.getPathById(userId);
    try {
      const dcc = await this.getTransport();
      return await dcc.signOrder(path, sData);
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Sign arbitrary data bytes.
   *
   * @param userId - Account index for key derivation.
   * @param sData  - Data payload.
   * @returns Base58-encoded signature.
   */
  async signSomeData(userId: number, sData: SignData): Promise<string> {
    const path = this.getPathById(userId);
    try {
      const dcc = await this.getTransport();
      return await dcc.signSomeData(path, sData);
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Sign a request payload.
   *
   * @param userId - Account index for key derivation.
   * @param sData  - Data payload.
   * @returns Base58-encoded signature.
   */
  async signRequest(userId: number, sData: SignData): Promise<string> {
    const path = this.getPathById(userId);
    try {
      const dcc = await this.getTransport();
      return await dcc.signRequest(path, sData);
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Sign a text message.
   *
   * @param userId  - Account index for key derivation.
   * @param message - ASCII message string.
   * @returns Base58-encoded signature.
   */
  async signMessage(userId: number, message: string): Promise<string> {
    const path = this.getPathById(userId);
    const encoder = new TextEncoder();
    const sData: SignData = { dataBuffer: encoder.encode(message) };
    try {
      const dcc = await this.getTransport();
      return await dcc.signMessage(path, sData);
    } catch (e: unknown) {
      this._backgroundReconnect();
      this._error = e;
      throw e;
    }
  }

  /**
   * Return the last error encountered during a Ledger operation, or `null`.
   */
  getLastError(): unknown {
    return this._error;
  }

  /**
   * Probe whether the Ledger device is connected and the DCC app is open.
   *
   * @returns `true` if a basic key derivation succeeds; `false` otherwise.
   */
  async probeDevice(): Promise<boolean> {
    this._error = null;

    try {
      if (!this.ready) {
        await this.tryConnect();
      }
      await this.getUserDataById(1);
    } catch (e: unknown) {
      this._error = e;
      return false;
    }

    return true;
  }

  /**
   * Build the full BIP-44 derivation path for an account index.
   *
   * @param id - Zero-based account index.
   * @returns Path string (e.g. `"44'/5741564'/0'/0'/3'"`).
   */
  getPathById(id: number): string {
    if (!Number.isInteger(id) || id < 0 || id > 0x7fffffff) {
      throw new RangeError(`Account ID must be a non-negative integer, got ${String(id)}`);
    }
    return `${ADDRESS_PREFIX}${String(id)}'`;
  }

  /** Initialise the underlying hardware transport and apply settings. */
  private _initTransport(): void {
    this.ready = false;
    this._initTransportPromise = this._transport
      .create(this._openTimeout, this._listenTimeout)
      .then((transport) => {
        if (this._debug) {
          this._unsubscribeLog?.();
          this._unsubscribeLog = listen((log: { type: string }) => {
            console.log(log);
          });
        }
        if (this._exchangeTimeout !== undefined) {
          transport.setExchangeTimeout(this._exchangeTimeout);
        }
        return transport;
      });
    void this._initTransportPromise.catch((e: unknown) => {
      console.warn("Can't init transport", e);
    });
  }

  /** Wrap the raw transport in a DCC protocol handler. */
  private _initDCCLib(): void {
    if (!this._initTransportPromise) return;
    this._dccLibPromise = this._initTransportPromise.then((transport) => {
      this.ready = true;
      return new DCC(transport, this._networkCode);
    });
  }
}

/** Convenience alias. */
export { DCCLedger as Ledger };
