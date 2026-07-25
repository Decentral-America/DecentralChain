import { broadcast, invokeScript, libs, transfer, waitForTx } from '@decentralchain/transactions';
import { type InvokeScriptTransaction } from '@decentralchain/types';
import { create } from '../../src';
import { type TLong } from '../../src/interface';
import { type TWithState } from '../../src/tools/transactions/transactions';
import { CHAIN_ID, NODE_URL, STATE } from '../_state';

const api = create(NODE_URL);

// NOTE: fetchStateChangesByTxId/fetchStateChangesByAddress are deprecated wrappers that now
// proxy to the real GET /transactions/info/{id} and GET /transactions/address/{address}/limit/{limit}
// routes (the old /debug/stateChanges/* routes were removed by node-scala's
// "NODE-2496 Remove deprecated API routes (#3876)", commit c82177af69). See
// test/api-node-deprecated.spec.ts for URL-level unit coverage of the delegation itself.
describe('State changes by transaction Id', () => {
  it('gets state changes', async () => {
    const itx = invokeScript(
      {
        call: {
          function: 'call',
        },
        chainId: CHAIN_ID,
        dApp: STATE.ACCOUNTS.FOR_SCRIPT.address,
      },
      STATE.ACCOUNTS.SIMPLE.seed,
    );
    await broadcast(itx, NODE_URL);
    await waitForTx(itx.id, { apiBase: NODE_URL });

    const stateChanges = (await api.debug.fetchStateChangesByTxId(itx.id)).stateChanges;
    expect(stateChanges.data).toStrictEqual([]);
    expect(stateChanges.transfers).toStrictEqual([]);
  });

  it('throws on not found tx', async () => {
    const f = api.debug.fetchStateChangesByTxId('DvLdoLzts782sRia4BX1TH8HBmoP33b8Tp6ATTeNhrMk');
    await expect(f).rejects.toMatchObject({ data: { error: 311 } });
  });

  // Behavior changed with the underlying route migration: the removed /debug/stateChanges/info
  // route rejected non-invoke transactions with error 312 ("transaction type not supported").
  // Its replacement, GET /transactions/info/{id}, has no such restriction — it returns any
  // transaction type, simply without a `stateChanges` field when the tx isn't an invoke script.
  it('resolves (without stateChanges) for a non-invoke-script tx', async () => {
    const ttx = transfer(
      {
        amount: 1000,
        recipient: libs.crypto.address(STATE.ACCOUNTS.SIMPLE.seed, CHAIN_ID),
      },
      STATE.ACCOUNTS.SIMPLE.seed,
    );
    await broadcast(ttx, NODE_URL);
    await waitForTx(ttx.id, { apiBase: NODE_URL });
    const tx = await api.debug.fetchStateChangesByTxId(ttx.id);
    expect(tx.stateChanges).toBeUndefined();
  });

  it('state schanges in stage', async () => {
    const api2: ReturnType<typeof create> = create('https://nodes-stagenet.decentralchain.io/');
    //3MaPRBKB36GMoH59ShRKAzbHretBzqDYKxs
    const tx = await api2.transactions.fetchInfo('3rho1m5FfLmVi6iVfkVuvdEFVcv2JMEVxh9wzj7kFrCK');
    const _txState = (tx as InvokeScriptTransaction<TLong> & TWithState).stateChanges;
  });
});
