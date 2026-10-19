/**
 * Pre-deploy check that the DEX will open on real markets.
 *
 * Usage: node scripts/checkNetworkMarkets.js <mainnet|stagenet|testnet>
 *
 * - marketSource "config": every asset id in tradingPairs must exist on the
 *   network's node (a re-genesis silently invalidated the old testnet pair).
 *   Missing asset -> exit 1.
 * - marketSource "matcher": the matcher must list at least one visible market.
 *   None -> GitHub warning only (the matcher is a live service, not config).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function configuredAssetIds(config) {
  return [...new Set((config.tradingPairs ?? []).flat().filter((id) => id !== 'DCC'))];
}

export function visibleMarkets(markets, hiddenNames) {
  const hidden = new Set(hiddenNames);
  return markets.filter((m) => !hidden.has(m.amountAssetName) && !hidden.has(m.priceAssetName));
}

async function main(network) {
  if (!['mainnet', 'stagenet', 'testnet'].includes(network)) {
    console.error('usage: node scripts/checkNetworkMarkets.js <mainnet|stagenet|testnet>');
    return 2;
  }
  const config = JSON.parse(
    readFileSync(path.join(APP_ROOT, 'src/configs', `${network}.json`), 'utf8'),
  );

  if (config.marketSource === 'matcher') {
    let body;
    try {
      const res = await fetch(`${config.matcher}/orderbook`);
      if (!res.ok) {
        console.log(`::warning::${network} matcher /orderbook answered HTTP ${res.status}`);
        return 0;
      }
      body = await res.json();
    } catch (err) {
      console.log(`::warning::${network} matcher unreachable: ${err.cause?.code ?? err.message}`);
      return 0;
    }
    const count = visibleMarkets(body.markets ?? [], config.hiddenMarketAssetNames ?? []).length;
    if (count === 0) {
      console.log(`::warning::${network} matcher lists no visible market; the DEX opens empty`);
    } else {
      console.log(`${network}: ${count} visible matcher market(s)`);
    }
    return 0;
  }

  const ids = configuredAssetIds(config);
  const missing = [];
  for (const id of ids) {
    try {
      const res = await fetch(`${config.node}/assets/details/${id}`);
      if (res.status !== 200) missing.push(`${id} (HTTP ${res.status})`);
    } catch (err) {
      missing.push(`${id} (node unreachable: ${err.cause?.code ?? err.message})`);
    }
  }
  for (const entry of missing) {
    console.error(`::error::trading-pair asset does not exist on ${config.node}: ${entry}`);
  }
  if (missing.length > 0) return 1;
  console.log(`${network}: all ${ids.length} configured trading-pair assets exist`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv[2]);
}
