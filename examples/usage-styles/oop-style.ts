import { crypto, randomSeed } from '@decentralchain/ts-lib-crypto';

const seed = randomSeed();

const c = crypto({ seed, output: 'Bytes' });

c.address(); // => UInt8Array

c.publicKey();

c.privateKey();

c.keyPair();
