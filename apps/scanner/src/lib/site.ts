type Env = Readonly<Record<string, string | undefined>>;

const EXPLORER_BY_CHAIN: Readonly<Record<number, string>> = {
  33: 'https://testnet.decentralscan.com',
  63: 'https://decentralscan.com',
  83: 'https://stagenet.decentralscan.com',
};

const warned = new Set<string>();

function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * Strictly parsed chain id. Unset means mainnet (63). A value that is set but
 * is not a clean integer yields `undefined`, which callers treat as "not
 * mainnet" so a typo can never make a test network indexable.
 */
function chainId(env: Env): number | undefined {
  const raw = env.DCC_CHAIN_ID?.trim();
  if (!raw) return 63;
  if (!/^\d+$/.test(raw)) {
    warnOnce(
      `[site] DCC_CHAIN_ID=${JSON.stringify(raw)} is not an integer; treating as non-mainnet`,
    );
    return undefined;
  }
  return Number.parseInt(raw, 10);
}

/**
 * Absolute public origin of this explorer, for sitemap and robots URLs.
 * Returns undefined for an unknown chain with no DCC_SCANNER_PUBLIC_URL, so a
 * non-mainnet explorer never advertises the mainnet origin.
 */
export function publicBaseUrl(env: Env = process.env): string | undefined {
  const explicit = env.DCC_SCANNER_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const id = chainId(env);
  const origin = id === undefined ? undefined : EXPLORER_BY_CHAIN[id];
  if (!origin) {
    warnOnce('[site] unknown DCC_CHAIN_ID and no DCC_SCANNER_PUBLIC_URL; omitting sitemap URLs');
  }
  return origin;
}

/** Test networks must stay out of search results so they are not mistaken for mainnet. */
export function isMainnet(env: Env = process.env): boolean {
  return chainId(env) === 63;
}
