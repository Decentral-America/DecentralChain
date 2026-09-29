// .size-limit.mjs
//
// Keep in sync with the 'size-limit' entries in package.json devDependencies.
export default [
  {
    import: '{ Asset, Money, OrderPrice }',
    limit: '11 kB',
    path: './dist/index.mjs',
  },
];
