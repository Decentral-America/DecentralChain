type Env = Readonly<Record<string, string | undefined>>;

const EXPLORER_BY_CHAIN: Readonly<Record<number, string>> = {
  33: 'https://testnet.decentralscan.com',
  63: 'https://decentralscan.com',
  83: 'https://stagenet.decentralscan.com',
};

function chainId(env: Env): number {
  const value = env.DCC_CHAIN_ID ? Number.parseInt(env.DCC_CHAIN_ID, 10) : 63;
  return Number.isInteger(value) ? value : 63;
}

/** Absolute public origin of this explorer, for sitemap and robots URLs. */
export function publicBaseUrl(env: Env = process.env): string {
  const explicit = env.DCC_SCANNER_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  return EXPLORER_BY_CHAIN[chainId(env)] ?? 'https://decentralscan.com';
}

/** Test networks must stay out of search results so they are not mistaken for mainnet. */
export function isMainnet(env: Env = process.env): boolean {
  return chainId(env) === 63;
}
