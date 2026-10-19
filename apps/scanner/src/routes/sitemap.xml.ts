/**
 * DCC-158 — Sitemap XML resource route.
 *
 * Lists the explorer's primary routes on its own public origin (see
 * lib/site.ts). Parameterized pages (block, transaction, address, asset) are
 * discovered by crawling. robots.txt points here with an absolute URL.
 */
import { publicBaseUrl } from '@/lib/site';

/** Static routes always accessible without URL parameters. */
const STATIC_ROUTES = [
  { changefreq: 'always', path: '/', priority: '1.0' },
  { changefreq: 'always', path: '/blocks', priority: '0.9' },
  { changefreq: 'always', path: '/transaction', priority: '0.8' },
  { changefreq: 'weekly', path: '/address', priority: '0.7' },
  { changefreq: 'weekly', path: '/asset', priority: '0.7' },
  { changefreq: 'hourly', path: '/dexpairs', priority: '0.8' },
  { changefreq: 'always', path: '/network', priority: '0.7' },
];

export function buildSitemap(
  base: string,
  today: string = new Date().toISOString().split('T')[0] ?? '',
): string {
  const urls = STATIC_ROUTES.map(
    ({ path, changefreq, priority }) =>
      `  <url>\n    <loc>${base}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function loader(): Response {
  return new Response(buildSitemap(publicBaseUrl()), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
