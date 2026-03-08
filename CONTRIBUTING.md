# Contributing to @decentralchain/ts-types

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Decentral-America/ts-types.git
cd ts-types

# Install dependencies
npm install

# Run the full quality pipeline
npm run bulletproof
```

## Project Structure

```
src/
  constants.ts      — Runtime const values (TRANSACTION_TYPE, DATA_FIELD_TYPE)
  parts.ts          — Primitive types, exchange order types, state changes
  transactions.ts   — All 18 transaction type definitions + node representations
  index.ts          — Barrel re-export
test/
  constants.test.ts — Tests for runtime values and type correctness
```

## Quality Standards

This is a financial-grade library. Every change must pass:

1. **Format** — `npm run format` (Biome)
2. **Lint** — `npm run lint:fix` (Biome)
3. **Typecheck** — `npm run typecheck` (TypeScript strict mode)
4. **Test** — `npm run test` (Vitest, 90% coverage thresholds)
5. **Validate** — `npm run validate` (publint + attw + size-limit)

The pre-commit hook runs `lefthook` + `typecheck` automatically.

## Commit Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm run bulletproof` passes
4. Ensure `npm run validate` passes
5. Open a pull request with a clear description

## Adding a New Transaction Type

1. Add the type constant in `src/constants.ts`
2. Add the entry to `TRANSACTION_TYPE`
3. Define field types and versioned types in `src/transactions.ts`
4. Add the type to the `Transaction` union and `TransactionMap`
5. Add a `FromNode` variant if applicable
6. Add tests for the new constant value
7. Update the README

## Code Style

- Use `type` (not `interface`) for all type aliases — consistency with existing code
- Use `import type` for type-only imports
- Prefix unused generic parameters with `_` (e.g., `_LONG`)
- All public types must be exported from `src/index.ts`
