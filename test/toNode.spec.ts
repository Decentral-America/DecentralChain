import { describe, expect, it } from 'vitest';
import { toNode } from '../src/toNodeEntities/index.js';
import { TEST_DATA } from './transactionData.js';

describe('From DecentralChain entity to node', () => {
  TEST_DATA.forEach((item, i) => {
    it(`Test ${String(i)}. Test transaction with type ${String(item.node.type)} by function`, () => {
      expect(toNode(item.gui)).toEqual(item.node);
    });

    it(`Test ${String(i)}. Test transaction without timestamp`, () => {
      const data = { ...item.gui };
      delete (data as Record<string, unknown>).timestamp;

      const nodeData = toNode(data);
      expect(typeof nodeData.timestamp).toBe('number');
      expect(Date.now() - nodeData.timestamp < 1000).toBe(true);
    });
  });
});
