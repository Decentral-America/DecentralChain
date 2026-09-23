import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmApplied, getApplicationStatus } from '@/services/amm/client';

const jsonResponse = (body: unknown, ok = true) =>
  ({ json: () => Promise.resolve(body), ok, status: ok ? 200 : 404 }) as unknown as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getApplicationStatus', () => {
  it('reads the status the node reports', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ applicationStatus: 'succeeded' }));

    await expect(getApplicationStatus('abc')).resolves.toBe('succeeded');
  });

  it('returns null when the node does not know the transaction yet', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));

    await expect(getApplicationStatus('abc')).resolves.toBeNull();
  });

  it('does not throw when the node is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(getApplicationStatus('abc')).resolves.toBeNull();
  });
});

describe('confirmApplied', () => {
  it('reports success only for "succeeded"', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ applicationStatus: 'succeeded' }));

    await expect(confirmApplied('abc')).resolves.toEqual({
      applied: true,
      status: 'succeeded',
    });
  });

  it('reports a mined-but-rejected call as not applied', async () => {
    // The trap this exists for: a callable's own must(...) can fail during
    // script execution. The transaction is mined and the fee is charged, state
    // is unchanged, and nothing throws — the only signal is this field.
    // Treating "mined" as "swapped" tells the user their trade went through.
    fetchMock.mockResolvedValue(jsonResponse({ applicationStatus: 'script_execution_failed' }));

    await expect(confirmApplied('abc')).resolves.toEqual({
      applied: false,
      status: 'script_execution_failed',
    });
  });

  it('gives up rather than reporting success when the node never answers', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));

    await expect(confirmApplied('abc', { attempts: 2, intervalMs: 1 })).resolves.toEqual({
      applied: false,
      status: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
