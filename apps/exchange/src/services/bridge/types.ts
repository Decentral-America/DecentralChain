/**
 * Bridge API response shapes.
 *
 * Transcribed from the live mainnet responses on 29 August 2026, not from the
 * handoff document — the handoff describes `GET /deposit/limits` as returning
 * "min and max in human units", and it returns considerably more than that.
 * Where the two disagree, the chain is correct.
 */

/** One registered, on-chain-enabled asset. */
export interface BridgeToken {
  /** DecentralChain asset id of the wrapped token. Use as `payment.assetId`. */
  assetId: string;
  /** Decimals on DecentralChain. Differs from `solDecimals` for SOL and JitoSOL. */
  dccDecimals: number;
  /** `solDecimals - dccDecimals` as a power of ten. 10 for SOL and JitoSOL, else 1. */
  divisor: number;
  /** Always true in practice — the API omits assets disabled on chain. */
  enabled: boolean;
  /** Display name: "Bitcoin", "JitoSOL", "USDC". Not a ticker. */
  name: string;
  /** Decimals on Solana. */
  solDecimals: number;
  /** The Solana mint address. The identity of an asset across both endpoints. */
  splMint: string;
  totalBurned: string;
  totalMinted: string;
}

export interface TokensResponse {
  /** Seconds the API caches this for. 30 — so a disable propagates within 30s. */
  cacheTtlSeconds: number;
  contract: string;
  count: number;
  fetchedAt: number;
  tokens: BridgeToken[];
}

/** Where a limit comes from, and whether it is the one that actually binds. */
export interface LimitSource {
  /** True when this is the limit a deposit will hit first. */
  binding: boolean;
  human: string;
  kind: 'daily' | 'max' | 'min';
  note?: string;
  raw: string;
  source: string;
}

export interface LimitBound {
  human: string;
  raw: string;
  source?: string;
}

export interface DepositLimits {
  /** "active" when deposits are accepted. */
  bridgeStatus: string;
  /** Volume already used against the shared daily cap, in human units. */
  currentDailyVolume: string;
  decimals: number;
  /** True when the bridge is running but impaired. Surface it. */
  degraded: boolean;
  enabled: boolean;
  /** Human-readable, e.g. "~75 seconds". */
  estimatedMintTime: string;
  limits: {
    daily: {
      max: LimitBound;
      remaining: LimitBound;
      used: LimitBound;
    };
    max: LimitBound;
    min: LimitBound;
  };
  /**
   * Shared across every token — not per-asset. A deposit can be rejected
   * because another user consumed the budget.
   */
  maxDailyVolume: string;
  maxDeposit: string;
  minDeposit: string;
  solanaConfirmations: number;
  /** Every limit, with `binding` marking the one that will actually stop you. */
  sources: LimitSource[];
  splMint: string;
  token: string;
  /** "human" — the top-level min/max are display units, not raw. */
  units: string;
  warnings: string[];
}

export type TransferStatus =
  | 'completed'
  | 'failed'
  | 'pending_confirmation'
  | 'pending_signatures'
  | 'processing';

export interface Transfer {
  amount: string;
  amountFormatted: string;
  confirmations: number;
  createdAt: number;
  destinationChain: string;
  destinationTxHash: string | null;
  error: string | null;
  estimatedCompletion: number | null;
  recipient: string;
  requiredConfirmations: number;
  requiredSignatures: number;
  sender: string;
  sourceChain: string;
  sourceTxHash: string | null;
  status: TransferStatus | string;
  transferId: string;
  updatedAt: number;
  validatorSignatures: number;
}

export interface TransferResponse {
  success: boolean;
  transfer: Transfer;
}

export interface BridgeStats {
  activeValidators: number;
  /** Deposits and withdrawals are both refused while true. Check before submitting. */
  bridgePaused: boolean;
  collateralizationRatio: string;
  dailyMintedSol: string;
  timestamp: number;
  totalBurnedSol: string;
  totalTransfers: string;
  totalVolumeSol: string;
  vaultBalance: string;
  wsolSupply: string;
}
