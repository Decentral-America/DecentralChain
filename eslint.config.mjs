import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────────
  { ignores: ['dist', 'coverage', 'node_modules', '*.config.*', '*.mjs'] },

  // ── Base JS recommended ─────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript strict + stylistic (type-aware) ──────────────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ── TypeScript file overrides ───────────────────────────────────────────
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['test/*.test.ts', '*.config.*'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ── Type safety ───────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // ── Style (adjusted for types-heavy package) ──────────────────
      // This package uses `type` aliases extensively for intersections,
      // unions, and mapped types — `interface` is not always possible.
      '@typescript-eslint/consistent-type-definitions': 'off',
      // The codebase uses `Array<T>` style consistently.
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],

      // ── Code quality ──────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Prettier last (disables formatting rules) ──────────────────────────
  prettierConfig,
);
