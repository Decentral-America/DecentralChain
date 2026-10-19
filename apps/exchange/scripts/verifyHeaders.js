/**
 * Checks the Cloudflare Pages `_headers` file the exchange ships.
 *
 * Usage: node scripts/verifyHeaders.js <path/to/_headers> <mainnet|stagenet|testnet>
 *
 * Run against dist/_headers after `vite build --mode <mode>` (deploy-exchange.yml
 * and the `exchange:verify-headers` Nx target), so what is checked is exactly
 * what Cloudflare serves. Exit 0 = policy holds; exit 1 = problems printed as
 * GitHub `::error::` annotations.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Cloudflare Pages rejects `_headers` lines longer than this. */
const MAX_LINE = 2000;

/** The .env file each network's deploy build reads (`vite build --mode <mode>`). */
const ENV_FILE = {
  mainnet: '.env.production',
  stagenet: '.env.staging',
  testnet: '.env.testnet',
};

export function parseHeadersFile(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { headers: [], pattern: line.trim() };
      rules.push(current);
      continue;
    }
    if (!current) throw new Error(`header line before any URL pattern: ${line}`);
    const entry = line.trim();
    if (entry.startsWith('! ')) {
      current.headers.push({ name: entry.slice(2).trim().toLowerCase(), value: null });
      continue;
    }
    const colon = entry.indexOf(':');
    if (colon <= 0) throw new Error(`malformed header line: ${line}`);
    current.headers.push({
      name: entry.slice(0, colon).trim().toLowerCase(),
      value: entry.slice(colon + 1).trim(),
    });
  }
  return rules;
}

/**
 * Headers from every rule with exactly this pattern, merged the way Cloudflare
 * merges them: a repeated header is comma-joined, `! Name` detaches it.
 */
export function headersForPattern(rules, pattern) {
  const merged = new Map();
  for (const rule of rules) {
    if (rule.pattern !== pattern) continue;
    for (const { name, value } of rule.headers) {
      if (value === null) {
        merged.delete(name);
      } else {
        merged.set(name, merged.has(name) ? `${merged.get(name)}, ${value}` : value);
      }
    }
  }
  return merged;
}

/**
 * Adds `X-Robots-Tag: noindex, nofollow` to the `/*` rule, for non-mainnet builds.
 * It goes inside the existing rule rather than into a second `/*` rule, because
 * Cloudflare's local header engine (wrangler pages dev) drops the first rule's
 * headers when a pattern appears twice.
 */
export function withNoindexHeader(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === '/*');
  if (start === -1) throw new Error('_headers has no /* rule to add X-Robots-Tag to');
  let end = start;
  while (end + 1 < lines.length && /^\s+\S/.test(lines[end + 1])) end += 1;
  lines.splice(end + 1, 0, '  X-Robots-Tag: noindex, nofollow');
  return lines.join('\n');
}

export function parseCsp(value) {
  const directives = new Map();
  for (const part of value.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) directives.set(tokens[0].toLowerCase(), tokens.slice(1));
  }
  return directives;
}

/** Whether a CSP host-source (`scheme://host` or `scheme://*.host`) allows `url`. */
export function sourceAllows(source, url) {
  const match = /^([a-z][a-z0-9+.-]*):\/\/(\*\.)?([^/:*]+)$/.exec(source);
  if (!match) return false;
  const [, scheme, wildcard, host] = match;
  const target = new URL(url);
  if (target.protocol !== `${scheme}:`) return false;
  return wildcard ? target.hostname.endsWith(`.${host}`) : target.hostname === host;
}

/** Sources that allow every host for a scheme (or everything); never acceptable here. */
const BROAD_SOURCES = new Set(['*', 'http:', 'https:', 'ws:', 'wss:']);
/** Directives that must list hosts explicitly. */
const HOST_LIST_DIRECTIVES = ['connect-src', 'frame-src', 'script-src'];
const GA_LOADER_ORIGIN = 'https://www.googletagmanager.com';

/** Broad scheme/wildcard sources, and the analytics loader when analytics is enabled. */
function checkSourceBreadth(directives, analyticsEnabled) {
  const problems = [];
  for (const name of HOST_LIST_DIRECTIVES) {
    for (const source of directives.get(name) ?? []) {
      if (BROAD_SOURCES.has(source.toLowerCase())) {
        problems.push(`CSP ${name} must not contain the bare source ${source}`);
      }
    }
  }
  const scriptSrc = directives.get('script-src') ?? [];
  if (analyticsEnabled && !scriptSrc.some((source) => sourceAllows(source, GA_LOADER_ORIGIN))) {
    problems.push(
      `VITE_GA_MEASUREMENT_ID is set but CSP script-src does not allow ${GA_LOADER_ORIGIN}`,
    );
  }
  return problems;
}

