/**
 * Geo proxy — GET /api/geo/:ip/json
 *
 * Server-side proxy to ipinfo.io. Keeps the lookup off the browser so:
 *  - No CORS issues (browser never talks to ipinfo.io directly)
 *  - Rate-limit budget is centralised (one token, one counter)
 *  - In-memory cache avoids redundant lookups for the same IP
 *
 * Optional env var:
 *   IPINFO_TOKEN   ipinfo.io API token (raises free limit from 50k to paid tier)
 */

// ── Simple in-memory TTL cache ─────────────────────────────────────────────
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached(ip: string): unknown | null {
  const entry = cache.get(ip);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(ip);
    return null;
  }
  return entry.data;
}

function setCached(ip: string, data: unknown): void {
  cache.set(ip, { data, expiresAt: Date.now() + TTL_MS });
}

// ── Basic IP validation (IPv4 + IPv6) to prevent SSRF ────────────────────
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]{2,39}$/;

function isValidPublicIp(ip: string): boolean {
  if (!IPV4_RE.test(ip) && !IPV6_RE.test(ip)) return false;
  // Block private/loopback ranges
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|::1|fc|fd)/.test(ip)) return false;
  return true;
}

export async function loader({ params }: { params: { ip?: string } }): Promise<Response> {
  const ip = params.ip ?? '';

  if (!isValidPublicIp(ip)) {
    return Response.json({ error: 'Invalid IP' }, { status: 400 });
  }

  const cached = getCached(ip);
  if (cached) {
    return Response.json(cached);
  }

  const token = process.env.IPINFO_TOKEN;
  const url = token
    ? `https://ipinfo.io/${ip}/json?token=${token}`
    : `https://ipinfo.io/${ip}/json`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (upstream.status === 429) {
      return Response.json({ error: 'Rate limited' }, { status: 429 });
    }
    if (!upstream.ok) {
      return Response.json({ error: `Upstream error ${upstream.status}` }, { status: 502 });
    }

    const data = await upstream.json();
    setCached(ip, data);
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Geo lookup failed' }, { status: 502 });
  }
}
