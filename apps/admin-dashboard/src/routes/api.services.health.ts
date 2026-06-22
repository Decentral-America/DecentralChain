import { type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ServiceStatus {
  name: string;
  url: string;
  category: 'newark' | 'lke';
  status: 'up' | 'down' | 'degraded';
  httpCode?: number;
  latencyMs?: number;
  detail?: string;
  checkedAt: string;
}

// ── Service definitions ───────────────────────────────────────────────────────
// For each service, we define which URL to probe and what HTTP codes mean "up".
// WebSocket-only services return 404 on plain HTTP — that still means the process
// is listening, so we treat any response as "up".

interface ServiceDef {
  name: string;
  url: string;
  category: 'newark' | 'lke';
  // Status codes that are considered "up". Default: [200].
  upCodes?: number[];
  // If true, any HTTP response (including 4xx) means the port is open → "up"
  anyResponseIsUp?: boolean;
}

function buildServices(): ServiceDef[] {
  const nodeUrl = process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io';

  return [
    {
      category: 'newark',
      name: 'DCC Node',
      upCodes: [200],
      url: `${nodeUrl}/node/version`,
    },
    {
      category: 'newark',
      name: 'Data Service',
      upCodes: [200],
      url: 'https://testnet-data-service.decentralchain.io/health',
    },
    {
      category: 'newark',
      name: 'Matcher',
      upCodes: [200],
      url: 'https://testnet-matcher.decentralchain.io/matcher',
    },
    {
      category: 'newark',
      name: 'Scanner',
      upCodes: [200, 304],
      url: 'https://testnet.decentralscan.com',
    },
    {
      anyResponseIsUp: true,
      category: 'newark',
      name: 'WebSocket API',
      // WebSocket-only — any response means the process is listening.
      url: 'https://testnet-ws.decentralchain.io',
    },
    {
      category: 'newark',
      name: 'Admin Dashboard',
      upCodes: [200],
      url: 'https://testnet-admin.decentralchain.io/healthz',
    },
  ];
}

async function probe(service: ServiceDef): Promise<ServiceStatus> {
  const start = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const res = await fetch(service.url, {
      headers: { Accept: 'application/json, text/plain, */*' },
      method: 'GET',
      // HEAD would be faster but some services don't support it
      signal: AbortSignal.timeout(8_000),
    });

    const latencyMs = Math.round(performance.now() - start);
    const upCodes = service.upCodes ?? [200];
    const isUp = service.anyResponseIsUp ? true : upCodes.includes(res.status);

    return {
      category: service.category,
      checkedAt,
      httpCode: res.status,
      latencyMs,
      name: service.name,
      status: isUp ? (latencyMs > 3_000 ? 'degraded' : 'up') : 'down',
      url: service.url,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const detail =
      err instanceof Error
        ? err.name === 'TimeoutError'
          ? 'timeout after 8s'
          : err.message
        : 'unknown error';

    logger.warn({ detail, service: service.name }, 'Service health probe failed');

    return {
      category: service.category,
      checkedAt,
      detail,
      latencyMs,
      name: service.name,
      status: 'down',
      url: service.url,
    };
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const services = buildServices();
  const results = await Promise.all(services.map(probe));

  const upCount = results.filter((s) => s.status === 'up').length;
  const downCount = results.filter((s) => s.status === 'down').length;

  return Response.json({
    services: results,
    summary: {
      degraded: results.filter((s) => s.status === 'degraded').length,
      down: downCount,
      total: results.length,
      up: upCount,
    },
  });
}
