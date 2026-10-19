import { isMainnet, publicBaseUrl } from '@/lib/site';

export function buildRobots(base: string | undefined): string {
  const sitemap = base ? `\nSitemap: ${base}/sitemap.xml\n` : '';
  return `User-agent: *\nAllow: /\n${sitemap}`;
}

export function loader(): Response {
  return new Response(buildRobots(publicBaseUrl()), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'text/plain; charset=utf-8',
      ...(isMainnet() ? {} : { 'X-Robots-Tag': 'noindex, nofollow' }),
    },
  });
}
