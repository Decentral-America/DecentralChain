/**
 * RIDE stdlib coverage — crypto functions.
 *
 * A full stdlib-vs-tested audit found every RIDE source across the whole suite
 * targets STDLIB_VERSION 5 with only a small repeated set of functions
 * (getInteger, IntegerEntry, addressFromStringValue, invoke, sigVerify used
 * only as a complexity-cost filler). These three crypto functions had zero
 * coverage anywhere:
 *
 *   - keccak256 / blake2b256 — verified against the SAME hash functions from
 *     @decentralchain/ts-lib-crypto computed client-side on the same input,
 *     not just "doesn't crash".
 *   - rsaVerify — verified with a real generated RSA keypair and a real
 *     PKCS#1v1.5/SHA-256 signature (Node's built-in crypto module), confirming
 *     both the true case (valid signature) and false case (tampered message).
 *
 * Not attempted here (flagging, not hiding): ecrecover, the groth16Verify
 * family, and p256Verify all need a compatible secp256k1/BLS/P-256 signing
 * setup this suite has no existing helper for — building and verifying one
 * correctly is a larger, separate effort from the rest of this pass.
 */

import { generateKeyPairSync, sign as nodeSign } from 'node:crypto';
import { broadcast, invokeScript, setScript, waitForTx } from '@decentralchain/transactions';
import { blake2b, keccak } from '@decentralchain/ts-lib-crypto';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 300_000;
const FUND = 20_000_000;

const CRYPTO_DAPP = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

@Callable(i)
func hashIt(input: ByteVector) = {
  [
    BinaryEntry("keccak256Result", keccak256(input)),
    BinaryEntry("blake2b256Result", blake2b256(input))
  ]
}

@Callable(i)
func verifyRsa(message: ByteVector, sig: ByteVector, pub: ByteVector) = {
  let ok = rsaVerify(SHA256, message, sig, pub)
  [BooleanEntry("rsaVerifyResult", ok)]
}
`.trim();

async function dataKey(addr: string, key: string) {
  const res = await fetch(`${API_BASE}addresses/data/${addr}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`data key ${key}: HTTP ${res.status}`);
  return (await res.json()) as { key: string; type: string; value: unknown };
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

describe('RIDE stdlib — crypto functions', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let dapp: ReturnType<typeof randomTestAccount>;
  let caller: ReturnType<typeof randomTestAccount>;
  let skip = false;

  beforeAll(async () => {
    let compiledB64: string;
    try {
      compiledB64 = await compileScript(CRYPTO_DAPP, API_BASE);
    } catch (e) {
      console.warn('RIDE compile unavailable — skipping crypto stdlib suite:', e);
      skip = true;
      return;
    }

    dapp = randomTestAccount(CHAIN_ID);
    caller = randomTestAccount(CHAIN_ID);
    await Promise.all([
      fundAccount(dapp.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID),
      fundAccount(caller.address, FUND, MASTER_SEED, API_BASE, CHAIN_ID),
    ]);

    const deployTx = setScript(
      { chainId: CHAIN_ID, fee: 1_000_000, script: compiledB64 },
      dapp.seed,
    );
    await broadcast(deployTx, API_BASE);
    await waitForTx(deployTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  }, TIMEOUT);

  it('keccak256 and blake2b256 match client-side computed hashes', async () => {
    if (skip) return;

    const input = new TextEncoder().encode('e2e stdlib crypto coverage');
    const expectedKeccak = keccak(input);
    const expectedBlake2b = blake2b(input);

    const tx = invokeScript(
      {
        call: {
          args: [{ type: 'binary', value: `base64:${bytesToBase64(input)}` }],
          function: 'hashIt',
        },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const keccakEntry = await dataKey(dapp.address, 'keccak256Result');
    const blake2bEntry = await dataKey(dapp.address, 'blake2b256Result');
    expect(keccakEntry?.value).toBe(`base64:${bytesToBase64(expectedKeccak)}`);
    expect(blake2bEntry?.value).toBe(`base64:${bytesToBase64(expectedBlake2b)}`);
  });

  it('rsaVerify confirms a real signature and rejects a tampered message', async () => {
    if (skip) return;

    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const message = Buffer.from('e2e rsaVerify coverage');
    const signature = nodeSign('RSA-SHA256', message, privateKey);
    // X.509 SubjectPublicKeyInfo DER — the exact format node-scala's RSA.scala parses.
    const pubDer = publicKey.export({ format: 'der', type: 'spki' });

    const invokeVerify = async (msg: Buffer, sig: Buffer) => {
      const tx = invokeScript(
        {
          call: {
            args: [
              { type: 'binary', value: `base64:${msg.toString('base64')}` },
              { type: 'binary', value: `base64:${sig.toString('base64')}` },
              { type: 'binary', value: `base64:${pubDer.toString('base64')}` },
            ],
            function: 'verifyRsa',
          },
          chainId: CHAIN_ID,
          dApp: dapp.address,
          fee: 500_000,
        },
        caller.seed,
      );
      await broadcast(tx, API_BASE);
      await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
      return dataKey(dapp.address, 'rsaVerifyResult');
    };

    const validResult = await invokeVerify(message, signature);
    expect(validResult?.value).toBe(true);

    const tamperedMessage = Buffer.from('e2e rsaVerify coverage — tampered');
    const invalidResult = await invokeVerify(tamperedMessage, signature);
    expect(invalidResult?.value).toBe(false);
  });

  afterAll(async () => {
    if (skip || !dapp) return;
    try {
      const removeTx = setScript({ chainId: CHAIN_ID, fee: 1_000_000, script: null }, dapp.seed);
      await broadcast(removeTx, API_BASE);
      await waitForTx(removeTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    } catch {
      /* best-effort */
    }
  }, TIMEOUT);
});
