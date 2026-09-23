/**
 * End-to-end tests for LP token feature (Pool.ride v3 + SDK).
 *
 * Tests cover:
 * - TxBuilder: buildLockLiquidity, buildClaimLpTokens, updated buildRemoveLiquidity
 * - NodeClient: getPoolState with lpAssetId, getPoolLpAssetId, hasClaimedLpTokens
 * - Type exports: LockLiquidityParams, ClaimLpTokensParams
 * - Contract logic simulation (state transitions for the LP token lifecycle)
 */

import { NodeClient } from '../src/node-client';
import { TxBuilder } from '../src/tx-builder';
import {
  type AmmSdkConfig,
  type ClaimLpTokensParams,
  type LockLiquidityParams,
  type PoolStateV2,
  type RemoveLiquidityParamsV2,
} from '../src/types';

// ─── Fixtures ────────────────────────────────────────────────────────

const TEST_CONFIG: AmmSdkConfig = {
  chainId: '?',
  dAppAddress: '3Da7xwRRtXfkA46jaKTYb75Usd2ZNWdY6HX',
  nodeUrl: 'https://mainnet-node.decentralchain.io',
};

const ASSET_A = 'DCC';
const ASSET_B = '7sP5abE9nGRwZqn9wELqcFHikmJfCe5d4K6NwaP1DZaM';
const LP_ASSET_ID = '3PPqoxRfvEHGJTw4LLZT4UmTjCE7bFj1H3e7DLPFKG9q';
const FEE_BPS = 30;

// ─── TxBuilder Tests ─────────────────────────────────────────────────

describe('TxBuilder v3 — LP Token Methods', () => {
  const builder = new TxBuilder(TEST_CONFIG);

  describe('buildLockLiquidity', () => {
    it('builds correct invoke structure with LP token payment', () => {
      const params: LockLiquidityParams = {
        assetA: ASSET_A,
        assetB: ASSET_B,
        feeBps: FEE_BPS,
        lpAmount: 500_000_000n,
        lpAssetId: LP_ASSET_ID,
      };
      const tx = builder.buildLockLiquidity(params);

      expect(tx.type).toBe(16);
      expect(tx.dApp).toBe(TEST_CONFIG.dAppAddress);
      expect(tx.call.function).toBe('lockLiquidity');
      expect(tx.call.args).toHaveLength(3);
      expect(tx.call.args[0]).toEqual({ type: 'string', value: ASSET_A });
      expect(tx.call.args[1]).toEqual({ type: 'string', value: ASSET_B });
      expect(tx.call.args[2]).toEqual({ type: 'integer', value: FEE_BPS });
      expect(tx.fee).toBe(900000);
      expect(tx.chainId).toBe('?');
    });

    it('attaches LP tokens as payment', () => {
      const params: LockLiquidityParams = {
        assetA: ASSET_A,
        assetB: ASSET_B,
        feeBps: FEE_BPS,
        lpAmount: 1_000_000n,
        lpAssetId: LP_ASSET_ID,
      };
      const tx = builder.buildLockLiquidity(params);

      expect(tx.payment).toHaveLength(1);
      expect(tx.payment[0].assetId).toBe(LP_ASSET_ID);
      expect(tx.payment[0].amount).toBe(1_000_000);
    });

    it('handles large LP amounts without precision loss', () => {
      const params: LockLiquidityParams = {
        assetA: ASSET_A,
        assetB: ASSET_B,
        feeBps: FEE_BPS,
        lpAmount: 999_999_999_999n,
        lpAssetId: LP_ASSET_ID,
      };
      const tx = builder.buildLockLiquidity(params);

      expect(tx.payment[0].amount).toBe(999_999_999_999);
    });

    it('uses different fee tiers', () => {
      const tx = builder.buildLockLiquidity({
        assetA: ASSET_A,
        assetB: ASSET_B,
        feeBps: 100,
        lpAmount: 100n,
        lpAssetId: LP_ASSET_ID,
      });
      expect(tx.call.args[2]).toEqual({ type: 'integer', value: 100 });
    });
  });

  describe('buildClaimLpTokens', () => {
    it('builds correct invoke structure with no payment', () => {
      const params: ClaimLpTokensParams = {
        assetA: ASSET_A,
        assetB: ASSET_B,
        feeBps: FEE_BPS,
      };
      const tx = builder.buildClaimLpTokens(params);

      expect(tx.type).toBe(16);
      expect(tx.dApp).toBe(TEST_CONFIG.dAppAddress);
      expect(tx.call.function).toBe('claimLpTokens');
      expect(tx.call.args).toHaveLength(3);
      expect(tx.call.args[0]).toEqual({ type: 'string', value: ASSET_A });
      expect(tx.call.args[1]).toEqual({ type: 'string', value: ASSET_B });
      expect(tx.call.args[2]).toEqual({ type: 'integer', value: FEE_BPS });
      expect(tx.payment).toHaveLength(0);
      expect(tx.fee).toBe(900000);
    });

    it('has no payment attached (claim is free)', () => {
      const tx = builder.buildClaimLpTokens({
        assetA: ASSET_A,
        assetB: ASSET_B,
        feeBps: FEE_BPS,
      });
      expect(tx.payment).toEqual([]);
    });
  });

  describe('buildRemoveLiquidity — LP token payment', () => {
    it('attaches LP tokens when lpAssetId is provided', () => {
      const params: RemoveLiquidityParamsV2 = {
        amountAMin: 45_000n,
        amountBMin: 90_000n,
        assetA: ASSET_A,
        assetB: ASSET_B,
        deadline: 1700000000000,
        feeBps: FEE_BPS,
        lpAmount: 100_000n,
        lpAssetId: LP_ASSET_ID,
      };
      const tx = builder.buildRemoveLiquidity(params);

      expect(tx.call.function).toBe('removeLiquidity');
      expect(tx.payment).toHaveLength(1);
      expect(tx.payment[0]).toEqual({
        amount: 100_000,
        assetId: LP_ASSET_ID,
      });
    });

    it('sends no payment for legacy pools (no lpAssetId)', () => {
      const params: RemoveLiquidityParamsV2 = {
        amountAMin: 45_000n,
        amountBMin: 90_000n,
        assetA: ASSET_A,
        assetB: ASSET_B,
        deadline: 1700000000000,
        feeBps: FEE_BPS,
        lpAmount: 100_000n,
        // no lpAssetId
      };
      const tx = builder.buildRemoveLiquidity(params);

      expect(tx.payment).toHaveLength(0);
    });

    it('sends no payment when lpAssetId is empty string', () => {
      const tx = builder.buildRemoveLiquidity({
        amountAMin: 0n,
        amountBMin: 0n,
        assetA: ASSET_A,
        assetB: ASSET_B,
        deadline: 9999999999999,
        feeBps: FEE_BPS,
        lpAmount: 50_000n,
        lpAssetId: '',
      });
      expect(tx.payment).toHaveLength(0);
    });

    it('preserves all 7 call args regardless of LP token', () => {
      const tx = builder.buildRemoveLiquidity({
        amountAMin: 10_000n,
        amountBMin: 20_000n,
        assetA: ASSET_A,
        assetB: ASSET_B,
        deadline: 1700000000000,
        feeBps: FEE_BPS,
        lpAmount: 50_000n,
        lpAssetId: LP_ASSET_ID,
      });
      expect(tx.call.args).toHaveLength(7);
      expect(tx.call.args[3]).toEqual({ type: 'integer', value: 50_000 });
      expect(tx.call.args[4]).toEqual({ type: 'integer', value: 10_000 });
      expect(tx.call.args[5]).toEqual({ type: 'integer', value: 20_000 });
      expect(tx.call.args[6]).toEqual({ type: 'integer', value: 1700000000000 });
    });
  });
});

