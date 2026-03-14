/**
 * Shared type definitions for the DecentralChain Ledger integration library.
 *
 * @module types
 */

/**
 * Minimal interface for a Ledger transport instance.
 *
 * Compatible with all `@ledgerhq/hw-transport-*` implementations.
 */
export interface LedgerTransport {
  /** Send an APDU command to the device. */
  send(cla: number, ins: number, p1: number, p2: number, data?: Uint8Array): Promise<Uint8Array>;

  /** Close the transport connection. */
  close(): Promise<void>;

  /** Set the exchange timeout in milliseconds. */
  setExchangeTimeout(timeout: number): void;

  /** Decorate API methods with the transport's app binding. */
  decorateAppAPIMethods(self: unknown, methods: string[], appId: string): void;
}

/**
 * Factory for creating Ledger transport instances.
 *
 * All `@ledgerhq/hw-transport-*` packages expose a static `create()` method
 * matching this shape.
 */
export interface LedgerTransportFactory {
  create(openTimeout?: number, listenTimeout?: number): Promise<LedgerTransport>;
}

/**
 * User wallet data returned directly from the Ledger device.
 */
export interface UserData {
  /** Public key in base58 encoding. */
  readonly publicKey: string;
  /** Address in base58 encoding. */
  readonly address: string;
  /** Device status code as a hex string. */
  readonly statusCode: string;
}

/**
 * User data enriched with account ID and derivation path.
 */
export interface User extends UserData {
  /** Account index. */
  readonly id: number;
  /** Full BIP-44 derivation path. */
  readonly path: string;
}

/**
 * Generic data payload to be signed by the Ledger device.
 */
export interface SignData {
  /** Raw bytes to sign. */
  dataBuffer: Uint8Array;
}

/**
 * Transaction data payload to be signed by the Ledger device.
 *
 * The device uses `dataType` and `dataVersion` to parse and display
 * human-readable transaction details on-screen.
 */
export interface SignTxData extends SignData {
  /** Transaction type code. */
  dataType: number;
  /** Transaction format version. */
  dataVersion: number;
  /** Decimal precision for the primary amount display (default: 8). */
  amountPrecision?: number | undefined;
  /** Decimal precision for a secondary amount display. */
  amount2Precision?: number | undefined;
  /** Decimal precision for fee display (default: 8). */
  feePrecision?: number | undefined;
}

/**
 * Order data payload to be signed by the Ledger device.
 */
export interface SignOrderData extends SignData {
  /** Order format version. */
  dataVersion: number;
  /** Decimal precision for the primary amount display. */
  amountPrecision?: number | undefined;
  /** Decimal precision for the secondary amount display (firmware >= 1.2.0). */
  amount2Precision?: number | undefined;
  /** Decimal precision for fee display. */
  feePrecision?: number | undefined;
}

/**
 * Configuration options for {@link DCCLedger}.
 */
export interface DCCLedgerOptions {
  /**
   * Ledger transport factory.
   *
   * Pass any `@ledgerhq/hw-transport-*` class (e.g. `TransportWebUSB`).
   * The factory's static `create()` method will be called to open a connection.
   */
  transport: LedgerTransportFactory;

  /** Enable debug logging of binary exchange (default: `false`). */
  debug?: boolean | undefined;

  /** Timeout in ms for waiting for a connection. */
  openTimeout?: number | undefined;

  /** Timeout in ms for waiting listen request to device. */
  listenTimeout?: number | undefined;

  /** Timeout in ms for exchange calls. */
  exchangeTimeout?: number | undefined;

  /** DCC network code (default: `76` — mainnet). */
  networkCode?: number | undefined;
}

/**
 * Ledger device error with status code.
 */
export interface LedgerError {
  /** Human-readable error description. */
  readonly error: string;
  /** Numeric status code from the device. */
  readonly status: number;
}
