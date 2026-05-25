import { issue } from '@decentralchain/transactions';
import { create } from '../../src';
import { CHAIN_ID, DAP_SCRIPT, MASTER_ACCOUNT, NODE_URL } from '../_state';

const api: ReturnType<typeof create> = create(NODE_URL);

it('fast hash', async () => {
  const message = 'some string';
  const hashResult = await api.utils.fetchHashFast(message);
  expect(typeof hashResult.hash).toBe('string');
  expect(hashResult.message).toBe(message);
});

it('secure hash', async () => {
  const message = 'some string';
  const hashResult = await api.utils.fetchHashSecure(message);
  expect(typeof hashResult.hash).toBe('string');
  expect(hashResult.message).toBe(message);
});

it('decompile code', async () => {
  const decompiled = await api.utils.fetchScriptDecompile(DAP_SCRIPT);
  expect(typeof decompiled.CONTENT_TYPE).toBe('string');
  expect(typeof decompiled.SCRIPT_TYPE).toBe('string');
  expect(typeof decompiled.STDLIB_VERSION).toBe('number');
  expect(typeof decompiled.script).toBe('string');
});

it('evaluate', async () => {
  const targetAddress = STATE.ACCOUNTS.FOR_SCRIPT.address;
  const expr = 'call()';
  const response = await api.utils.fetchEvaluate(targetAddress, expr);
  expect(response.address).toEqual(targetAddress);
  expect(response.complexity).toEqual(1);
  expect(response.expr).toEqual(expr);
  expect(response.result).toEqual({ type: 'Array', value: [] });
});

it('time', async () => {
  const nodeTime = await api.utils.fetchNodeTime();
  expect(typeof nodeTime.NTP).toBe('number');
  expect(typeof nodeTime.system).toBe('number');
});

it('generate seed with length', async () => {
  const seed = await api.utils.fetchSeed(10);
  expect(typeof seed.seed).toBe('string');
});

it('generate seed', async () => {
  const seed = await api.utils.fetchSeed();
  expect(typeof seed.seed).toBe('string');
});

it('compile code', async () => {
  const script = `{-# STDLIB_VERSION 4 #-}
                    {-# CONTENT_TYPE DAPP #-}
                    {-# SCRIPT_TYPE ACCOUNT #-}

                    @Callable(i)
                    func foo() = {
                      [
                        BooleanEntry("bool", true)
                      ]
                    }

                    @Verifier(tx)
                    func verify() = sigVerify(tx.bodyBytes, tx.proofs[0], tx.senderPublicKey)`;

  const compiled = await api.utils.fetchCompileCode(script);
  expect(typeof compiled.script).toBe('string');
  expect(typeof compiled.complexity).toBe('number');
  expect(typeof compiled.verifierComplexity).toBe('number');
  expect(compiled.extraFee).isStringOrNumber();
  expect(typeof compiled.callableComplexities).toBe('object');
  expect(compiled.callableComplexities).toMatchObject({
    foo: expect.any(Number),
  });
});

it('estimate', async () => {
  const compiledCode = `base64:AAIEAAAAAAAAAAQIAhIAAAAAAAAAAAEAAAABaQEAAAADZm9vAAAAAAkABEwAAAACCQEAAAAMQm9vbGVhbkVudHJ5AAAAAgIAAAAEYm9vbAYFAAAAA25pbAAAAAEAAAACdHgBAAAABnZlcmlmeQAAAAAJAAH0AAAAAwgFAAAAAnR4AAAACWJvZHlCeXRlcwkAAZEAAAACCAUAAAACdHgAAAAGcHJvb2ZzAAAAAAAAAAAACAUAAAACdHgAAAAPc2VuZGVyUHVibGljS2V5znw+lg==`;
  const estimate = await api.utils.fetchEstimate(compiledCode);
  expect(estimate.script).toBe(compiledCode);
  expect(typeof estimate.scriptText).toBe('string');
  expect(typeof estimate.complexity).toBe('number');
  expect(typeof estimate.verifierComplexity).toBe('number');
  expect(estimate.extraFee).isStringOrNumber();
  expect(typeof estimate.callableComplexities).toBe('object');
  expect(estimate.callableComplexities).toMatchObject({
    foo: expect.any(Number),
  });
});

it('tx serialize', async () => {
  const tx = issue(
    {
      chainId: CHAIN_ID,
      decimals: 5,
      description: 'some description',
      name: 'some name',
      quantity: 10000000,
      reissuable: false,
    },
    MASTER_ACCOUNT.SEED,
  );

  // @ts-expect-error: tx from issue() lacks WithApiMixin (applicationStatus/spentComplexity)
  // required by fetchTransactionSerialize's second parameter — intentional: testing
  // that the endpoint accepts signed-but-not-yet-broadcast transactions
  const serialized = await api.utils.fetchTransactionSerialize(tx);
  expect(serialized.bytes).toBeInstanceOf(Array);
});
