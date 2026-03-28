export const NetworkName = {
  Custom: 'custom',
  Mainnet: 'mainnet',
  Stagenet: 'stagenet',
  Testnet: 'testnet',
} as const;
export type NetworkName = (typeof NetworkName)[keyof typeof NetworkName];
