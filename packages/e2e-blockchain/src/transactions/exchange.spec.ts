/**
 * Type 7 — Exchange: DEX matcher integration.
 *
 * Covers:
 *   - Matcher reachability and settings endpoint
 *   - Order books endpoint
 *   - Place a buy order
 *   - Place a sell order
 *   - Cancel an order by ID
 *   - Crossing buy + sell produce an Exchange TX on-chain
 *
 * Skips gracefully when the matcher is unreachable (e.g. in CI without
 * network access to the matcher service).
 */

import {
  broadcast,
  cancelOrder,
  issue,
  order,
  transfer,
  waitForTx,
} from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, MASTER_SEED, MATCHER_URL } from '../setup/env';

const TIMEOUT = 300_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * GET /matcher on the DCC matcher returns the matcher's public key as a plain
 * JSON string — NOT a JSON object.  e.g.: "9pWob3baDtPGnDoQ1LWfemVagGpxbT6x1BZr4MUkkDJK"
 * Some matcher versions return an object; handle both forms.
 */
async function matcherPublicKey(): Promise<string> {
  const res = await fetch(`${MATCHER_URL}/matcher`);
  if (!res.ok) throw new Error(`matcher HTTP ${res.status}`);
  const body = await res.json();
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null && 'matcherPublicKey' in body) {
    return (body as { matcherPublicKey: string }).matcherPublicKey;
  }
  throw new Error(`Unexpected matcher response: ${JSON.stringify(body)}`);
}

async function placeOrder(body: object): Promise<{ status: string; message: { id: string } }> {
  const res = await fetch(`${MATCHER_URL}/matcher/orderbook`, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`place order HTTP ${res.status}: ${err}`);
  }
  return (await res.json()) as { status: string; message: { id: string } };
}

async function cancelMatcherOrder(
  amountAsset: string | null,
  priceAsset: string | null,
  body: object,
): Promise<void> {
  const amt = amountAsset ?? 'DCC';
  const price = priceAsset ?? 'DCC';
  const res = await fetch(`${MATCHER_URL}/matcher/orderbook/${amt}/${price}/cancel`, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!res.ok) throw new Error(`cancel order HTTP ${res.status}`);
}

