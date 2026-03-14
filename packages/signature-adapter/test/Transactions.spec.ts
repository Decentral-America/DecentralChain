import { Money } from '@decentralchain/data-entities';
import { SeedAdapter } from '../src/adapters';
import { DCCAsset } from './assets';

const testSeed = 'some test seed words without money on mainnet';

describe('Test invoke', () => {
  const tx = {
    data: {
      call: {
        args: [
          { type: 'list', value: [{ type: 'string', value: 'data' }] },
          {
            type: 'string',
            value: '6cPwB9AzRg3D3uTSVSfn1Pvhb5Y5Amxpv7akaCUWRbrv2REP1',
          },
          {
            type: 'string',
            value: '36',
          },
        ],
        function: 'bet',
      },
      dApp: '3PNHLhiVUeZts17hzNfoM7MPJ8mcFGiBEMs',
      fee: Money.fromCoins(500000, DCCAsset),
      feeAssetId: null,
      payment: [Money.fromCoins('1400500000', DCCAsset)],
      senderPublicKey: 'DgJkVZnf5EDPGzftGDbXZ4SKJQ7s7KRJeh7QmQMhYCPh',
      timestamp: 1559291920421,
      type: 16,
      version: 1,
    },
    name: 'script invocation',
    network: 'W',
  };
  it('Args List', () => {
    const adapter = new SeedAdapter(testSeed, tx.network);
    const signable = adapter.makeSignable({
      data: { ...tx.data } as any,
      type: tx.data.type,
    } as any);

    return signable.getSignature().then((signature) => {
      expect(typeof signature).toEqual('string');
    });
  });
});