export function checkHeaders(
  text,
  { network, requiredOrigins = [], bundleOrigins = [], analyticsEnabled = false },
) {
  const problems = [];
  text.split('\n').forEach((line, index) => {
    if (line.length > MAX_LINE) {
      problems.push(`line ${index + 1} is ${line.length} chars (Cloudflare limit ${MAX_LINE})`);
    }
  });

  const root = headersForPattern(parseHeadersFile(text), '/*');
  const csp = root.get('content-security-policy');
  if (!csp) {
    problems.push('/* has no Content-Security-Policy');
  } else {
    const directives = parseCsp(csp);
    const expectExactly = (name, expected) => {
      const actual = (directives.get(name) ?? []).join(' ');
      if (actual !== expected) problems.push(`CSP ${name} is "${actual}", expected "${expected}"`);
    };
    expectExactly('frame-ancestors', "'none'");
    expectExactly('object-src', "'none'");
    expectExactly('base-uri', "'self'");
    if ((directives.get('script-src') ?? []).includes("'unsafe-inline'")) {
      problems.push("CSP script-src must not allow 'unsafe-inline'");
    }
    problems.push(...checkSourceBreadth(directives, analyticsEnabled));
    const connect = directives.get('connect-src') ?? [];
    for (const origin of requiredOrigins) {
      if (!connect.some((source) => sourceAllows(source, origin))) {
        problems.push(`CSP connect-src does not allow ${origin}`);
      }
    }
    problems.push(...checkBundleOrigins(text, bundleOrigins));
  }

  const maxAge = Number(
    /max-age=(\d+)/.exec(root.get('strict-transport-security') ?? '')?.[1] ?? 0,
  );
  if (maxAge < 31_536_000) problems.push(`HSTS max-age ${maxAge} is below one year`);
  if (root.get('x-frame-options') !== 'DENY') problems.push('/* X-Frame-Options must be DENY');
  if (root.get('x-content-type-options') !== 'nosniff') {
    problems.push('/* X-Content-Type-Options must be nosniff');
  }
  if (root.has('cache-control')) {
    problems.push(
      '/* must not set Cache-Control: Cloudflare merges it into /assets/* and breaks immutable caching',
    );
  }

  const robots = root.get('x-robots-tag') ?? '';
  if (network === 'mainnet' && robots.includes('noindex')) {
    problems.push('mainnet build must stay indexable');
  }
  if (network !== 'mainnet' && !robots.includes('noindex')) {
    problems.push(`${network} build must send X-Robots-Tag: noindex`);
  }
  return problems;
}

/**
 * Origins that appear in the built bundle but are never fetched or framed by
 * the exchange, so the CSP rightly does not list them. Each entry says why;
 * anything else the bundle references must be in connect-src or frame-src.
 *
 * An entry here only exempts the origin from this check: the CSP still blocks
 * it in the browser. Any new fetch, frame or script load from a listed origin
 * needs a CSP change (and the entry removed), or it fails at runtime.
 */
export const NON_FETCH_ORIGINS = new Map([
  ['http://www.w3.org', 'XML/SVG namespace URIs'],
  ['https://decentralchain.io', 'outbound links (privacy policy, terms, support)'],
  ['https://decentralscan.com', 'explorer links; the exchange never calls the explorer'],
  ['https://testnet.decentralscan.com', 'explorer links; the exchange never calls the explorer'],
  ['https://stagenet.decentralscan.com', 'explorer links; the exchange never calls the explorer'],
  ['https://github.com', 'outbound links'],
  ['https://solflare.com', 'wallet install links'],
  ['https://phantom.app', 'wallet install links'],
  ['https://solanamobile.com', 'wallet install links'],
  ['https://chrome.google.com', 'extension store links'],
  ['https://support.ledger.com', 'help links'],
  ['https://react.dev', 'documentation links in library error messages'],
  ['https://reactrouter.com', 'documentation links in library error messages'],
  ['https://react.i18next.com', 'documentation links in library error messages'],
  ['https://mui.com', 'documentation links in library error messages'],
  [
    'https://fonts.googleapis.com',
    'Solana mobile-wallet modal markup; the fonts are blocked and it falls back to system fonts',
  ],
  [
    'https://fonts.gstatic.com',
    'Solana mobile-wallet modal markup; the fonts are blocked and it falls back to system fonts',
  ],
  [
    // react-ga4 is statically bundled and carries its loader URL. checkHeaders
    // fails if a deploy sets VITE_GA_MEASUREMENT_ID without allowing it in script-src.
    'https://www.googletagmanager.com',
    'react-ga4 loader; used only when VITE_GA_MEASUREMENT_ID is set, which no deploy sets',
  ],
  [
    'https://api.devnet.solana.com',
    '@solana/web3.js cluster defaults; the app uses VITE_SOLANA_RPC_URL',
  ],
  [
    'https://api.testnet.solana.com',
    '@solana/web3.js cluster defaults; the app uses VITE_SOLANA_RPC_URL',
  ],
  [
    'http://api.devnet.solana.com',
    '@solana/web3.js cluster defaults; the app uses VITE_SOLANA_RPC_URL',
  ],
  [
    'http://api.testnet.solana.com',
    '@solana/web3.js cluster defaults; the app uses VITE_SOLANA_RPC_URL',
  ],
  [
    'http://api.mainnet-beta.solana.com',
    '@solana/web3.js cluster defaults; the app uses VITE_SOLANA_RPC_URL',
  ],
  // URL-parsing base: react-router resolves paths against it. The Solana mobile
  // wallet adapter also probes it; the CSP blocks that and the adapter ignores the error.
  ['http://localhost', 'URL-parsing base in react-router'],
  // rpc-websockets constructor default; @solana/web3.js always passes its own endpoint.
  ['ws://localhost:8080', 'rpc-websockets default argument, never used'],
]);

