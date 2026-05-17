// .size-limit.mjs — separate from package.json so modifyEsbuildConfig (a function)
// can override the tsconfig-auto-discovered "ES2025" esbuild target, which
// esbuild 0.27.x does not recognise.  es2024 is the latest esbuild supports.
//
// Keep in sync with the 'size-limit' entries in package.json devDependencies.
export default [
  {
    import: '{ ProviderCubensis }',
    limit: '15 kB',
    modifyEsbuildConfig(config) {
      // biome-ignore lint/security/noSecrets: tsconfigRaw is not a secret
      return { ...config, tsconfigRaw: '{"compilerOptions":{"target":"ES2024"}}' };
    },
    path: './dist/index.mjs',
  },
];
