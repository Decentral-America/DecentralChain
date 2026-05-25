import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: true,
  entry: ['src/index.ts', 'src/grpc.ts'],
  fixedExtension: true,
  format: ['esm'],
  platform: 'neutral',
  sourcemap: true,
});
