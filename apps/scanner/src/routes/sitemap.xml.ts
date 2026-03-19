/**
 * DCC-158 — Sitemap XML resource route.
 *
 * Serves /sitemap.xml by returning a static XML document listing all
 * primary routes of the DecentralScan explorer.
 *
 * Dynamic routes (block detail, transaction, address, asset) are not
 * enumerated here — they are parameterized and not finite. Search engines
 * discover them through organic link crawling.
 *
 * robots.txt already declares: `Sitemap: /sitemap.xml`.
 */

const BASE_URL = 'https://scanner.decentralchain.io';

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

function buildSitemap(): string {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const urls = STATIC_ROUTES.map(
    ({ path, changefreq, priority }) =>
      `  <url>\n    <loc>${BASE_URL}${path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function loader(): Response {
  return new Response(buildSitemap(), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
