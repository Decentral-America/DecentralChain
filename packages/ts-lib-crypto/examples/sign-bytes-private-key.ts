import { privateKey, signBytes } from '@decentralchain/ts-lib-crypto';

// biome-ignore lint/security/noSecrets: example byte string used in docs — not a real credential
const bytes = 'Fk1sjwdPSwZ4bPwvpCGPH6';
const seed =
  'uncle push human bus echo drastic garden joke sand warfare sentence fossil title color combine';
const key = privateKey(seed);

signBytes({ privateKey: key }, bytes);
