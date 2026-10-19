/**
 * websocket-api: state topic delivery (node -> blockchain-postgres-sync -> Redis -> websocket-api).
 *
 * Protocol: subscribing to a key that has no value yet produces no immediate frame; the first
 * value written is delivered as the `subscribed` frame (it is the subscription's current value),
 * and every later change is an `update` frame.
 */

import { broadcast, data, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, MASTER_SEED, WS_URL } from '../setup/env';

const TIMEOUT = 300_000;

type Frame = {
  type: string;
  topic?: string;
  value?: string;
  message_number?: number;
  message?: string;
};

describe('websocket-api state updates', () => {
  it(
    'delivers the first value of a new key as subscribed and later changes as update',
    async () => {
      const account = randomTestAccount(CHAIN_ID);
      await fundAccount(account.address, 2_000_000, MASTER_SEED, API_BASE, CHAIN_ID);
      const key = 'e2e_ws';
      const first = Date.now();
      const second = first + 1;
      const topic = `topic://state/${account.address}/${key}`;

      const ws = new WebSocket(WS_URL);
      const frames: Frame[] = [];
      const listeners = new Set<() => void>();
      ws.addEventListener('message', (event) => {
        const frame = JSON.parse(String(event.data)) as Frame;
        if (frame.type === 'ping') {
          ws.send(JSON.stringify({ message_number: frame.message_number, type: 'pong' }));
        }
        frames.push(frame);
        for (const l of listeners) l();
      });
      const waitFor = (match: (f: Frame) => boolean, ms: number) =>
        new Promise<Frame>((resolve, reject) => {
          const check = () => {
            const found = frames.find(match);
            if (!found) return;
            clearTimeout(timer);
            listeners.delete(check);
            resolve(found);
          };
          const timer = setTimeout(() => {
            listeners.delete(check);
            reject(
              new Error(
                `no matching frame within ${ms} ms; frames: ${JSON.stringify(frames.slice(-5))}`,
              ),
            );
          }, ms);
          listeners.add(check);
          check();
        });
      const write = async (value: number) => {
        const tx = data(
          { chainId: CHAIN_ID, data: [{ key, type: 'integer', value }] },
          account.seed,
        );
        await broadcast(tx, API_BASE);
        await waitForTx(tx.id, { apiBase: API_BASE, timeout: 120_000 });
      };

      await new Promise<void>((resolve, reject) => {
        ws.addEventListener('open', () => resolve(), { once: true });
        ws.addEventListener('error', () => reject(new Error(`cannot connect to ${WS_URL}`)), {
          once: true,
        });
      });
      try {
        ws.send(JSON.stringify({ topic, type: 'subscribe' }));

        await write(first);
        const subscribed = await waitFor((f) => f.topic === topic && f.type !== 'ping', 120_000);
        expect(subscribed.type).toBe('subscribed');
        expect(subscribed.value).toContain(String(first));

        await write(second);
        const update = await waitFor((f) => f.type === 'update' && f.topic === topic, 120_000);
        expect(update.value).toContain(String(second));
      } finally {
        ws.close();
      }
    },
    TIMEOUT,
  );

  it('rejects a malformed topic with an error frame', async () => {
    const ws = new WebSocket(WS_URL);
    const reply = new Promise<Frame>((resolve, reject) => {
      ws.addEventListener('message', (event) => {
        const frame = JSON.parse(String(event.data)) as Frame;
        if (frame.type !== 'ping') resolve(frame);
      });
      ws.addEventListener('error', () => reject(new Error(`cannot connect to ${WS_URL}`)));
    });
    ws.addEventListener('open', () =>
      ws.send(JSON.stringify({ topic: 'not-a-topic', type: 'subscribe' })),
    );
    try {
      const frame = await reply;
      expect(frame.type).toBe('error');
    } finally {
      ws.close();
    }
  });
});
