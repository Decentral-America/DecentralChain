export const AdapterType = {
  CubensisConnect: 'cubensisConnect',
  Custom: 'custom',
  Ledger: 'ledger',
  PrivateKey: 'privateKey',
  Seed: 'seed',
} as const;
export type AdapterType = (typeof AdapterType)[keyof typeof AdapterType];
