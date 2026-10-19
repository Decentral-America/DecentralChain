import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRobots, loader as robotsLoader } from './robots.txt';
import { buildSitemap, loader as sitemapLoader } from './sitemap.xml';

describe('robots.txt and sitemap.xml', () => {
  it('robots names the sitemap with an absolute URL and credits no third party', () => {
    const robots = buildRobots('https://testnet.decentralscan.com');
    expect(robots).toContain('Sitemap: https://testnet.decentralscan.com/sitemap.xml');
    expect(robots).not.toContain('github.com');
  });

  it('sitemap lists absolute URLs on the given host', () => {
    const xml = buildSitemap('https://testnet.decentralscan.com', '2026-10-18');
    expect(xml).toContain('<loc>https://testnet.decentralscan.com/blocks</loc>');
    expect(xml).not.toContain('scanner.decentralchain.io');
  });

  it('emits no URLs when the public origin is unknown', () => {
    expect(buildSitemap(undefined, '2026-10-18')).not.toContain('<loc>');
    expect(buildRobots(undefined)).not.toContain('Sitemap:');
  });
});

describe('noindex on non-mainnet', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('sitemap and robots send X-Robots-Tag off mainnet', () => {
    vi.stubEnv('DCC_CHAIN_ID', '33');
    expect(sitemapLoader().headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(robotsLoader().headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('sitemap sends X-Robots-Tag on a malformed chain id', () => {
    vi.stubEnv('DCC_CHAIN_ID', 'abc');
    expect(sitemapLoader().headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('mainnet sitemap is indexable', () => {
    vi.stubEnv('DCC_CHAIN_ID', '63');
    expect(sitemapLoader().headers.get('X-Robots-Tag')).toBeNull();
  });
});