/** Absolute http(s)/ws(s) origins referenced by the built js, html and css (source maps excluded). */
export function scanBundleOrigins(distDir) {
  const origins = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|mjs|html|css)$/.test(entry.name))
        collectOrigins(readFileSync(full, 'utf8'), origins);
    }
  };
  walk(distDir);
  return [...origins].sort();
}

function collectOrigins(text, origins) {
  for (const [candidate] of text.matchAll(/(?:https?|wss?):\/\/[^\s"'`\\)<>,;]+/g)) {
    let url;
    try {
      url = new URL(candidate);
    } catch {
      continue;
    }
    // Template placeholders and bare words are not origins.
    if (!/^[a-z0-9.-]+$/.test(url.hostname) || !/^(localhost|.+\..+)$/.test(url.hostname)) continue;
    origins.add(`${url.protocol}//${url.host}`);
  }
}

/** Problems for bundle origins the root CSP blocks and that are not documented non-fetch references. */
export function checkBundleOrigins(headersText, origins) {
  const csp = headersForPattern(parseHeadersFile(headersText), '/*').get('content-security-policy');
  if (!csp || origins.length === 0) return [];
  const directives = parseCsp(csp);
  const sources = [
    ...(directives.get('connect-src') ?? []),
    ...(directives.get('frame-src') ?? []),
  ];
  return origins
    .filter((origin) => !NON_FETCH_ORIGINS.has(origin))
    .filter((origin) => !sources.some((source) => sourceAllows(source, origin)))
    .map((origin) => `bundle references ${origin}, which is not in CSP connect-src or frame-src`);
}

/** Networks a deploy build may target. */
const NETWORKS = ['mainnet', 'stagenet', 'testnet'];

/**
 * The network a Vite build targets, from its resolved env. A production build
 * must set VITE_NETWORK explicitly: silently defaulting to mainnet would ship a
 * test network without its noindex header. Other builds default to mainnet.
 */
export function resolveBuildNetwork(env, isProduction) {
  const network = env.VITE_NETWORK;
  if (!network) {
    if (isProduction) {
      throw new Error(
        'VITE_NETWORK is not set for this production build; build with --mode <mainnet|stagenet|testnet env> or set it explicitly',
      );
    }
    return 'mainnet';
  }
  if (!NETWORKS.includes(network)) {
    throw new Error(`VITE_NETWORK "${network}" is not one of ${NETWORKS.join(', ')}`);
  }
  return network;
}

/** Whether the network's deploy env enables Google Analytics. */
export function analyticsEnabledFor(network) {
  const envText = readFileSync(path.join(APP_ROOT, ENV_FILE[network]), 'utf8');
  return /^VITE_GA_MEASUREMENT_ID=\S+/m.test(envText);
}

/** Every service origin the network's build talks to: node, matcher, data service, websocket. */
export function requiredOriginsFor(network) {
  const config = JSON.parse(
    readFileSync(path.join(APP_ROOT, 'src/configs', `${network}.json`), 'utf8'),
  );
  const urls = [config.node, config.matcher, config.api];
  const envText = readFileSync(path.join(APP_ROOT, ENV_FILE[network]), 'utf8');
  const ws = /^VITE_WS_URL=(\S+)$/m.exec(envText)?.[1];
  if (ws) urls.push(ws);
  return urls;
}

function main([file, network]) {
  if (!file || !(network in ENV_FILE)) {
    console.error(
      'usage: node scripts/verifyHeaders.js <path/to/_headers> <mainnet|stagenet|testnet>',
    );
    return 2;
  }
  const problems = checkHeaders(readFileSync(file, 'utf8'), {
    analyticsEnabled: analyticsEnabledFor(network),
    bundleOrigins: scanBundleOrigins(path.dirname(path.resolve(file))),
    network,
    requiredOrigins: requiredOriginsFor(network),
  });
  for (const problem of problems) console.error(`::error::${problem}`);
  if (problems.length > 0) return 1;
  // biome-ignore lint/suspicious/noConsole: this is a CLI; stdout is its output
  console.log(`${file}: security headers OK for ${network}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
