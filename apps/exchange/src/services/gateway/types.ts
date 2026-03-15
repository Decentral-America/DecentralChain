/**
 * Gateway Service Type Definitions
 * Type definitions for Bitcoin gateway functionality (BTC ↔ DecentralChain)
 */
import { type BigNumber } from '@decentralchain/bignumber';

/**
 * Gateway configuration from network config
 */
export interface GatewayConfig {
  url: string;
  isThirdParty: boolean;
  regex: string;
  otherNetwork?: string;
  ticker?: string;
}

/**
 * Deposit details returned from gateway API
 * Used for depositing external assets to DecentralChain
 */
export interface DepositDetails {
  address: string; // External blockchain address (BTC)
  minimumAmount: BigNumber;
  maximumAmount: BigNumber;
  gatewayFee: BigNumber;
  disclaimerLink?: string | undefined;
  minRecoveryAmount?: BigNumber | undefined;
  recoveryFee?: BigNumber | undefined;
  supportEmail?: string | undefined;
  operator?: string | undefined;
  walletAddress: string; // User's DecentralChain address
  gatewayType: 'deposit' | 'round-robin';
  gatewayUrl: string;
  expiry?: Date; // For round-robin only
}

/**
 * Withdraw details returned from gateway API
 * Used for withdrawing wrapped assets from DecentralChain to external blockchain
 */
export interface WithdrawDetails {
  address: string; // Gateway's DecentralChain address
  attachment: string; // Target external address
  minimumAmount: BigNumber;
  maximumAmount: BigNumber;
  gatewayFee: BigNumber;
  gatewayType: string;
  gatewayUrl: string;
}

/**
 * Gateway operation type
 */
export type GatewayType = 'deposit' | 'withdraw';
