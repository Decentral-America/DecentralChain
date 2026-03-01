/**
 * Low-level DCC ↔ Ledger APDU protocol implementation.
 *
 * This class handles the binary framing, path splitting, and chunked
 * signing protocol. Higher-level consumers should use {@link DCCLedger}
 * instead of instantiating this class directly.
 *
 * @module dcc
 */

import { base58Encode, bytesToAscii, bytesToHex, concatBytes, uint32ToBytesBE } from './utils.js';
import type {
  LedgerError,
  LedgerTransport,
  SignData,
  SignOrderData,
  SignTxData,
  UserData,
} from './types.js';

/** Internal protocol configuration. */
/**
 * Human-readable descriptions for Ledger status-word codes.
 *
 * These are returned in {@link LedgerError} so callers can display
 * meaningful diagnostics instead of raw hex.
 */
const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  0x9000: 'OK',
  0x9100: 'User cancelled',
  0x9102: 'Deprecated sign protocol',
  0x9103: 'Incorrect precision value',
  0x9104: 'Incorrect transaction type/version',
  0x9105: 'Protobuf decoding failed',
  0x9106: 'Byte decoding failed',
  0x6982: 'Security status not satisfied',
  0x6985: 'Conditions not satisfied',
  0x6986: 'Device is locked',
  0x6990: 'Buffer overflow',
  0x6a86: 'Incorrect P1/P2',
  0x6d00: 'Instruction not supported',
  0x6e00: 'CLA not supported',
};

const DCC_CONFIG = {
  /** Status word indicating success. */
  SW_OK: 0x9000,
  /**
   * Ledger app identifier.
   *
   * NOTE: This MUST remain `'WAVES'` — it is the firmware application name
   * registered on the Ledger device. Changing it would break communication
   * with all existing Ledger firmware. Do NOT rename unless DecentralChain
   * ships its own custom Ledger app.
   */
  SECRET: 'WAVES',
  PUBLIC_KEY_LENGTH: 32,
  ADDRESS_LENGTH: 35,
  STATUS_LENGTH: 2,
  SIGNED_CODES: {
    ORDER: 0xfc,
    SOME_DATA: 0xfd,
    REQUEST: 0xfe,
    MESSAGE: 0xff,
  },
  MAX_SIZE: 128,
  /** Default decimal precision for DCC token amounts. */
  DCC_PRECISION: 8,
  /** Mainnet chain code (`'L'` = 76). */
  MAIN_NET_CODE: 76,
} as const;

// Runtime immutability — prevent malicious or accidental mutation of protocol constants.
Object.freeze(DCC_CONFIG);
Object.freeze(DCC_CONFIG.SIGNED_CODES);

