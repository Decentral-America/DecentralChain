// .size-limit.mjs
//
// Keep in sync with the 'size-limit' entries in package.json devDependencies.
export default [
  {
    import: '{ toNode, convert }',
    limit: '10 kB',
    path: './dist/index.mjs',
  },
];
