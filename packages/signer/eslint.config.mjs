import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'test/index.spec.ts',
            'test/utils.ts',
            'test/TestProvider.ts',
            'test/test-env.ts',
            'test/transactions/leasing.spec.ts',
            'test/transactions/data.spec.ts',
            'test/transactions/scripts.spec.ts',
            'test/transactions/transfers.spec.ts',
            'test/transactions/alias.spec.ts',
            'test/transactions/tokens.spec.ts',
            'test/transactions/sponsorship.spec.ts',
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 15,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-bitwise': 'error',
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '*.config.*', '*.js', '*.cjs', '*.mjs'],
  },
);
