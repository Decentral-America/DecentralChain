// .size-limit.mjs
//
// Keep in sync with the 'size-limit' entries in package.json devDependencies.
export default [
  {
    // Bumped from 55kB: adding secp256k1 (ethereumKeyPair/ethereumSign) to
    // ts-lib-crypto's single bundled crypto() object grows every consumer's
    // bundle a little, whether or not that consumer calls the new functions
    // -- signer doesn't, but still carries the weight. Same tradeoff as when
    // BLS support was added. 56kB leaves ~0.7kB of headroom over the actual
    // 55.3kB measured size, not a blank check for unrelated growth.
    limit: '56 kB',
    path: './dist/index.mjs',
  },
];