/** Validate that a value fits in a single unsigned byte (0–255). */
function assertUint8(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be an integer in [0, 255], got ${String(value)}`);
  }
}

/**
 * Low-level interface to the DCC Ledger application.
 *
 * Wraps a Ledger transport instance and implements the APDU protocol
 * for key derivation and transaction signing.
 */
export class DCC {
  protected readonly transport: LedgerTransport;
  protected readonly networkCode: number;
  protected _version: Promise<number[]> | null = null;

  /**
   * @param transport   - An opened Ledger transport instance.
   * @param networkCode - Chain network code (default: `76` for mainnet).
   * @throws {RangeError} If `networkCode` is not a valid uint8 (0–255).
   */
  constructor(transport: LedgerTransport, networkCode: number = DCC_CONFIG.MAIN_NET_CODE) {
    assertUint8('networkCode', networkCode);
    this.transport = transport;
    this.networkCode = networkCode;
    this.decorateClassByTransport();
  }

  /** Bind lifecycle methods to the transport's app context. */
  private decorateClassByTransport(): void {
    this.transport.decorateAppAPIMethods(
      this,
      ['getWalletPublicKey', '_signData', 'getVersion'],
      DCC_CONFIG.SECRET,
    );
  }

  /**
   * Retrieve the wallet public key and address for a BIP-44 path.
   *
   * @param path   - BIP-44 derivation path (e.g. `"44'/5741564'/0'/0'/0'"`).
   * @param verify - If `true`, the device will display the address for confirmation.
   * @returns Public key, address, and device status code.
   */
  async getWalletPublicKey(path: string, verify = false): Promise<UserData> {
    const buffer = DCC.splitPath(path);
    const p1 = verify ? 0x80 : 0x00;
    const response = await this.transport.send(0x80, 0x04, p1, this.networkCode, buffer);

    const minLength =
      DCC_CONFIG.PUBLIC_KEY_LENGTH + DCC_CONFIG.ADDRESS_LENGTH + DCC_CONFIG.STATUS_LENGTH;
    if (response.length < minLength) {
      throw new Error(
        `Invalid response: expected at least ${String(minLength)} bytes, got ${String(response.length)}`,
      );
    }

    const isError = DCC.checkError([...response.slice(-DCC_CONFIG.STATUS_LENGTH)]);
    if (isError) {
      throw new Error(isError.error, { cause: isError });
    }

    const publicKey = base58Encode(response.slice(0, DCC_CONFIG.PUBLIC_KEY_LENGTH));
    const address = bytesToAscii(
      response.slice(
        DCC_CONFIG.PUBLIC_KEY_LENGTH,
        DCC_CONFIG.PUBLIC_KEY_LENGTH + DCC_CONFIG.ADDRESS_LENGTH,
      ),
    );
    const statusCode = bytesToHex(response.slice(-DCC_CONFIG.STATUS_LENGTH));

    return { publicKey, address, statusCode };
  }

  /**
   * Sign a transaction.
   *
   * The Ledger device will parse the transaction bytes and display
   * human-readable details (type, amount, fee, recipient, etc.).
   *
   * @param path  - BIP-44 derivation path.
   * @param sData - Transaction data including type, version, and raw bytes.
   * @returns Base58-encoded signature.
   */
  async signTransaction(path: string, sData: SignTxData): Promise<string> {
    const dataForDevice = await this._fillDataForSign(path, sData);
    return this._signData(dataForDevice);
  }

  /**
   * Sign an order.
   *
   * @param path  - BIP-44 derivation path.
   * @param sOData - Order data including version and raw bytes.
   * @returns Base58-encoded signature.
   */
  async signOrder(path: string, sOData: SignOrderData): Promise<string> {
    const sData: SignTxData = {
      ...sOData,
      dataType: DCC_CONFIG.SIGNED_CODES.ORDER,
    };
    const dataForDevice = await this._fillDataForSign(path, sData);
    return this._signData(dataForDevice);
  }

  /**
   * Sign arbitrary data bytes.
   *
   * The Ledger device will NOT display parsed details — only a raw data warning.
   *
   * @param path  - BIP-44 derivation path.
   * @param sOData - Data payload.
   * @returns Base58-encoded signature.
   */
  async signSomeData(path: string, sOData: SignData): Promise<string> {
    const sData: SignTxData = {
      ...sOData,
      dataType: DCC_CONFIG.SIGNED_CODES.SOME_DATA,
      dataVersion: 0,
      amountPrecision: 0,
      feePrecision: 0,
    };
    const dataForDevice = await this._fillDataForSign(path, sData);
    return this._signData(dataForDevice);
  }

  /**
   * Sign a request payload.
   *
   * @param path  - BIP-44 derivation path.
   * @param sOData - Data payload.
   * @returns Base58-encoded signature.
   */
  async signRequest(path: string, sOData: SignData): Promise<string> {
    const sData: SignTxData = {
      ...sOData,
      dataType: DCC_CONFIG.SIGNED_CODES.REQUEST,
      dataVersion: 0,
      amountPrecision: 0,
      feePrecision: 0,
    };
    const dataForDevice = await this._fillDataForSign(path, sData);
    return this._signData(dataForDevice);
  }

  /**
   * Sign a text message.
   *
   * @param path  - BIP-44 derivation path.
   * @param sOData - Data payload.
   * @returns Base58-encoded signature.
   */
  async signMessage(path: string, sOData: SignData): Promise<string> {
    const sData: SignTxData = {
      ...sOData,
      dataType: DCC_CONFIG.SIGNED_CODES.MESSAGE,
      dataVersion: 0,
      amountPrecision: 0,
      feePrecision: 0,
    };
    const dataForDevice = await this._fillDataForSign(path, sData);
    return this._signData(dataForDevice);
  }

  /**
   * Query the Ledger application version.
   *
   * The result is cached after the first successful call and cleared on error.
   *
   * @returns Semantic version components `[major, minor, patch]`.
   */
  async getVersion(): Promise<number[]> {
    this._version ??= this.transport.send(0x80, 0x06, 0, 0).then((buf) => [...buf]);

    try {
      const version = await this._version;
      const isError = DCC.checkError(version.slice(-2));

      if (isError) {
        throw new Error(isError.error, { cause: isError });
      }

      return version.slice(0, -2);
    } catch (e: unknown) {
      this._version = null;
      throw e;
    }
  }

  /**
   * Build the full binary payload for a signing request, including path prefix,
   * precision metadata, and data buffer — formatted for the device's firmware version.
   *
   * @throws {RangeError} If any precision or type value is outside uint8 range.
   * @throws {Error} If `dataBuffer` is empty.
   */
  protected async _fillDataForSign(path: string, sData: SignTxData): Promise<Uint8Array> {
    if (sData.dataBuffer.byteLength === 0) {
      throw new Error('dataBuffer must not be empty');
    }
    const appVersion = await this.getVersion();
    const amountPrecision = sData.amountPrecision ?? DCC_CONFIG.DCC_PRECISION;
    const amount2Precision = sData.amount2Precision ?? 0;
    const feePrecision = sData.feePrecision ?? DCC_CONFIG.DCC_PRECISION;

    assertUint8('amountPrecision', amountPrecision);
    assertUint8('amount2Precision', amount2Precision);
    assertUint8('feePrecision', feePrecision);
    assertUint8('dataType', sData.dataType);
    assertUint8('dataVersion', sData.dataVersion);

    const major = appVersion[0] ?? 0;
    const minor = appVersion[1] ?? 0;
    const patch = appVersion[2] ?? 0;

    const fwVersion = major * 10000 + minor * 100 + patch;

    if (fwVersion >= 10200) {
      // Firmware >= 1.2.0: includes amount2Precision, quadruple data buffer
      const prefixData = concatBytes(
        DCC.splitPath(path),
        new Uint8Array([
          amountPrecision,
          amount2Precision,
          feePrecision,
          sData.dataType,
          sData.dataVersion,
        ]),
        uint32ToBytesBE(sData.dataBuffer.byteLength),
      );
      return concatBytes(
        prefixData,
        sData.dataBuffer,
        sData.dataBuffer,
        sData.dataBuffer,
        sData.dataBuffer,
      );
    } else if (fwVersion >= 10100) {
      // Firmware >= 1.1.0: no amount2Precision, double data buffer
      const prefixData = concatBytes(
        DCC.splitPath(path),
        new Uint8Array([amountPrecision, feePrecision, sData.dataType, sData.dataVersion]),
        uint32ToBytesBE(sData.dataBuffer.byteLength),
      );
      return concatBytes(prefixData, sData.dataBuffer, sData.dataBuffer);
    } else {
      // Firmware < 1.1.0: no length prefix, single data buffer
      const prefixData = concatBytes(
        DCC.splitPath(path),
        new Uint8Array([amountPrecision, feePrecision, sData.dataType, sData.dataVersion]),
      );
      return concatBytes(prefixData, sData.dataBuffer);
    }
  }

  /**
   * Send a data payload to the device in 123-byte chunks and collect the signature.
   *
   * @param dataBuffer - Full binary payload (path + metadata + tx bytes).
   * @returns Base58-encoded signature.
   * @throws {Error} If the payload is empty or the device returns an empty signature.
   */
  protected async _signData(dataBuffer: Uint8Array): Promise<string> {
    if (dataBuffer.length === 0) {
      throw new Error('Cannot sign empty data payload');
    }
    const maxChunkLength = DCC_CONFIG.MAX_SIZE - 5;
    const dataLength = dataBuffer.length;
    let sendBytes = 0;
    let result: Uint8Array = new Uint8Array(0);

    while (dataLength > sendBytes) {
      const chunkLength = Math.min(dataLength - sendBytes, maxChunkLength);
      const isLastByte = dataLength - sendBytes > maxChunkLength ? 0x00 : 0x80;
      const chainId = this.networkCode;
      const txChunk = dataBuffer.slice(sendBytes, chunkLength + sendBytes);
      sendBytes += chunkLength;
      result = await this.transport.send(0x80, 0x02, isLastByte, chainId, txChunk);
      const isError = DCC.checkError([...result.slice(-2)]);
      if (isError) {
        throw new Error(isError.error, { cause: isError });
      }
    }

    const signature = result.slice(0, -2);
    if (signature.length === 0) {
      throw new Error('Device returned an empty signature');
    }
    return base58Encode(signature);
  }

  /**
   * Check a 2-byte device status code for errors.
   *
   * @param data - Two-element array `[high, low]` of the status word.
   * @returns `null` if OK, or a {@link LedgerError} object.
   */
  static checkError(data: number[]): LedgerError | null {
    const high = data[0] ?? 0;
    const low = data[1] ?? 0;
    const statusCode = high * 256 + low;
    if (statusCode === DCC_CONFIG.SW_OK) {
      return null;
    }
    const message =
      STATUS_MESSAGES[statusCode] ??
      `Unknown error (0x${statusCode.toString(16).padStart(4, '0')})`;
    return { error: message, status: statusCode };
  }

  /**
   * Parse a BIP-44 path string into a binary buffer for the device.
   *
   * @param path - Slash-separated path (e.g. `"44'/5741564'/0'/0'/1'"`).
   *               Elements ending with `'` have the hardened flag set.
   * @returns Binary path buffer (4 bytes per component, big-endian).
   * @throws {Error} If the path is empty or contains invalid components.
   * @throws {RangeError} If a path index is outside the valid BIP-44 range.
   */
  static splitPath(path: string): Uint8Array {
    const result: number[] = [];

    for (const element of path.split('/')) {
      // Skip the conventional 'm' root prefix.
      if (element === 'm') {
        continue;
      }

      const raw = element.endsWith("'") ? element.slice(0, -1) : element;
      const num = parseInt(raw, 10);

      if (!Number.isInteger(num) || num < 0 || String(num) !== raw) {
        throw new Error(
          `Invalid BIP-44 path component "${element}" — ` +
            "each segment must be a non-negative integer optionally followed by '",
        );
      }

      if (num > 0x7fffffff) {
        throw new RangeError(`BIP-44 path index ${String(num)} exceeds maximum (2147483647)`);
      }

      const value = element.endsWith("'") ? num + 0x80000000 : num;
      result.push(value);
    }

    if (result.length === 0) {
      throw new Error('BIP-44 path must contain at least one component');
    }

    const buffer = new Uint8Array(result.length * 4);
    for (const [index, value] of result.entries()) {
      new DataView(buffer.buffer).setUint32(4 * index, value, false);
    }

    return buffer;
  }
}
