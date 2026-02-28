// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/browser.js',
    format: 'iife',
    name: 'OrderPairs',
    exports: 'named',
    sourcemap: true,
  },
  plugins: [json(), resolve({ preferBuiltins: false, browser: true }), commonjs(), terser()],
};
