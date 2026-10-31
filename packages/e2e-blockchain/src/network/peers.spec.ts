/**
 * Peer network tests.
 *
 * /peers/connected and /peers/all are API-key protected on the node. On the public testnet the
 * edge proxy adds the key for these two GET routes; for any other node set DCC_TEST_API_KEY
 * (admin-e2e passes it too). Nothing here is skipped silently: no answer, no peers, or a peer
 * from another chain fails the run.
 */

import { pollUntil } from '../helpers/finality';
import { API_BASE, API_KEY, CHAIN_ID } from '../setup/env';

const TIMEOUT = 180_000;

type Peer = {
  address: string;
  declaredAddress?: string;
  peerName?: string;
  applicationName?: string;
  applicationVersion?: string;
};

async function peers(path: 'connected' | 'all'): Promise<Peer[]> {
  const res = await fetch(`${API_BASE}peers/${path}`, {
    headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
  });
  expect(res.status, `/peers/${path} must answer 200; set DCC_TEST_API_KEY for this node`).toBe(
    200,
  );
  return ((await res.json()) as { peers: Peer[] }).peers;
}

describe('Peer network connectivity', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('node has at least one connected peer within 120 s', async () => {
    const connected = await pollUntil(
      async () => {
        const found = await peers('connected');
        return found.length > 0 ? found : undefined;
      },
      { description: 'a connected peer', intervalMs: 10_000, timeoutMs: 120_000 },
    );
    expect(connected.length).toBeGreaterThanOrEqual(1);
  });

  it('every connected peer has an address and runs this chain', async () => {
    const connected = await peers('connected');
    expect(connected.length).toBeGreaterThanOrEqual(1);
    for (const peer of connected) {
      expect(peer.address).toMatch(/^\/.+:\d+$/);
      expect(peer.applicationName).toBe(`DCC${CHAIN_ID}`);
    }
  });

  it('/peers/all answers with the known-peer list (may be empty when peers are only inbound)', async () => {
    const all = await peers('all');
    expect(Array.isArray(all)).toBe(true);
    for (const peer of all) expect(peer.address).toMatch(/^\/.+:\d+$/);
  });
});
