import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pageMeta } from './page-meta';

const PAGES = [
  'Blocks',
  'BlockFeed',
  'DexPairs',
  'Network',
  'Stress/Stress',
  'UnconfirmedTransactions',
  'DistributionTool',
  'TransactionMap',
  'NetworkStatistics',
  'NetworkMap',
  'Peers',
  'Sustainability',
  'Node',
  'Home',
  'Faucet',
];

describe('page titles', () => {
  it('formats a route title', () => {
    expect(pageMeta('Blocks')).toEqual([{ title: 'Blocks — DecentralScan' }]);
  });

  it.each(PAGES)('pages/%s exports its own meta', (page) => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, '../pages', `${page}.tsx`),
      'utf8',
    );
    expect(source).toMatch(/export const meta = \(\) => pageMeta\('[^']+'\);/);
  });
});
