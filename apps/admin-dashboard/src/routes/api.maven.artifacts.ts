import { type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

export interface MavenArtifact {
  group: string;
  artifact: string;
  latestVersion: string;
  timestamp: number;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    // search.maven.org's legacy Solr index doesn't have this namespace synced
    // (confirmed live: numFound=0 there vs numFound=14 on repo1.maven.org's
    // actual file repo) -- a known gap between Sonatype Central Portal
    // publishing and the legacy search.maven.org mirror. central.sonatype.com
    // hosts its own up-to-date solrsearch mirror with the identical API shape.
    const res = await fetch(
      'https://central.sonatype.com/solrsearch/select?q=g:io.decentralchain&rows=20&wt=json',
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!res.ok) throw new Error(`Maven search HTTP ${res.status}`);

    const data = (await res.json()) as {
      response: {
        docs: Array<{ g: string; a: string; latestVersion: string; timestamp: number }>;
      };
    };

    const artifacts: MavenArtifact[] = data.response.docs.map((d) => ({
      artifact: d.a,
      group: d.g,
      latestVersion: d.latestVersion,
      timestamp: d.timestamp,
    }));

    return Response.json({ artifacts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.warn({ err }, 'Maven Central fetch failed');
    return Response.json({ error: message }, { status: 503 });
  }
}
