import { describe, expect, it } from 'vitest';
import { buildRobots } from './robots.txt';
import { buildSitemap } from './sitemap.xml';

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
});