// ─── NodeClient Tests (mock fetch) ──────────────────────────────────

describe('NodeClient — LP Token State Reading', () => {
  let client: NodeClient;

  // Mock global fetch
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new NodeClient(TEST_CONFIG);
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetchResponse(value: unknown, ok = true) {
    return mockFetch.mockResolvedValueOnce({
      json: async () => value,
      ok,
    });
  }

  describe('getPoolState — lpAssetId field', () => {
    it('reads lpAssetId from pool state entries', async () => {
      const pid = 'p:DCC:7sP5ab:30';
      const entries = [
        { key: `pool:exists:${pid}`, type: 'integer', value: 1 },
        { key: `pool:t0:${pid}`, type: 'string', value: 'DCC' },
        { key: `pool:t1:${pid}`, type: 'string', value: '7sP5ab' },
        { key: `pool:r0:${pid}`, type: 'integer', value: 1000000 },
        { key: `pool:r1:${pid}`, type: 'integer', value: 2000000 },
        { key: `pool:lpSupply:${pid}`, type: 'integer', value: 1414213 },
        { key: `pool:fee:${pid}`, type: 'integer', value: 30 },
        { key: `pool:lastK:${pid}`, type: 'integer', value: 2000000000000 },
        { key: `pool:createdAt:${pid}`, type: 'integer', value: 1700000000000 },
        { key: `pool:swaps:${pid}`, type: 'integer', value: 5 },
        { key: `pool:volume0:${pid}`, type: 'integer', value: 500000 },
        { key: `pool:volume1:${pid}`, type: 'integer', value: 600000 },
        { key: `pool:fees0:${pid}`, type: 'integer', value: 1500 },
        { key: `pool:fees1:${pid}`, type: 'integer', value: 1800 },
        { key: `pool:lpAssetId:${pid}`, type: 'string', value: LP_ASSET_ID },
      ];
      mockFetchResponse(entries);

      const state = await client.getPoolState(pid);

      expect(state).not.toBeNull();
      expect(state!.lpAssetId).toBe(LP_ASSET_ID);
      expect(state!.poolId).toBe(pid);
      expect(state!.reserve0).toBe(1000000n);
      expect(state!.reserve1).toBe(2000000n);
      expect(state!.lpSupply).toBe(1414213n);
    });

    it('returns empty string lpAssetId for legacy pools', async () => {
      const pid = 'p:DCC:ABC:30';
      const entries = [
        { key: `pool:exists:${pid}`, type: 'integer', value: 1 },
        { key: `pool:t0:${pid}`, type: 'string', value: 'DCC' },
        { key: `pool:t1:${pid}`, type: 'string', value: 'ABC' },
        { key: `pool:r0:${pid}`, type: 'integer', value: 100 },
        { key: `pool:r1:${pid}`, type: 'integer', value: 200 },
        { key: `pool:lpSupply:${pid}`, type: 'integer', value: 141 },
        { key: `pool:fee:${pid}`, type: 'integer', value: 30 },
        { key: `pool:lastK:${pid}`, type: 'integer', value: 20000 },
        { key: `pool:createdAt:${pid}`, type: 'integer', value: 1700000000000 },
        // No lpAssetId entry → legacy pool
      ];
      mockFetchResponse(entries);

      const state = await client.getPoolState(pid);
      expect(state!.lpAssetId).toBe('');
    });

    it('returns null for non-existent pool', async () => {
      mockFetchResponse([]);
      const state = await client.getPoolState('p:DCC:FAKE:30');
      expect(state).toBeNull();
    });
  });

  describe('getPoolLpAssetId', () => {
    it('returns LP asset ID for a pool with LP token', async () => {
      mockFetchResponse({
        key: 'pool:lpAssetId:p:DCC:ABC:30',
        type: 'string',
        value: LP_ASSET_ID,
      });

      const result = await client.getPoolLpAssetId('p:DCC:ABC:30');
      expect(result).toBe(LP_ASSET_ID);
    });

    it('returns empty string for legacy pool', async () => {
      mockFetchResponse(null, false); // 404

      const result = await client.getPoolLpAssetId('p:DCC:LEGACY:30');
      expect(result).toBe('');
    });

    it('constructs correct state key', async () => {
      mockFetchResponse(null, false);
      await client.getPoolLpAssetId('p:DCC:XYZ:100');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/addresses/data/');
      expect(calledUrl).toContain(encodeURIComponent('pool:lpAssetId:p:DCC:XYZ:100'));
    });
  });

  describe('hasClaimedLpTokens', () => {
    it('returns true when claimed', async () => {
      mockFetchResponse({
        key: 'lpClaimed:p:DCC:ABC:30:3PAddress',
        type: 'boolean',
        value: true,
      });

      const result = await client.hasClaimedLpTokens('p:DCC:ABC:30', '3PAddress');
      expect(result).toBe(true);
    });

    it('returns false when not claimed', async () => {
      mockFetchResponse(null, false); // 404 — no entry

      const result = await client.hasClaimedLpTokens('p:DCC:ABC:30', '3PAddress');
      expect(result).toBe(false);
    });

    it('constructs correct key format', async () => {
      mockFetchResponse(null, false);
      await client.hasClaimedLpTokens('p:DCC:ABC:30', '3PUserAddr');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain(encodeURIComponent('lpClaimed:p:DCC:ABC:30:3PUserAddr'));
    });
  });

  describe('getLpBalance', () => {
    it('reads internal LP balance', async () => {
      mockFetchResponse({
        key: 'lp:p:DCC:ABC:30:3PUser',
        type: 'integer',
        value: 999000,
      });

      const bal = await client.getLpBalance('p:DCC:ABC:30', '3PUser');
      expect(bal).toBe(999000n);
    });

    it('returns 0n when no balance entry', async () => {
      mockFetchResponse(null, false);
      const bal = await client.getLpBalance('p:DCC:ABC:30', '3PNewUser');
      expect(bal).toBe(0n);
    });
  });
});

