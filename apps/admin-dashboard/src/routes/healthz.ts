import { type LoaderFunctionArgs } from 'react-router';
import { getSql } from '@/lib/db';

// Liveness + readiness probe — no auth required.
// Returns 200 "ok" when healthy, 503 with JSON detail when degraded.
// Docker healthcheck: `wget -qO- http://localhost:3001/healthz || exit 1`
export async function loader(_: LoaderFunctionArgs) {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Verify the admin database is reachable.
  try {
    const sql = getSql();
    await sql`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  if (healthy) {
    return new Response('ok', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 200,
    });
  }

  return Response.json({ checks, status: 'degraded' }, { status: 503 });
}
