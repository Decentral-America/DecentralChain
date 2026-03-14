<p align="center">
  <img src="https://avatars.githubusercontent.com/u/121552972" width="80" alt="DecentralChain" />
</p>

<h3 align="center">DecentralChain SDK</h3>

<p align="center">
  Unified TypeScript monorepo for all <code>@decentralchain</code> packages
</p>

<p align="center">
  <a href="https://github.com/Decentral-America/decentralchain-sdk/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Decentral-America/decentralchain-sdk" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen" alt="Node >=24" />
  <img src="https://img.shields.io/badge/pnpm-10-orange" alt="pnpm 10" />
  <img src="https://img.shields.io/badge/Nx-22-blue" alt="Nx 22" />
</p>

---

## Packages

| Package | Description |
|---------|-------------|
| `@decentralchain/ts-types` | Core TypeScript type definitions |
| `@decentralchain/bignumber` | BigNumber utilities |
| `@decentralchain/ts-lib-crypto` | Cryptographic primitives |
| `@decentralchain/marshall` | Binary serialization |
| `@decentralchain/protobuf-serialization` | Protobuf serialization |
| `@decentralchain/crypto` | High-level crypto API |
| `@decentralchain/assets-pairs-order` | Asset pair ordering |
| `@decentralchain/oracle-data` | Oracle data utilities |
| `@decentralchain/browser-bus` | Cross-window messaging |
| `@decentralchain/cubensis-connect-types` | Wallet connection types |
| `@decentralchain/ledger` | Ledger hardware wallet |
| `@decentralchain/parse-json-bignumber` | JSON parsing with BigNumber |
| `@decentralchain/data-entities` | Data entity models |
| `@decentralchain/money-like-to-node` | Money conversion |
| `@decentralchain/node-api-js` | Node REST API client |
| `@decentralchain/ride-js` | RIDE smart contract compiler |
| `@decentralchain/swap-client` | Atomic swap client |
| `@decentralchain/data-service-client-js` | Data service client |
| `@decentralchain/transactions` | Transaction builders |
| `@decentralchain/signature-adapter` | Signature adapters |
| `@decentralchain/signer` | Transaction signing |
| `@decentralchain/cubensis-connect-provider` | Wallet provider |

## Apps

| App | Description |
|-----|-------------|
| `@decentralchain/exchange` | DEX trading interface |
| `@decentralchain/explorer` | Blockchain explorer |
| `@decentralchain/cubensis-connect` | Wallet extension |

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type check all packages
pnpm typecheck

# Lint all code
pnpm lint

# Visualize dependency graph
pnpm graph
```

### Working with Nx

```bash
# Build a single package
npx nx build @decentralchain/ts-types

# Run affected tests only
npx nx affected -t test

# Run tasks for a specific project
npx nx run @decentralchain/transactions:test
```

## License

[MIT](LICENSE) — Copyright (c) 2026-present DecentralChain
