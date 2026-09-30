// .size-limit.mjs — separate from package.json so modifyRolldownConfig (a function)
// can bundle for the node platform.
//
// Keep in sync with the 'size-limit' entries in package.json devDependencies.
export default [
  {
    ignore: [
      '@decentralchain/ride-lang',
      '@decentralchain/ride-repl',
      '@decentralchain/ts-lib-crypto',
    ],
    limit: '10 kB',
    modifyRolldownConfig(config) {
      return { ...config, platform: 'node' };
    },
    path: './dist/index.mjs',
  },
];
