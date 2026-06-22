import { type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

export interface SentryIssue {
  id: string;
  title: string;
  project: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const authToken = process.env.SENTRY_AUTH_TOKEN;
  if (!authToken) {
    return Response.json(
      { error: 'SENTRY_AUTH_TOKEN is not configured on this server.' },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      'https://sentry.io/api/0/organizations/decentralchain-p1/issues/?limit=10&query=is:unresolved',
      {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      throw new Error(`Sentry API HTTP ${res.status}`);
    }

    const data = (await res.json()) as Array<{
      id: string;
      title: string;
      project: { slug: string };
      count: string;
      firstSeen: string;
      lastSeen: string;
    }>;

    const issues: SentryIssue[] = data.map((issue) => ({
      count: Number(issue.count),
      firstSeen: issue.firstSeen,
      id: issue.id,
      lastSeen: issue.lastSeen,
      project: issue.project.slug,
      title: issue.title,
    }));

    return Response.json({ issues });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.warn({ err }, 'Sentry API fetch failed');
    return Response.json({ error: message }, { status: 503 });
  }
}