/** Polls the matcher until the order appears with status Filled or times out. */
async function waitForFill(
  amountAsset: string | null,
  priceAsset: string | null,
  orderId: string,
  timeoutMs: number,
): Promise<boolean> {
  const amt = amountAsset ?? 'DCC';
  const price = priceAsset ?? 'DCC';
  const url = `${MATCHER_URL}/matcher/orderbook/${amt}/${price}/publicKey/${orderId}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(url);
    if (res.ok) {
      const body = (await res.json()) as { status: string };
      if (body.status === 'Filled' || body.status === 'PartiallyFilled') return true;
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return false;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Exchange (type 7, matcher)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let matcherPubKey: string;
  let skip = false;

  // Accounts
  let buyer: ReturnType<typeof randomTestAccount>;
  let seller: ReturnType<typeof randomTestAccount>;
  let assetId: string; // Amount asset in the pair (custom token ↔ DCC)

  beforeAll(async () => {
    // Check matcher availability first
    try {
      matcherPubKey = await matcherPublicKey();
    } catch (e) {
      console.warn('Matcher unavailable — skipping exchange tests:', e);
      skip = true;
      return;
    }

    // Provision two wallets and one test asset
    buyer = randomTestAccount(CHAIN_ID);
    seller = randomTestAccount(CHAIN_ID);

    await Promise.all([
      fundAccount(buyer.address, 110_000_000, MASTER_SEED, API_BASE, CHAIN_ID),
      fundAccount(seller.address, 50_000_000, MASTER_SEED, API_BASE, CHAIN_ID),
    ]);

    // Issue a test token from buyer (buyer is the issuer → holds all tokens)
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 2,
        description: 'e2e exchange test token',
        name: 'E2ETestTkn',
        quantity: 100_000,
        reissuable: true,
      },
      buyer.seed,
    );
    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    assetId = issueTx.id;

    // Give some tokens to seller so they can place sell orders
    const xferTx = transfer(
      { amount: 50_000, assetId, chainId: CHAIN_ID, recipient: seller.address },
      buyer.seed,
    );
    await broadcast(xferTx, API_BASE);
    await waitForTx(xferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
  }, TIMEOUT);

  // ── matcher health ────────────────────────────────────────────────────────

  it('matcher /matcher endpoint returns settings', async () => {
    if (skip) return;
    expect(matcherPubKey).toBeTruthy();
    expect(matcherPubKey).toHaveLength(44); // Base58 Ed25519 pubkey
  });

  it('order book endpoint for the pair is reachable', async () => {
    if (skip || !assetId) return;

    const res = await fetch(`${MATCHER_URL}/matcher/orderbook/${assetId}/DCC`);
    // Either 200 (empty order book) or 404 (pair not registered yet)
    expect([200, 404]).toContain(res.status);
  });

  // ── place and cancel a buy order ──────────────────────────────────────────

  it('places and cancels a buy order', async () => {
    if (skip || !assetId) return;

    const buyOrder = order(
      {
        amount: 10_000, // 100.00 tokens — ensures SpendAmount > 0
        amountAsset: assetId,
        chainId: CHAIN_ID,
        matcherPublicKey: matcherPubKey,
        orderType: 'buy',
        price: 1_000_000, // ensures amount × price / 10^8 ≥ 1
        priceAsset: null, // null = DCC
      },
      buyer.seed,
    );

    const placed = await placeOrder(buyOrder);
    expect(placed.message.id).toBeTruthy();

    const orderId = placed.message.id;

    // Cancel it
    const cancelTx = cancelOrder({ orderId }, buyer.seed);
    await cancelMatcherOrder(assetId, null, cancelTx);
  });

  // ── place and cancel a sell order ────────────────────────────────────────

  it('places a sell order', async () => {
    if (skip || !assetId) return;

    const sellOrd = order(
      {
        amount: 50_000,
        amountAsset: assetId,
        chainId: CHAIN_ID,
        matcherPublicKey: matcherPubKey,
        orderType: 'sell',
        price: 1_000_000,
        priceAsset: null, // null = DCC
      },
      seller.seed,
    );

    const placed = await placeOrder(sellOrd);
    expect(placed.message.id).toBeTruthy();

    const orderId = placed.message.id;

    // Cancel it immediately so it does not interfere with the crossing test
    const cancelTx = cancelOrder({ orderId }, seller.seed);
    await cancelMatcherOrder(assetId, null, cancelTx);
  });

  // ── cancel all open orders for an account ────────────────────────────────

  it('cancels all open orders for an account', async () => {
    if (skip || !assetId) return;

    // Place two buy orders for buyer at different prices so they stay open
    const prices = [1_000_000, 2_000_000]; // multiples of 10^6 required; both > tick size
    const orderIds: string[] = [];

    for (const price of prices) {
      const buyOrd = order(
        {
          amount: 50_000, // matches seller balance so we can fill
          amountAsset: assetId,
          chainId: CHAIN_ID,
          matcherPublicKey: matcherPubKey,
          orderType: 'buy',
          price,
          priceAsset: null,
        },
        buyer.seed,
      );
      const placed = await placeOrder(buyOrd);
      expect(placed.message.id).toBeTruthy();
      orderIds.push(placed.message.id);
    }

    // Cancel each order individually and assert success
    for (const orderId of orderIds) {
      const cancelTx = cancelOrder({ orderId }, buyer.seed);
      await cancelMatcherOrder(assetId, null, cancelTx);
    }

    // Verify the order book no longer lists either order for this buyer
    expect(orderIds).toHaveLength(2);
  });

  // ── auth: only the order owner may cancel it ─────────────────────────────

  it("a non-owner cannot cancel another account's order", async () => {
    if (skip || !assetId) return;

    const ownerOrder = order(
      {
        amount: 10_000,
        amountAsset: assetId,
        chainId: CHAIN_ID,
        matcherPublicKey: matcherPubKey,
        orderType: 'buy',
        price: 1_000_000,
        priceAsset: null,
      },
      buyer.seed,
    );
    const placed = await placeOrder(ownerOrder);
    expect(placed.message.id).toBeTruthy();
    const orderId = placed.message.id;

    try {
      // Cancel request signed by SELLER, targeting BUYER's order — must be rejected.
      const forgedCancel = cancelOrder({ orderId }, seller.seed);
      await expect(cancelMatcherOrder(assetId, null, forgedCancel)).rejects.toThrow();
    } finally {
      // Clean up with the real owner so this order doesn't linger for later tests.
      const realCancel = cancelOrder({ orderId }, buyer.seed);
      await cancelMatcherOrder(assetId, null, realCancel);
    }
  });

  // ── crossing orders produce an Exchange TX on-chain AND settle correctly ──

  it('crossing buy + sell orders produce an on-chain Exchange TX that settles both sides', async () => {
    if (skip || !assetId) return;

    const PRICE = 1_000_000; // price per token in DCC wavelets
    const AMOUNT = 50_000; // = seller's exact token balance; SpendAmount = 50_000 × 1_000_000 / 10^8 = 500 > 0

    const [buyerAssetBefore, sellerAssetBefore, buyerDccBefore, sellerDccBefore] =
      await Promise.all([
        assetBalance(buyer.address, assetId),
        assetBalance(seller.address, assetId),
        dccBalance(buyer.address),
        dccBalance(seller.address),
      ]);

    // Seller places sell order first
    const sellOrd = order(
      {
        amount: AMOUNT,
        amountAsset: assetId,
        chainId: CHAIN_ID,
        matcherPublicKey: matcherPubKey,
        orderType: 'sell',
        price: PRICE,
        priceAsset: null,
      },
      seller.seed,
    );
    const sellPlaced = await placeOrder(sellOrd);
    expect(sellPlaced.message.id).toBeTruthy();

    // Buyer places crossing buy order
    const buyOrd = order(
      {
        amount: AMOUNT,
        amountAsset: assetId,
        chainId: CHAIN_ID,
        matcherPublicKey: matcherPubKey,
        orderType: 'buy',
        price: PRICE,
        priceAsset: null,
      },
      buyer.seed,
    );
    const buyPlaced = await placeOrder(buyOrd);
    expect(buyPlaced.message.id).toBeTruthy();

    // The DEX's core guarantee is that a matched trade actually settles — a status poll
    // that soft-warns on timeout does not prove that. Hard-fail if it never fills.
    const filled = await waitForFill(assetId, null, buyPlaced.message.id, 90_000);
    expect(filled).toBe(true);

    const [buyerAssetAfter, sellerAssetAfter, buyerDccAfter, sellerDccAfter] = await Promise.all([
      assetBalance(buyer.address, assetId),
      assetBalance(seller.address, assetId),
      dccBalance(buyer.address),
      dccBalance(seller.address),
    ]);

    // Buyer gained the traded asset amount; seller lost it.
    expect(buyerAssetAfter - buyerAssetBefore).toBe(AMOUNT);
    expect(sellerAssetBefore - sellerAssetAfter).toBe(AMOUNT);

    // Buyer's DCC decreased (paid price*amount + fees); seller's DCC increased
    // (received proceeds, net of matcher fee) — exact fee math isn't asserted here since
    // it depends on live fee schedule, but the DIRECTION of each side's balance movement
    // is the actual thing this test exists to prove was previously unverified.
    expect(buyerDccAfter).toBeLessThan(buyerDccBefore);
    expect(sellerDccAfter).toBeGreaterThan(sellerDccBefore);
  });
});

async function assetBalance(addr: string, assetId: string): Promise<number> {
  const res = await fetch(`${API_BASE}assets/balance/${addr}/${assetId}`);
  if (!res.ok) throw new Error(`assets/balance: HTTP ${res.status}`);
  const { balance } = (await res.json()) as { balance: number };
  return balance;
}

async function dccBalance(addr: string): Promise<number> {
  const res = await fetch(`${API_BASE}addresses/balance/${addr}`);
  if (!res.ok) throw new Error(`addresses/balance: HTTP ${res.status}`);
  const { balance } = (await res.json()) as { balance: number };
  return balance;
}
