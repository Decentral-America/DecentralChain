import stringify from '../../src/tools/stringify';

it('check stringify', () => {
  const result = stringify({
    amount: '500',
    assetId: 'ELTrBUCbkwXXAZjypHitRwohFVHfMNa5jmYrznnU3YBa',
    attachment: '3MyAGEBuZGDKZDzYn6sbh2noqk9uYHy4kjw',
    chainId: 68,
    fee: '100000',
    feeAssetId: null,
    id: 'Az2jMukkyE1dEe3UW9ubVk53Ch15hoEXQ9VmSPJ3RdLv',
    proofs: [
      '5HmSbFKsmdtJtuXKHxAeRGMcKM7htNgH943k9pqQngLiB1hR4o1yTVtbH2ihCuP46yP9PbbWx5mZdcEbgnvCS6V8',
    ],
    recipient: '3FcPVZXCKWDryHFiCh3ExrHeebBDk18oKwv',
    senderPublicKey: 'EZdYn2ScK4sdHiiQ58A21PjiPHwEvXz4TnUqj4z8czKJ',
    timestamp: 1576573294279,
    type: 4,
    version: 3,
  });
  expect(result).toBe(
    JSON.stringify({
      amount: 500,
      assetId: 'ELTrBUCbkwXXAZjypHitRwohFVHfMNa5jmYrznnU3YBa',
      attachment: '3MyAGEBuZGDKZDzYn6sbh2noqk9uYHy4kjw',
      chainId: 68,
      fee: 100000,
      feeAssetId: null,
      id: 'Az2jMukkyE1dEe3UW9ubVk53Ch15hoEXQ9VmSPJ3RdLv',
      proofs: [
        '5HmSbFKsmdtJtuXKHxAeRGMcKM7htNgH943k9pqQngLiB1hR4o1yTVtbH2ihCuP46yP9PbbWx5mZdcEbgnvCS6V8',
      ],
      recipient: '3FcPVZXCKWDryHFiCh3ExrHeebBDk18oKwv',
      senderPublicKey: 'EZdYn2ScK4sdHiiQ58A21PjiPHwEvXz4TnUqj4z8czKJ',
      timestamp: 1576573294279,
      type: 4,
      version: 3,
    }),
  );
});

it('Check stringify with data entry object', () => {
  expect(
    stringify([
      { type: 'string', value: '123' },
      { type: 'integer', value: '123' },
      { type: 'integer', value: -123 },
      { type: 'integer', value: '-123' },
    ]),
  ).toBe(
    JSON.stringify([
      { type: 'string', value: '123' },
      { type: 'integer', value: 123 },
      { type: 'integer', value: -123 },
      { type: 'integer', value: -123 },
    ]),
  );
});
