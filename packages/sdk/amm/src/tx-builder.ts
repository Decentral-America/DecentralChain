/**
 * Transaction builder — creates InvokeScript transaction params
 * ready for signing via Signer or direct broadcast.
 *
 * v3: Matches Pool.ride v3 callable signatures exactly.
 * All amounts are in raw integer units.
 */

import { DCC_ASSET_ID } from './core';
import {
  type AddLiquidityParamsV2,
  type AmmSdkConfig,
  type ClaimLpTokensParams,
  type CreatePoolParamsV2,
  type InvokeScriptTx,
  type LockLiquidityParams,
  type RemoveLiquidityParamsV2,
  type SwapExactInParamsV2,
} from './types';

const DEFAULT_INVOKE_FEE = 900000;
const ISSUE_INVOKE_FEE = 100500000; // Required when tx issues a new asset (1.005 DCC)

function paymentAssetId(assetId: string | null | undefined): string | null {
  if (!assetId || assetId === DCC_ASSET_ID) return null;
  return assetId;
}

export class TxBuilder {
  private readonly dAppAddress: string;
  private readonly routerAddress: string;
  private readonly chainId: string;

  constructor(config: AmmSdkConfig) {
    this.dAppAddress = config.dAppAddress;
    this.routerAddress = config.routerAddress ?? config.dAppAddress;
    this.chainId = config.chainId;
  }

  /** createPool(assetA, assetB, feeBps) — no payments */
  buildCreatePool(params: CreatePoolParamsV2): InvokeScriptTx {
    return {
      call: {
        args: [
          { type: 'string', value: params.assetA },
          { type: 'string', value: params.assetB },
          { type: 'integer', value: params.feeBps },
        ],
        function: 'createPool',
      },
      chainId: this.chainId,
      dApp: this.dAppAddress,
      fee: DEFAULT_INVOKE_FEE,
      payment: [],
      type: 16,
    };
  }

  /** addLiquidity(assetA, assetB, feeBps, aDesired, bDesired, aMin, bMin, deadline) */
  buildAddLiquidity(params: AddLiquidityParamsV2): InvokeScriptTx {
    return {
      call: {
        args: [
          { type: 'string', value: params.assetA },
          { type: 'string', value: params.assetB },
          { type: 'integer', value: params.feeBps },
          { type: 'integer', value: Number(params.amountADesired) },
          { type: 'integer', value: Number(params.amountBDesired) },
          { type: 'integer', value: Number(params.amountAMin) },
          { type: 'integer', value: Number(params.amountBMin) },
          { type: 'integer', value: params.deadline },
        ],
        function: 'addLiquidity',
      },
      chainId: this.chainId,
      dApp: this.dAppAddress,
      fee: ISSUE_INVOKE_FEE,
      payment: [
        { amount: Number(params.amountADesired), assetId: paymentAssetId(params.assetA) },
        { amount: Number(params.amountBDesired), assetId: paymentAssetId(params.assetB) },
      ],
      type: 16,
    };
  }

  /** removeLiquidity(assetA, assetB, feeBps, lpAmount, aMin, bMin, deadline) — send LP tokens as payment */
  buildRemoveLiquidity(params: RemoveLiquidityParamsV2): InvokeScriptTx {
    const payment: Array<{ assetId: string | null; amount: number }> = [];
    if (params.lpAssetId) {
      payment.push({ amount: Number(params.lpAmount), assetId: params.lpAssetId });
    }
    return {
      call: {
        args: [
          { type: 'string', value: params.assetA },
          { type: 'string', value: params.assetB },
          { type: 'integer', value: params.feeBps },
          { type: 'integer', value: Number(params.lpAmount) },
          { type: 'integer', value: Number(params.amountAMin) },
          { type: 'integer', value: Number(params.amountBMin) },
          { type: 'integer', value: params.deadline },
        ],
        function: 'removeLiquidity',
      },
      chainId: this.chainId,
      dApp: this.dAppAddress,
      fee: DEFAULT_INVOKE_FEE,
      payment,
      type: 16,
    };
  }

  /** swapExactIn(assetIn, assetOut, feeBps, amountIn, minAmountOut, deadline) — targets Router */
  buildSwapExactIn(params: SwapExactInParamsV2): InvokeScriptTx {
    return {
      call: {
        args: [
          { type: 'string', value: params.assetIn },
          { type: 'string', value: params.assetOut },
          { type: 'integer', value: params.feeBps },
          { type: 'integer', value: Number(params.amountIn) },
          { type: 'integer', value: Number(params.minAmountOut) },
          { type: 'integer', value: params.deadline },
        ],
        function: 'swapExactIn',
      },
      chainId: this.chainId,
      dApp: this.routerAddress,
      fee: DEFAULT_INVOKE_FEE,
      payment: [{ amount: Number(params.amountIn), assetId: paymentAssetId(params.assetIn) }],
      type: 16,
    };
  }

  /** lockLiquidity(assetA, assetB, feeBps) — send LP tokens as payment to permanently lock liquidity */
  buildLockLiquidity(params: LockLiquidityParams): InvokeScriptTx {
    return {
      call: {
        args: [
          { type: 'string', value: params.assetA },
          { type: 'string', value: params.assetB },
          { type: 'integer', value: params.feeBps },
        ],
        function: 'lockLiquidity',
      },
      chainId: this.chainId,
      dApp: this.dAppAddress,
      fee: DEFAULT_INVOKE_FEE,
      payment: [{ amount: Number(params.lpAmount), assetId: params.lpAssetId }],
      type: 16,
    };
  }

  /** claimLpTokens(assetA, assetB, feeBps) — claim real LP tokens for legacy pool internal balance */
  buildClaimLpTokens(params: ClaimLpTokensParams): InvokeScriptTx {
    return {
      call: {
        args: [
          { type: 'string', value: params.assetA },
          { type: 'string', value: params.assetB },
          { type: 'integer', value: params.feeBps },
        ],
        function: 'claimLpTokens',
      },
      chainId: this.chainId,
      dApp: this.dAppAddress,
      fee: DEFAULT_INVOKE_FEE,
      payment: [],
      type: 16,
    };
  }
}
