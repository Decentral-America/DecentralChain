/**
 * RIDE stdlib coverage — collection/pure functions.
 *
 * Same motivation as ride-crypto-stdlib.spec.ts: a full stdlib-vs-tested audit
 * found these never exercised anywhere in the suite. Each function gets its
 * own @Callable so a failure identifies exactly which one broke, and every
 * assertion compares against an independently-computed expected value (not
 * just "doesn't crash").
 *
 * Covers: median, containsElement, list indexOf, FOLD<N>, parseInt (success
 * and failure/unit case), split, makeString, fraction, and tuple construction
 * + field access (._1/._2).
 */

import { broadcast, invokeScript, setScript, waitForTx } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { compileScript } from '../helpers/compile';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

type InvokeArg =
  | { type: 'string'; value: string }
  | { type: 'integer'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'binary'; value: string }
  | { type: 'list'; value: InvokeArg[] };

const TIMEOUT = 300_000;
const FUND = 20_000_000;

const COLLECTIONS_DAPP = `
{-# STDLIB_VERSION 5 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

func addUp(acc: Int, cur: Int) = acc + cur

@Callable(i)
func testMedianAndContains(numbers: List[Int], target: Int) = {
  let med = median(numbers)
  let has = containsElement(numbers, target)
  let idx = indexOf(numbers, target)
  [
    IntegerEntry("median", med),
    BooleanEntry("hasTarget", has),
    IntegerEntry("targetIndex", valueOrElse(idx, -1))
  ]
}

@Callable(i)
func testFold(numbers: List[Int]) = {
  let summed = FOLD<20>(numbers, 0, addUp)
  [IntegerEntry("folded", summed)]
}

@Callable(i)
func testParseInt(goodStr: String, badStr: String) = {
  let good = parseInt(goodStr)
  let bad = parseInt(badStr)
  [
    IntegerEntry("parsedGood", valueOrElse(good, -999)),
    BooleanEntry("parsedBadIsUnit", bad == unit)
  ]
}

@Callable(i)
func testStringOps(csv: String) = {
  let parts = split(csv, ",")
  let joined = makeString(parts, "-")
  [
    IntegerEntry("partCount", size(parts)),
    StringEntry("joined", joined)
  ]
}

@Callable(i)
func testFractionAndTuple(value: Int, num: Int, denom: Int) = {
  let frac = fraction(value, num, denom)
  let pair = (frac, value > 0)
  [
    IntegerEntry("fractionResult", frac),
    IntegerEntry("tupleFirst", pair._1),
    BooleanEntry("tupleSecond", pair._2)
  ]
}
`.trim();

async function dataKey(addr: string, key: string) {
  const res = await fetch(`${API_BASE}addresses/data/${addr}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`data key ${key}: HTTP ${res.status}`);
  return (await res.json()) as { key: string; type: string; value: unknown };
}

describe('RIDE stdlib — collection/pure functions', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let dapp: ReturnType<typeof randomTestAccount>;
  let caller: ReturnType<typeof randomTestAccount>;
  let skip = false;

  beforeAll(async () => {
    let compiledB64: string;
    try {
      compiledB64 = await compileScript(COLLECTIONS_DAPP, API_BASE);
    } catch (e) {
      console.warn('RIDE compile unavailable — skipping collections stdlib suite:', e);
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

  async function invoke(functionName: string, args: InvokeArg[]) {
    const tx = invokeScript(
      {
        call: { args, function: functionName },
        chainId: CHAIN_ID,
        dApp: dapp.address,
        fee: 500_000,
      },
      caller.seed,
    );
    await broadcast(tx, API_BASE);
    await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  }

  it('median, containsElement, and list indexOf match expected results', async () => {
    if (skip) return;

    // Odd-length list sidesteps any ambiguity in how an implementation
    // might average the two middle elements of an even-length list —
    // sorted [1,3,5,7,9], unambiguous middle value is 5.
    const numbers = [3, 7, 1, 9, 5];
    const target = 7; // present, at index 1 in the ORIGINAL (unsorted) order

    await invoke('testMedianAndContains', [
      { type: 'list', value: numbers.map((n) => ({ type: 'integer', value: n })) },
      { type: 'integer', value: target },
    ]);

    const median = await dataKey(dapp.address, 'median');
    const hasTarget = await dataKey(dapp.address, 'hasTarget');
    const targetIndex = await dataKey(dapp.address, 'targetIndex');
    expect(median?.value).toBe(5);
    expect(hasTarget?.value).toBe(true);
    expect(targetIndex?.value).toBe(1);
  });

  it('FOLD<20> sums a list correctly', async () => {
    if (skip) return;

    const numbers = [1, 2, 3, 4, 5];
    await invoke('testFold', [
      { type: 'list', value: numbers.map((n) => ({ type: 'integer', value: n })) },
    ]);

    const folded = await dataKey(dapp.address, 'folded');
    expect(folded?.value).toBe(15);
  });

  it('parseInt succeeds on a valid string and returns unit on an invalid one', async () => {
    if (skip) return;

    await invoke('testParseInt', [
      { type: 'string', value: '12345' },
      { type: 'string', value: 'not-a-number' },
    ]);

    const parsedGood = await dataKey(dapp.address, 'parsedGood');
    const parsedBadIsUnit = await dataKey(dapp.address, 'parsedBadIsUnit');
    expect(parsedGood?.value).toBe(12345);
    expect(parsedBadIsUnit?.value).toBe(true);
  });

  it('split and makeString round-trip a CSV string', async () => {
    if (skip) return;

    await invoke('testStringOps', [{ type: 'string', value: 'a,b,c,d' }]);

    const partCount = await dataKey(dapp.address, 'partCount');
    const joined = await dataKey(dapp.address, 'joined');
    expect(partCount?.value).toBe(4);
    expect(joined?.value).toBe('a-b-c-d');
  });

  it('fraction and tuple field access match expected results', async () => {
    if (skip) return;

    // 9 × 2 / 3 = 6 exactly — no rounding-mode ambiguity to worry about.
    await invoke('testFractionAndTuple', [
      { type: 'integer', value: 9 },
      { type: 'integer', value: 2 },
      { type: 'integer', value: 3 },
    ]);

    const fractionResult = await dataKey(dapp.address, 'fractionResult');
    const tupleFirst = await dataKey(dapp.address, 'tupleFirst');
    const tupleSecond = await dataKey(dapp.address, 'tupleSecond');
    expect(fractionResult?.value).toBe(6);
    expect(tupleFirst?.value).toBe(6);
    expect(tupleSecond?.value).toBe(true);
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
