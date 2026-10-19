/**
 * BlockchainUpdates gRPC (port 6881). The public testnet does not expose it, so these tests are
 * reported as skipped unless DCC_TEST_GRPC_UPDATES_URL is set (e.g. via an SSH tunnel to the node).
 */

import {
  mkBlockchainUpdatesApi,
  mkDefaultBlockchainUpdatesChannel,
} from '@decentralchain/node-api-grpc';
import { base58Encode } from '@decentralchain/ts-lib-crypto';
import { API_BASE, GRPC_UPDATES_URL } from '../setup/env';

async function height(): Promise<number> {
  const res = await fetch(`${API_BASE}blocks/height`);
  return ((await res.json()) as { height: number }).height;
}

describe('blockchain-updates gRPC', () => {
  it.skipIf(!GRPC_UPDATES_URL)(
    'GetBlockUpdate returns the block REST reports at that height',
    async () => {
      const target = (await height()) - 5;
      const headerRes = await fetch(`${API_BASE}blocks/headers/at/${target}`);
      const { id } = (await headerRes.json()) as { id: string };

      const api = mkBlockchainUpdatesApi(mkDefaultBlockchainUpdatesChannel(GRPC_UPDATES_URL));
      const { update } = await api.getBlockUpdate({ height: target });
      expect(update?.height).toBe(target);
      expect(base58Encode(update?.id ?? new Uint8Array())).toBe(id);
    },
    60_000,
  );

  it.skipIf(!GRPC_UPDATES_URL)(
    'Subscribe streams a historical range in height order',
    async () => {
      const tip = await height();
      const from = tip - 4;
      const to = tip - 2;
      const api = mkBlockchainUpdatesApi(mkDefaultBlockchainUpdatesChannel(GRPC_UPDATES_URL));
      const seen: number[] = [];
      for await (const event of api.subscribe(
        { fromHeight: from, toHeight: to },
        { signal: AbortSignal.timeout(50_000) },
      )) {
        if (event.update) seen.push(event.update.height);
        if ((event.update?.height ?? 0) >= to) break;
      }
      expect(seen[0]).toBe(from);
      expect(seen.at(-1)).toBe(to);
      expect([...seen].sort((a, b) => a - b)).toEqual(seen);
    },
    60_000,
  );
});
