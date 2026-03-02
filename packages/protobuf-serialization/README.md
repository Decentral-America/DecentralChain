# @decentralchain/protobuf-serialization

[![CI](https://github.com/Decentral-America/protobuf-serialization/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/protobuf-serialization/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/protobuf-serialization)](https://www.npmjs.com/package/@decentralchain/protobuf-serialization)
[![license](https://img.shields.io/npm/l/@decentralchain/protobuf-serialization)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/protobuf-serialization)](./package.json)

Protobuf schema definitions and generated bindings for the DecentralChain blockchain protocol.

This repository contains the canonical `.proto` schema files for DecentralChain blockchain transactions, blocks, events, and gRPC APIs. It provides pre-generated bindings for multiple languages: JavaScript/TypeScript (npm), Java (Maven), Rust (Cargo), and Python.

## Requirements

- **Node.js** >= 22 (for the npm package)
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/protobuf-serialization
```

## Quick Start

```javascript
import { waves } from "@decentralchain/protobuf-serialization";
import Long from "long";

// Encode an Amount message
const buffer = waves.Amount.encode({
  assetId: new Uint8Array([1, 2, 3, 4]),
  amount: Long.fromNumber(1_000_000),
}).finish();

// Decode it back
const decoded = waves.Amount.decode(buffer);
console.log(decoded.amount.toNumber()); // 1000000
```

> **Note**: The `waves` namespace is the **protocol-level identifier** inherited from the blockchain's protobuf schema. It defines the wire format and must remain unchanged for serialization compatibility.

## API Reference

The package exports a `waves` namespace containing all protobuf message types:

### Core Messages

| Message                   | Proto File                 | Description                      |
| ------------------------- | -------------------------- | -------------------------------- |
| `waves.Amount`            | `waves/amount.proto`       | Asset amount (asset_id + int64)  |
| `waves.Block`             | `waves/block.proto`        | Block with header + transactions |
| `waves.Transaction`       | `waves/transaction.proto`  | Transaction types                |
| `waves.SignedTransaction` | `waves/transaction.proto`  | Signed transaction wrapper       |
| `waves.Order`             | `waves/order.proto`        | Exchange order                   |
| `waves.Recipient`         | `waves/recipient.proto`    | Address or alias recipient       |
| `waves.RewardShare`       | `waves/reward_share.proto` | Block reward distribution        |

### Events

| Message                          | Proto File                                   |
| -------------------------------- | -------------------------------------------- |
| `waves.events.BlockchainUpdated` | `waves/events/events.proto`                  |
| `waves.events.grpc.*`            | `waves/events/grpc/blockchain_updates.proto` |

### Node gRPC APIs

| Service                           | Proto File                               |
| --------------------------------- | ---------------------------------------- |
| `waves.node.grpc.AccountsApi`     | `waves/node/grpc/accounts_api.proto`     |
| `waves.node.grpc.AssetsApi`       | `waves/node/grpc/assets_api.proto`       |
| `waves.node.grpc.BlockchainApi`   | `waves/node/grpc/blockchain_api.proto`   |
| `waves.node.grpc.BlocksApi`       | `waves/node/grpc/blocks_api.proto`       |
| `waves.node.grpc.TransactionsApi` | `waves/node/grpc/transactions_api.proto` |

Each message type provides:

- `.encode(message)` — encode a message to a `Writer`
- `.decode(reader)` — decode a message from a `Reader` or `Uint8Array`

> **Note**: `.create()`, `.verify()`, `.toObject()`, `.fromObject()`, and delimited encoding are excluded from the build to minimize bundle size.

### Using Raw Proto Files

Raw `.proto` files are available at `@decentralchain/protobuf-serialization/proto/*` for custom code generation with tools like `protoc`, `grpc-tools`, `pbjs`, or language-specific protobuf compilers.

## Multi-Language Support

### Java

Add dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.decentralchain</groupId>
    <artifactId>protobuf-schemas</artifactId>
    <version>{version}</version>
</dependency>
```

### ScalaPB

1. Add dependency to your `build.sbt`:

```scala
libraryDependencies += "io.decentralchain" % "protobuf-schemas" % "{version}" % "protobuf-src" intransitive()
```

2. Configure ScalaPB to compile external schemas with:

```scala
inConfig(Compile)(Seq(
   PB.protoSources in Compile := Seq(PB.externalIncludePath.value),
   includeFilter in PB.generate := new SimpleFileFilter(
     (f: File) => f.getName.endsWith(".proto") && f.getParent.endsWith("waves")
   ),
   PB.targets += scalapb.gen(flatPackage = true) -> sourceManaged.value
))
```

See [ScalaPB docs](https://scalapb.github.io/docs/third-party-protos) for more info.

### Rust

Add dependency to your `Cargo.toml`:

```toml
[dependencies]
decentralchain-protobuf-schemas = { git = "https://github.com/Decentral-America/protobuf-serialization" }
```

### Python

Generating Python sources requires Python 3. From the repository root:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install grpcio grpcio-tools
python -m grpc_tools.protoc \
  --proto_path=./proto \
  --python_out=. \
  --grpc_python_out=. \
  $(find ./proto -type f -name "*.proto")
```

## Local Source Generation

### Java

Use `mvn package` to create JAR artifacts:

1. `protobuf-schemas-{version}-protobuf-src.jar` — raw `.proto` files
2. `protobuf-schemas-{version}.jar` — protoc-generated Java classes

### JavaScript/TypeScript

```bash
npm run build
```

This runs `pbjs` to generate ES module JavaScript from the proto schemas, then `pbts` to generate TypeScript declarations.

## Development

### Prerequisites

- **Node.js** >= 22 (24 recommended — see `.nvmrc`)
- **npm** >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/protobuf-serialization.git
cd protobuf-serialization
npm install
```

### Scripts

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run build`         | Generate JS + types from proto files         |
| `npm test`              | Run tests with Vitest                        |
| `npm run test:watch`    | Tests in watch mode                          |
| `npm run test:coverage` | Tests with V8 coverage                       |
| `npm run typecheck`     | TypeScript type checking                     |
| `npm run lint`          | ESLint                                       |
| `npm run lint:fix`      | ESLint with auto-fix                         |
| `npm run format`        | Format with Prettier                         |
| `npm run format:check`  | Check formatting without modifying           |
| `npm run validate`      | Full CI validation pipeline                  |
| `npm run bulletproof`   | Format + lint fix + build + typecheck + test |
| `npm run check:publint` | Validate package structure                   |
| `npm run check:exports` | Validate type exports                        |
| `npm run check:size`    | Check bundle size budget                     |

### Quality Gates

All of the following must pass before release:

```bash
npm run format:check    # No formatting issues
npm run lint            # No lint errors
npm run build           # Clean proto generation
npm run typecheck       # No type errors
npm run test            # All tests pass
npm run check:publint   # Package structure valid
npm run check:exports   # Type exports valid
npm run check:size      # Within size budget
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and workflow.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting procedures.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE) — Copyright (c) 2026-present DecentralChain
