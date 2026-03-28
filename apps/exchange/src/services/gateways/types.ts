/**
 * Gateway Service Type Definitions
 *
 * Defines interfaces for crypto gateway integration (deposit/withdrawal)
 * Matches Angular's gateway architecture for BTC, ETH, USDT, and other crypto assets
 */

import { type BigNumber } from '@decentralchain/bignumber';

/**
 * Asset interface (minimal definition for gateway operations)
 */
export interface GatewayAsset {
  id: string;
  name: string;
  displayName: string;
  precision: number;
}

/**
 * Gateway deposit/withdrawal details
 * Returned by gateway providers for both deposit and withdrawal operations
 */
export interface IGatewayDetails {
  /** Gateway address to send funds to (for deposits) or receive from (for withdrawals) */
  address: string;

  /** Optional attachment/memo for the transaction */
  attachment?: string | undefined;

  /** Minimum amount allowed for this operation */
  minimumAmount: BigNumber;

  /** Maximum amount allowed for this operation */
  maximumAmount: BigNumber;

  /** Gateway fee for this operation */
  gatewayFee: BigNumber;

  /** Exchange rate (if applicable, e.g., for wrapped tokens) */
  exchangeRate?: BigNumber | undefined;

  /** Additional provider-specific data */
  [key: string]: unknown;
}

/**
 * Gateway Service Provider Interface
 * All gateway providers (DCCGateway, Coinomat, etc.) must implement this
 */
export interface IGatewayService {
  /**
   * Get deposit details for an asset
   * @param asset - Asset to deposit
   * @param userDCCAddress - User's DCC address to receive deposited tokens
   * @returns Deposit details including gateway address and fees
   */
  getDepositDetails(asset: GatewayAsset, userDCCAddress: string): Promise<IGatewayDetails>;

  /**
   * Get withdrawal details for an asset
   * @param asset - Asset to withdraw
   * @param targetAddress - Target address in the external blockchain (BTC, ETH, etc.)
   * @param paymentId - Optional payment ID for certain cryptocurrencies (XMR, etc.)
   * @returns Withdrawal details including fees and limits
   */
  getWithdrawDetails(
    asset: GatewayAsset,
    targetAddress: string,
    paymentId?: string,
  ): Promise<IGatewayDetails>;

  /**
   * Get send details (DCC Gateway specific)
   * @param asset - Asset to send
   * @param targetAddress - Target address
   * @returns Send details
   */
  getSendDetails?(asset: GatewayAsset, targetAddress: string): Promise<IGatewayDetails>;

  /**
   * Get SEPA details (Coinomat specific)
   * @param userDCCAddress - User's DCC address
   * @returns SEPA deposit details
   */
  getSepaDetails?(userDCCAddress: string): Promise<IGatewayDetails>;

  /**
   * Get all supported assets for this gateway
   * @returns Map of asset ID to gateway config
   */
  getAll?(): Record<string, unknown>;
}

/**
 * Gateway configuration from mainnet.json
 */
export interface GatewayConfig {
  /** Gateway service URL */
  url: string;

  /** Whether this is a third-party gateway (affects UI warnings) */
  isThirdParty: boolean;

  /** Regex pattern for validating target addresses */
  regex: string;

  /** Gateway type identifier */
  gateway_type?: string;

  /** Gateway ID for provider lookup */
  gateway_id?: string;

  /** DCC asset ID for this gateway asset */
  dcc_asset_id?: string;

  /** Original asset ID in external blockchain */
  assetId?: string;
}

/**
 * Gateway error codes
 */
export const GatewayErrorCode = {
  AMOUNT_TOO_HIGH: 1004,
  AMOUNT_TOO_LOW: 1003,
  GATEWAY_BLOCKED: 1001,
  GATEWAY_UNAVAILABLE: 1005,
  INVALID_ADDRESS: 1002,
  UNKNOWN_ERROR: 9999,
} as const;
export type GatewayErrorCode = (typeof GatewayErrorCode)[keyof typeof GatewayErrorCode];

/**
 * Gateway error type
 */
export interface GatewayError {
  code: GatewayErrorCode;
  message: string;
  details?: unknown;
}
