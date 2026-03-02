import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.nyc_output/**',
      '*.config.js',
      '*.config.mjs',
      'provider/webpack.config.js',
      'test-app/webpack.config.js',
      'provider/test/ui.spec.ts',
      'provider/test/utils/hooks.ts',
      'provider/test/utils/actions.ts',
      'provider/test/utils/constants.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Minimum Required Rules (All Projects)
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

      // SDK library — pragmatic for interop
      '@typescript-eslint/no-explicit-any': 'warn',

      // Crypto / financial
      'no-bitwise': 'error',
      eqeqeq: 'error',

      // Browser lib
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
);