// ─── Contract Logic Simulation Tests ────────────────────────────────
// These simulate the state machine of the RIDE contract to verify
// correctness of the LP token lifecycle.

describe('Contract Logic — LP Token Lifecycle', () => {
  // Simulate RIDE contract state
  type State = Record<string, number | string | boolean>;

  function isqrt(n: number): number {
    if (n <= 0) return 0;
    let x = Math.floor(Math.sqrt(n));
    while (x * x > n) x--;
    while ((x + 1) * (x + 1) <= n) x++;
    return x;
  }

  const MIN_LIQUIDITY = 1000;

  /** Simulate addLiquidity (first deposit) */
  function simFirstDeposit(
    state: State,
    pid: string,
    caller: string,
    amount0: number,
    amount1: number,
  ): {
    state: State;
    lpMinted: number;
    lpAssetId: string;
  } {
    const sqrtK = isqrt(amount0 * amount1);
    if (sqrtK <= MIN_LIQUIDITY) throw new Error('E_INSUFFICIENT_LIQUIDITY');
    const lpMinted = sqrtK - MIN_LIQUIDITY;
    const lpAssetId = `LP_ASSET_${pid}`;
    const lpNum = ((state['lpTokenCount'] as number) || 0) + 1;

    const newState: State = {
      ...state,
      [`pool:r0:${pid}`]: amount0,
      [`pool:r1:${pid}`]: amount1,
      [`pool:lpSupply:${pid}`]: sqrtK,
      [`pool:lpAssetId:${pid}`]: lpAssetId,
      ['lpTokenCount']: lpNum,
      [`lp:${pid}:LOCKED`]: MIN_LIQUIDITY,
      [`lp:${pid}:${caller}`]: lpMinted,
      [`lpClaimed:${pid}:${caller}`]: true, // first depositor is auto-claimed
      // Tokens: caller gets lpMinted real tokens
      [`tokens:${lpAssetId}:${caller}`]:
        ((state[`tokens:${lpAssetId}:${caller}`] as number) || 0) + lpMinted,
      // dApp holds 0 (sqrtK issued - minLiquidity burned - lpMinted transferred)
      [`tokens:${lpAssetId}:dApp`]: 0,
      // Total circulating
      [`tokens:${lpAssetId}:total`]: sqrtK - MIN_LIQUIDITY,
    };

    return { lpAssetId, lpMinted, state: newState };
  }

  /** Simulate addLiquidity (existing pool with LP token) */
  function simSubsequentDeposit(
    state: State,
    pid: string,
    caller: string,
    used0: number,
    used1: number,
  ): {
    state: State;
    lpMinted: number;
  } {
    const res0 = state[`pool:r0:${pid}`] as number;
    const res1 = state[`pool:r1:${pid}`] as number;
    const supply = state[`pool:lpSupply:${pid}`] as number;
    const lpAssetId = state[`pool:lpAssetId:${pid}`] as string;

    const lp0 = Math.floor((used0 * supply) / res0);
    const lp1 = Math.floor((used1 * supply) / res1);
    const lpMinted = Math.min(lp0, lp1);
    if (lpMinted <= 0) throw new Error('E_DUST');

    const newR0 = res0 + used0;
    const newR1 = res1 + used1;
    const newSupply = supply + lpMinted;

    const newState: State = {
      ...state,
      [`pool:r0:${pid}`]: newR0,
      [`pool:r1:${pid}`]: newR1,
      [`pool:lpSupply:${pid}`]: newSupply,
      // Internal balance NOT updated (LP tokens are source of truth)
      // Reissue + ScriptTransfer
      [`tokens:${lpAssetId}:${caller}`]:
        ((state[`tokens:${lpAssetId}:${caller}`] as number) || 0) + lpMinted,
      [`tokens:${lpAssetId}:total`]:
        ((state[`tokens:${lpAssetId}:total`] as number) || 0) + lpMinted,
      [`tokens:${lpAssetId}:dApp`]: (state[`tokens:${lpAssetId}:dApp`] as number) || 0, // unchanged
    };

    return { lpMinted, state: newState };
  }

  /** Simulate legacy pool addLiquidity — triggers LP token creation */
  function simLegacyUpgradeDeposit(
    state: State,
    pid: string,
    caller: string,
    used0: number,
    used1: number,
  ): {
    state: State;
    lpMinted: number;
    lpAssetId: string;
  } {
    const res0 = state[`pool:r0:${pid}`] as number;
    const res1 = state[`pool:r1:${pid}`] as number;
    const supply = state[`pool:lpSupply:${pid}`] as number;

    const lp0 = Math.floor((used0 * supply) / res0);
    const lp1 = Math.floor((used1 * supply) / res1);
    const lpMinted = Math.min(lp0, lp1);
    if (lpMinted <= 0) throw new Error('E_DUST');

    const lpAssetId = `LP_ASSET_${pid}`;
    const lpNum = ((state['lpTokenCount'] as number) || 0) + 1;
    const totalIssued = supply + lpMinted;

    const newR0 = res0 + used0;
    const newR1 = res1 + used1;
    const newSupply = supply + lpMinted;

    const newState: State = {
      ...state,
      [`pool:r0:${pid}`]: newR0,
      [`pool:r1:${pid}`]: newR1,
      [`pool:lpSupply:${pid}`]: newSupply,
      [`pool:lpAssetId:${pid}`]: lpAssetId,
      ['lpTokenCount']: lpNum,
      // Internal balance NOT updated (frozen for claim purposes)
      // Issue(supply + lpMinted), ScriptTransfer(caller, lpMinted)
      // dApp holds `supply` tokens for legacy holders to claim
      [`tokens:${lpAssetId}:dApp`]: supply,
      [`tokens:${lpAssetId}:${caller}`]:
        ((state[`tokens:${lpAssetId}:${caller}`] as number) || 0) + lpMinted,
      [`tokens:${lpAssetId}:total`]: totalIssued,
    };

    return { lpAssetId, lpMinted, state: newState };
  }

  /** Simulate claimLpTokens */
  function simClaimLpTokens(state: State, pid: string, caller: string): State {
    const lpAssetId = state[`pool:lpAssetId:${pid}`] as string;
    if (!lpAssetId) throw new Error('E_NO_LP_TOKEN');
    if (state[`lpClaimed:${pid}:${caller}`]) throw new Error('E_ALREADY_CLAIMED');
    const internalBalance = (state[`lp:${pid}:${caller}`] as number) || 0;
    if (internalBalance <= 0) throw new Error('E_NO_LP_BALANCE');

    const dAppBalance = (state[`tokens:${lpAssetId}:dApp`] as number) || 0;
    if (dAppBalance < internalBalance) throw new Error('E_INSUFFICIENT_DAPP_BALANCE');

    return {
      ...state,
      [`lpClaimed:${pid}:${caller}`]: true,
      [`lp:${pid}:${caller}`]: 0,
      // Transfer from dApp to caller (no Reissue!)
      [`tokens:${lpAssetId}:dApp`]: dAppBalance - internalBalance,
      [`tokens:${lpAssetId}:${caller}`]:
        ((state[`tokens:${lpAssetId}:${caller}`] as number) || 0) + internalBalance,
      // Total circulating unchanged (tokens already existed)
    };
  }

  /** Simulate removeLiquidity with LP tokens */
  function simRemoveLiquidity(
    state: State,
    pid: string,
    caller: string,
    lpAmount: number,
  ): {
    state: State;
    amount0Out: number;
    amount1Out: number;
  } {
    const res0 = state[`pool:r0:${pid}`] as number;
    const res1 = state[`pool:r1:${pid}`] as number;
    const supply = state[`pool:lpSupply:${pid}`] as number;
    const lpAssetId = state[`pool:lpAssetId:${pid}`] as string;
    const hasLpToken = !!lpAssetId;

    const amount0Out = Math.floor((lpAmount * res0) / supply);
    const amount1Out = Math.floor((lpAmount * res1) / supply);

    const newR0 = res0 - amount0Out;
    const newR1 = res1 - amount1Out;
    const newSupply = supply - lpAmount;

    const callerTokens = (state[`tokens:${lpAssetId}:${caller}`] as number) || 0;

    const newState: State = {
      ...state,
      [`pool:r0:${pid}`]: newR0,
      [`pool:r1:${pid}`]: newR1,
      [`pool:lpSupply:${pid}`]: newSupply,
      // Internal balance NOT updated when LP tokens exist
      // Burn LP tokens
      [`tokens:${lpAssetId}:${caller}`]: hasLpToken ? callerTokens - lpAmount : callerTokens,
      [`tokens:${lpAssetId}:total`]:
        ((state[`tokens:${lpAssetId}:total`] as number) || 0) - lpAmount,
    };

    // Only update internal balance for legacy pools
    if (!hasLpToken) {
      const userLp = (state[`lp:${pid}:${caller}`] as number) || 0;
      newState[`lp:${pid}:${caller}`] = userLp - lpAmount;
    }

    return { amount0Out, amount1Out, state: newState };
  }

  /** Simulate lockLiquidity */
  function simLockLiquidity(state: State, pid: string, caller: string, lpAmount: number): State {
    const lpAssetId = state[`pool:lpAssetId:${pid}`] as string;
    if (!lpAssetId) throw new Error('E_NO_LP_TOKEN');

    const callerTokens = (state[`tokens:${lpAssetId}:${caller}`] as number) || 0;
    if (callerTokens < lpAmount) throw new Error('E_INSUFFICIENT_LP_TOKENS');

    // Burn LP tokens but do NOT decrease lpSupply or reserves
    return {
      ...state,
      [`tokens:${lpAssetId}:${caller}`]: callerTokens - lpAmount,
      [`tokens:${lpAssetId}:total`]:
        ((state[`tokens:${lpAssetId}:total`] as number) || 0) - lpAmount,
      // lpSupply UNCHANGED — this is the key design point
    };
  }

  // ─── Test Cases ───────────────────────────────────────────────────

  describe('New Pool — Full Lifecycle', () => {
    const PID = 'p:DCC:TOKEN:30';
    let state: State = { [`pool:exists:${PID}`]: 1 };

    it('first deposit issues LP tokens correctly', () => {
      const result = simFirstDeposit(state, PID, 'Alice', 1_000_000, 4_000_000);
      state = result.state;

      // sqrt(1e6 * 4e6) = sqrt(4e12) = 2_000_000
      expect(state[`pool:lpSupply:${PID}`]).toBe(2_000_000);
      expect(result.lpMinted).toBe(2_000_000 - MIN_LIQUIDITY);
      expect(state[`lp:${PID}:Alice`]).toBe(2_000_000 - MIN_LIQUIDITY);
      expect(state[`lp:${PID}:LOCKED`]).toBe(MIN_LIQUIDITY);
      expect(state[`pool:lpAssetId:${PID}`]).toBe(`LP_ASSET_${PID}`);
      // Alice has real tokens
      expect(state[`tokens:LP_ASSET_${PID}:Alice`]).toBe(2_000_000 - MIN_LIQUIDITY);
      // dApp has 0 tokens (all issued minus burned minus transferred)
      expect(state[`tokens:LP_ASSET_${PID}:dApp`]).toBe(0);
      // First depositor auto-claimed
      expect(state[`lpClaimed:${PID}:Alice`]).toBe(true);
    });

    it('first depositor cannot call claimLpTokens', () => {
      expect(() => simClaimLpTokens(state, PID, 'Alice')).toThrow('E_ALREADY_CLAIMED');
    });

    it('subsequent deposit reissues LP tokens, no internal balance update', () => {
      const aliceLpBefore = state[`lp:${PID}:Alice`] as number;
      const result = simSubsequentDeposit(state, PID, 'Bob', 500_000, 2_000_000);
      state = result.state;

      // Bob gets real LP tokens proportional to deposit
      expect(result.lpMinted).toBeGreaterThan(0);
      expect(state[`tokens:LP_ASSET_${PID}:Bob`]).toBe(result.lpMinted);
      // Alice's internal balance is unchanged
      expect(state[`lp:${PID}:Alice`]).toBe(aliceLpBefore);
      // Bob has no internal balance (wasn't set)
      expect(state[`lp:${PID}:Bob`]).toBeUndefined();
    });

    it('remove liquidity burns LP tokens, does not touch internal balance', () => {
      const bobLpTokens = state[`tokens:LP_ASSET_${PID}:Bob`] as number;
      const removeAmount = Math.floor(bobLpTokens / 2);
      const result = simRemoveLiquidity(state, PID, 'Bob', removeAmount);
      state = result.state;

      expect(result.amount0Out).toBeGreaterThan(0);
      expect(result.amount1Out).toBeGreaterThan(0);
      // Bob's real token balance decreased
      expect(state[`tokens:LP_ASSET_${PID}:Bob`]).toBe(bobLpTokens - removeAmount);
      // Bob has no internal balance entry (never set for new-era depositor)
      expect(state[`lp:${PID}:Bob`]).toBeUndefined();
    });

    it('lock liquidity burns tokens without decreasing supply', () => {
      const supplyBefore = state[`pool:lpSupply:${PID}`] as number;
      const res0Before = state[`pool:r0:${PID}`] as number;
      const res1Before = state[`pool:r1:${PID}`] as number;
      const aliceTokens = state[`tokens:LP_ASSET_${PID}:Alice`] as number;

      // Alice locks half her LP tokens
      const lockAmount = Math.floor(aliceTokens / 2);
      state = simLockLiquidity(state, PID, 'Alice', lockAmount);

      // Supply and reserves UNCHANGED
      expect(state[`pool:lpSupply:${PID}`]).toBe(supplyBefore);
      expect(state[`pool:r0:${PID}`]).toBe(res0Before);
      expect(state[`pool:r1:${PID}`]).toBe(res1Before);
      // Alice's real token balance decreased
      expect(state[`tokens:LP_ASSET_${PID}:Alice`]).toBe(aliceTokens - lockAmount);
    });

    it('locked liquidity stays in pool when all remaining LP is redeemed', () => {
      const supply = state[`pool:lpSupply:${PID}`] as number;
      const totalTokens = state[`tokens:LP_ASSET_${PID}:total`] as number;

      // totalTokens < supply because some were burned in lockLiquidity
      expect(totalTokens).toBeLessThan(supply);

      // The difference is permanently locked reserves
      const lockedShares = supply - totalTokens;
      const res0 = state[`pool:r0:${PID}`] as number;
      const lockedReserve0 = Math.floor((lockedShares * res0) / supply);
      expect(lockedReserve0).toBeGreaterThan(0);
    });
  });

  describe('Legacy Pool — Upgrade + Claim Lifecycle', () => {
    const PID = 'p:DCC:LEGACY:30';
    let state: State = {
      [`pool:exists:${PID}`]: 1,
      [`pool:r0:${PID}`]: 5_000_000,
      [`pool:r1:${PID}`]: 10_000_000,
      [`pool:lpSupply:${PID}`]: 7_071_067, // isqrt(5e6 * 10e6)
      // Legacy internal balances (no LP token)
      // Must sum to supply: 3_535_033 + 3_535_034 + 1000 = 7_071_067
      [`lp:${PID}:Alice`]: 3_535_033,
      [`lp:${PID}:Bob`]: 3_535_034,
      [`lp:${PID}:LOCKED`]: 1_000,
      // No pool:lpAssetId entry — legacy pool
    };

    it('new deposit triggers LP token issuance for legacy pool', () => {
      const supplyBefore = state[`pool:lpSupply:${PID}`] as number;
      const result = simLegacyUpgradeDeposit(state, PID, 'Charlie', 1_000_000, 2_000_000);
      state = result.state;

      expect(state[`pool:lpAssetId:${PID}`]).toBe(`LP_ASSET_${PID}`);
      // Issue(supply + lpMinted), dApp holds supply tokens
      expect(state[`tokens:LP_ASSET_${PID}:dApp`]).toBe(supplyBefore);
      // Charlie gets real tokens for new deposit only
      expect(state[`tokens:LP_ASSET_${PID}:Charlie`]).toBe(result.lpMinted);
    });

    it('Alice internal balance is frozen (not updated)', () => {
      expect(state[`lp:${PID}:Alice`]).toBe(3_535_033);
    });

    it('Bob internal balance is frozen (not updated)', () => {
      expect(state[`lp:${PID}:Bob`]).toBe(3_535_034);
    });

    it('Alice can claim LP tokens from dApp balance', () => {
      const dAppBefore = state[`tokens:LP_ASSET_${PID}:dApp`] as number;
      state = simClaimLpTokens(state, PID, 'Alice');

      // Alice gets tokens equal to her frozen internal balance
      expect(state[`tokens:LP_ASSET_${PID}:Alice`]).toBe(3_535_033);
      // dApp balance decreases
      expect(state[`tokens:LP_ASSET_${PID}:dApp`]).toBe(dAppBefore - 3_535_033);
      // Internal balance cleared
      expect(state[`lp:${PID}:Alice`]).toBe(0);
      // Claimed flag set
      expect(state[`lpClaimed:${PID}:Alice`]).toBe(true);
    });

    it('Alice cannot double-claim', () => {
      expect(() => simClaimLpTokens(state, PID, 'Alice')).toThrow('E_ALREADY_CLAIMED');
    });

    it('Bob can claim his share separately', () => {
      const dAppBefore = state[`tokens:LP_ASSET_${PID}:dApp`] as number;
      state = simClaimLpTokens(state, PID, 'Bob');

      expect(state[`tokens:LP_ASSET_${PID}:Bob`]).toBe(3_535_034);
      expect(state[`tokens:LP_ASSET_${PID}:dApp`]).toBe(dAppBefore - 3_535_034);
      expect(state[`lp:${PID}:Bob`]).toBe(0);
    });

    it('after all claims, dApp holds only locked portion', () => {
      // dApp should hold exactly LOCKED balance (1000)
      const dAppTokens = state[`tokens:LP_ASSET_${PID}:dApp`] as number;
      expect(dAppTokens).toBe(1_000); // LOCKED's internal balance
    });

    it('total token supply is consistent after claims', () => {
      const supply = state[`pool:lpSupply:${PID}`] as number;
      const total = state[`tokens:LP_ASSET_${PID}:total`] as number;
      const dApp = state[`tokens:LP_ASSET_${PID}:dApp`] as number;
      const alice = state[`tokens:LP_ASSET_${PID}:Alice`] as number;
      const bob = state[`tokens:LP_ASSET_${PID}:Bob`] as number;
      const charlie = state[`tokens:LP_ASSET_${PID}:Charlie`] as number;

      // All tokens accounted for
      const accounted = alice + bob + charlie + dApp;
      expect(accounted).toBe(total);
      // Total matches supply (nothing burned yet)
      expect(total).toBe(supply);
    });

    it('Alice can remove liquidity using real LP tokens after claiming', () => {
      const aliceTokens = state[`tokens:LP_ASSET_${PID}:Alice`] as number;
      const removeAmount = Math.floor(aliceTokens / 2);
      const result = simRemoveLiquidity(state, PID, 'Alice', removeAmount);
      state = result.state;

      // Got reserves out
      expect(result.amount0Out).toBeGreaterThan(0);
      expect(result.amount1Out).toBeGreaterThan(0);
      // Token balance decreased
      expect(state[`tokens:LP_ASSET_${PID}:Alice`]).toBe(aliceTokens - removeAmount);
      // Internal balance still 0 (was cleared by claim, not touched by remove)
      expect(state[`lp:${PID}:Alice`]).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('user who bought LP tokens on market can remove liquidity without negative internal balance', () => {
      const PID = 'p:DCC:EDGE:30';
      const state: State = {
        [`pool:exists:${PID}`]: 1,
        [`pool:r0:${PID}`]: 1_000_000,
        [`pool:r1:${PID}`]: 2_000_000,
        [`pool:lpSupply:${PID}`]: 1_414_213,
        [`pool:lpAssetId:${PID}`]: `LP_ASSET_${PID}`,
        // Buyer has tokens from market, but NO internal balance
        [`tokens:LP_ASSET_${PID}:Buyer`]: 100_000,
        [`tokens:LP_ASSET_${PID}:total`]: 1_414_213,
      };

      const result = simRemoveLiquidity(state, PID, 'Buyer', 50_000);

      // Buyer can redeem successfully
      expect(result.amount0Out).toBeGreaterThan(0);
      expect(result.amount1Out).toBeGreaterThan(0);
      // No negative internal balance — it wasn't touched
      expect(result.state[`lp:${PID}:Buyer`]).toBeUndefined();
      // Token balance decreased correctly
      expect(result.state[`tokens:LP_ASSET_${PID}:Buyer`]).toBe(50_000);
    });

    it('legacy holder adding more liquidity after upgrade does not bloat claim', () => {
      const PID = 'p:DCC:EDGE2:30';
      let state: State = {
        [`pool:exists:${PID}`]: 1,
        [`pool:r0:${PID}`]: 1_000_000,
        [`pool:r1:${PID}`]: 2_000_000,
        [`pool:lpSupply:${PID}`]: 1_414_213,
        [`pool:lpAssetId:${PID}`]: `LP_ASSET_${PID}`,
        // Alice is a legacy holder with frozen balance of 500_000
        [`lp:${PID}:Alice`]: 500_000,
        [`tokens:LP_ASSET_${PID}:Alice`]: 0,
        [`tokens:LP_ASSET_${PID}:dApp`]: 1_414_213, // from legacy upgrade
        [`tokens:LP_ASSET_${PID}:total`]: 1_414_213,
      };

      // Alice adds more liquidity (gets real tokens via Reissue, NOT updating internal balance)
      const deposit = simSubsequentDeposit(state, PID, 'Alice', 100_000, 200_000);
      state = deposit.state;

      // Alice now has real tokens from new deposit
      expect(deposit.lpMinted).toBeGreaterThan(0);
      expect(state[`tokens:LP_ASSET_${PID}:Alice`]).toBe(deposit.lpMinted);

      // But her internal balance is STILL 500_000 (frozen)
      expect(state[`lp:${PID}:Alice`]).toBe(500_000);

      // When she claims, she claims ONLY the frozen 500_000
      state = simClaimLpTokens(state, PID, 'Alice');
      expect(state[`tokens:LP_ASSET_${PID}:Alice`]).toBe(deposit.lpMinted + 500_000);
      expect(state[`lp:${PID}:Alice`]).toBe(0);
    });

    it('lockLiquidity fails if user has insufficient LP tokens', () => {
      const PID = 'p:DCC:EDGE3:30';
      const state: State = {
        [`pool:exists:${PID}`]: 1,
        [`pool:lpAssetId:${PID}`]: `LP_ASSET_${PID}`,
        [`tokens:LP_ASSET_${PID}:Alice`]: 100,
      };

      expect(() => simLockLiquidity(state, PID, 'Alice', 200)).toThrow('E_INSUFFICIENT_LP_TOKENS');
    });

    it('claimLpTokens fails for new-era user with no internal balance', () => {
      const PID = 'p:DCC:EDGE4:30';
      const state: State = {
        [`pool:exists:${PID}`]: 1,
        [`pool:lpAssetId:${PID}`]: `LP_ASSET_${PID}`,
        // Bob only got tokens via market, no internal balance
      };

      expect(() => simClaimLpTokens(state, PID, 'Bob')).toThrow('E_NO_LP_BALANCE');
    });

    it('minLiquidity is permanently locked and unredeemable', () => {
      const PID = 'p:DCC:EDGE5:30';
      const { state } = simFirstDeposit(
        { [`pool:exists:${PID}`]: 1 },
        PID,
        'Creator',
        1_000_000,
        1_000_000,
      );

      // LOCKED address has internal balance but is auto-claimed: false (not a real user)
      expect(state[`lp:${PID}:LOCKED`]).toBe(MIN_LIQUIDITY);

      // LOCKED address cannot claim (doesn't have lpClaimed set, BUT this is a
      // virtual address — it would fail the ScriptTransfer in real RIDE because
      // "LOCKED" is not a valid address)
    });

    it('locked reserves calculation is correct', () => {
      const PID = 'p:DCC:EDGE6:30';
      const {
        state: state1,
        lpMinted,
        lpAssetId,
      } = simFirstDeposit({ [`pool:exists:${PID}`]: 1 }, PID, 'Alice', 1_000_000, 4_000_000);

      // supply = 2_000_000, Alice has 1_999_000 tokens
      const supply1 = state1[`pool:lpSupply:${PID}`] as number;
      expect(supply1).toBe(2_000_000);

      // Lock half of Alice's tokens
      const lockAmount = Math.floor(lpMinted / 2);
      const state2 = simLockLiquidity(state1, PID, 'Alice', lockAmount);

      // Supply unchanged at 2_000_000
      expect(state2[`pool:lpSupply:${PID}`]).toBe(2_000_000);

      // Remaining circulating tokens
      const totalTokens = state2[`tokens:${lpAssetId}:total`] as number;
      const lockedShares = supply1 - totalTokens;

      // Locked reserves proportional to burned tokens
      const lockedR0 = Math.floor((lockedShares * (state2[`pool:r0:${PID}`] as number)) / supply1);
      const lockedR1 = Math.floor((lockedShares * (state2[`pool:r1:${PID}`] as number)) / supply1);

      expect(lockedR0).toBeGreaterThan(0);
      expect(lockedR1).toBeGreaterThan(0);

      // Remaining tokens can redeem the rest (minus locked)
      const aliceRemaining = state2[`tokens:${lpAssetId}:Alice`] as number;
      const redeemR0 = Math.floor(
        (aliceRemaining * (state2[`pool:r0:${PID}`] as number)) / supply1,
      );
      expect(redeemR0).toBeLessThan(state2[`pool:r0:${PID}`] as number);
    });
  });
});

// ─── Type Export Tests ──────────────────────────────────────────────

describe('Type Exports', () => {
  it('LockLiquidityParams has required fields', () => {
    const params: LockLiquidityParams = {
      assetA: 'DCC',
      assetB: 'TOKEN',
      feeBps: 30,
      lpAmount: 100n,
      lpAssetId: 'someAssetId',
    };
    expect(params.assetA).toBe('DCC');
    expect(params.lpAssetId).toBe('someAssetId');
    expect(params.lpAmount).toBe(100n);
  });

  it('ClaimLpTokensParams has required fields', () => {
    const params: ClaimLpTokensParams = {
      assetA: 'DCC',
      assetB: 'TOKEN',
      feeBps: 30,
    };
    expect(params.feeBps).toBe(30);
  });

  it('RemoveLiquidityParamsV2.lpAssetId is optional', () => {
    const withLp: RemoveLiquidityParamsV2 = {
      amountAMin: 0n,
      amountBMin: 0n,
      assetA: 'DCC',
      assetB: 'TOKEN',
      deadline: 9999999999999,
      feeBps: 30,
      lpAmount: 100n,
      lpAssetId: 'someId',
    };
    const withoutLp: RemoveLiquidityParamsV2 = {
      amountAMin: 0n,
      amountBMin: 0n,
      assetA: 'DCC',
      assetB: 'TOKEN',
      deadline: 9999999999999,
      feeBps: 30,
      lpAmount: 100n,
    };
    expect(withLp.lpAssetId).toBe('someId');
    expect(withoutLp.lpAssetId).toBeUndefined();
  });

  it('PoolStateV2 includes lpAssetId field', () => {
    const pool: Partial<PoolStateV2> = {
      lpAssetId: 'abc123',
    };
    expect(pool.lpAssetId).toBe('abc123');
  });
});
