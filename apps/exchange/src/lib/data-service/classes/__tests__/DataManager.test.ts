/**
 * DataManager — lazy matcher polling gate
 *
 * Verifies that getReservedBalance() is never called unless
 * activateMatcherPolling() has been called, and that the flag resets
 * correctly on deactivation and logout (dropAddress).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockGetReservedBalance = vi.fn().mockResolvedValue({});

vi.mock('../../api/matcher/getOrders', () => ({
  getReservedBalance: () => mockGetReservedBalance(),
}));

vi.mock('../../api/assets/assets', () => ({
  balanceList: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/aliases/aliases', () => ({
  getAliasesByAddress: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/data', () => ({
  getOracleData: vi.fn().mockResolvedValue({ assets: {} }),
}));

vi.mock('../../config', () => ({
  change: { on: vi.fn() },
  get: vi.fn().mockReturnValue(''),
}));

vi.mock('../UTXManager', () => ({
  UTXManager: class {
    applyAddress = vi.fn();
    dropAddress = vi.fn();
  },
}));

// ── Import under test ─────────────────────────────────────────────────────────
const { DataManager } = await import('../DataManager');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Advance fake timers past one poll interval and flush microtasks. */
async function tickOnePollCycle() {
  await vi.advanceTimersByTimeAsync(1001);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DataManager — matcher polling gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGetReservedBalance.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call getReservedBalance before activateMatcherPolling()', async () => {
    const dm = new DataManager();
    dm.applyAddress('3PtestAddress');
    await tickOnePollCycle();
    expect(mockGetReservedBalance).not.toHaveBeenCalled();
    dm.dropAddress();
  });

  it('calls getReservedBalance after activateMatcherPolling()', async () => {
    const dm = new DataManager();
    dm.applyAddress('3PtestAddress');
    dm.activateMatcherPolling();
    await tickOnePollCycle();
    expect(mockGetReservedBalance).toHaveBeenCalled();
    dm.dropAddress();
  });

  it('stops calling getReservedBalance after deactivateMatcherPolling()', async () => {
    const dm = new DataManager();
    dm.applyAddress('3PtestAddress');
    dm.activateMatcherPolling();
    await tickOnePollCycle();
    const callsWhileActive = mockGetReservedBalance.mock.calls.length;
    expect(callsWhileActive).toBeGreaterThan(0);

    dm.deactivateMatcherPolling();
    vi.clearAllMocks();
    await tickOnePollCycle();
    expect(mockGetReservedBalance).not.toHaveBeenCalled();
    dm.dropAddress();
  });

  it('dropAddress() resets the flag — new session starts inactive', async () => {
    const dm = new DataManager();
    dm.applyAddress('3PtestAddress');
    dm.activateMatcherPolling();
    dm.dropAddress(); // logout — resets flag

    vi.clearAllMocks();
    dm.applyAddress('3PtestAddress'); // new login
    await tickOnePollCycle();
    expect(mockGetReservedBalance).not.toHaveBeenCalled();
    dm.dropAddress();
  });

  it('activateMatcherPolling() is idempotent', () => {
    const dm = new DataManager();
    expect(() => {
      dm.activateMatcherPolling();
      dm.activateMatcherPolling();
    }).not.toThrow();
    dm.dropAddress();
  });

  it('deactivateMatcherPolling() is safe when already inactive', () => {
    const dm = new DataManager();
    expect(() => {
      dm.deactivateMatcherPolling();
      dm.deactivateMatcherPolling();
    }).not.toThrow();
  });

  it('dropAddress() is safe without a prior applyAddress', () => {
    const dm = new DataManager();
    expect(() => dm.dropAddress()).not.toThrow();
  });
});
