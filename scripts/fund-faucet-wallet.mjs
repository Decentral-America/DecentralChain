/**
 * One-shot script: transfer 5,000,000 DCC from gen-0 to the faucet wallet.
 *
 * Usage:
 *   GEN0_SEED="<gen-0 seed phrase>" node scripts/fund-faucet-wallet.mjs
 *
 * Prerequisites:
 *   pnpm --filter ./packages/sdk/transactions run build   (if not already built)
 *
 * This is a one-time operation. Run it once after the faucet wallet is set up.
 */

import { broadcast, transfer } from '../packages/sdk/transactions/dist/index.mjs';

const GEN0_SEED = process.env.GEN0_SEED;
if (!GEN0_SEED) {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.error('ERROR: Set GEN0_SEED environment variable to the gen-0 wallet seed phrase.');
  process.exit(1);
}

const NODE_URL = process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io';
// biome-ignore lint/security/noSecrets: this is a public blockchain address, not a secret
const FAUCET_ADDRESS = '31XRiENNF6qbyHBQssRNP4GwTR4KTAokYGC';
const AMOUNT_DCC = 5_000_000;
const AMOUNT_UNITS = AMOUNT_DCC * 1e8;

// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`\nFunding faucet wallet`);
// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`  From: gen-0 (${GEN0_SEED.slice(0, 20)}…)`);
// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`  To:   ${FAUCET_ADDRESS}`);
// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`  Amount: ${AMOUNT_DCC.toLocaleString()} DCC`);
// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`  Node: ${NODE_URL}\n`);

const tx = transfer(
  {
    amount: AMOUNT_UNITS,
    attachment: '',
    fee: 100000,
    recipient: FAUCET_ADDRESS,
  },
  GEN0_SEED,
);

// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`Signed TX id: ${tx.id}`);
// biome-ignore lint/suspicious/noConsole: CLI script
// biome-ignore lint/security/noSecrets: not a secret
console.log('Broadcasting…');

try {
  const result = await broadcast(tx, NODE_URL);
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log('\n✅ Success!');
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`   TX ID:    ${result.id}`);
  // biome-ignore lint/suspicious/noConsole: CLI script
  // biome-ignore lint/security/noSecrets: public testnet explorer URL, not a secret
  console.log(`   Explorer: https://testnet.decentralscan.com/transaction?id=${result.id}\n`);
} catch (err) {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.error('\n❌ Broadcast failed:', err.message);
  process.exit(1);
}
