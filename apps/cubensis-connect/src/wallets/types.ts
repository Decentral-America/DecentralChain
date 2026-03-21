import { type NetworkName } from 'networks/types';

export type CreateWalletInput = { name: string } & (
  | { type: 'debug'; address: string }
  | { type: 'encodedSeed'; encodedSeed: string }
  | { type: 'ledger'; address: string; id: number; publicKey: string }
  | { type: 'privateKey'; privateKey: string }
  | { type: 'seed'; seed: string }
);

export type WalletAccount = {
  address: string;
  name: string;
  network: NetworkName;
  networkCode: string;
  publicKey: string;
} & (
  | { type: 'debug' }
  | { type: 'encodedSeed' }
  | { type: 'ledger'; id: number }
  | { type: 'privateKey' }
  | { type: 'seed' }
);

export type WalletPrivateData = {
  address: string;
  name: string;
  network: NetworkName;
  networkCode: string;
  publicKey: string;
} & (
  | { type: 'debug' }
  | { type: 'encodedSeed'; encodedSeed: string }
  | { type: 'ledger'; id: number }
  | { type: 'privateKey'; privateKey: string }
  | { type: 'seed'; seed: string }
);

export type WalletPrivateDataOfType<T extends WalletPrivateData['type']> = Extract<
  WalletPrivateData,
  { type: T }
>;
