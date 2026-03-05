<div align="center">

# @decentralchain/protobuf-serialization

**The official Protocol Buffers schema definitions and multi-language bindings for the [DecentralChain](https://decentralchain.io) blockchain protocol.**

[![CI](https://github.com/Decentral-America/protobuf-serialization/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/protobuf-serialization/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/protobuf-serialization)](https://www.npmjs.com/package/@decentralchain/protobuf-serialization)
[![license](https://img.shields.io/npm/l/@decentralchain/protobuf-serialization)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/protobuf-serialization)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript&logoColor=white)](./dist/index.d.ts)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Decentral-America/protobuf-serialization/graphs/commit-activity)

</div>

---

DecentralChain is a high-performance, open-source blockchain platform designed for decentralized applications (dApps), digital asset issuance, and smart contract execution. Every transaction, block, order, and node-to-node message on the DecentralChain network is serialized using [Protocol Buffers (protobuf)](https://protobuf.dev/) — Google's language-neutral, platform-neutral mechanism for serializing structured data.

This repository is the **single source of truth** for all DecentralChain protobuf schemas. It contains the canonical `.proto` schema files that define the wire format for DecentralChain blockchain transactions, blocks, events, and gRPC APIs. Pre-generated bindings are provided for multiple languages — JavaScript/TypeScript (npm), Java (Maven), Rust (Cargo), C# (.NET), and Python — so you can integrate with the DecentralChain network from virtually any tech stack.

### Why Protocol Buffers?

| Benefit                              | Description                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Compact binary format**            | Protobuf messages are significantly smaller than JSON or XML, reducing bandwidth and storage costs on-chain.          |
| **Schema-enforced contracts**        | `.proto` files act as a strict, versioned contract between nodes, clients, and services — preventing data mismatches. |
| **Cross-language support**           | A single `.proto` definition generates idiomatic code for 10+ languages, ensuring consistency across the ecosystem.   |
| **Backward & forward compatibility** | Fields can be added or deprecated without breaking existing consumers, critical for a long-lived blockchain protocol. |
| **High-performance serialization**   | Encoding and decoding are faster than JSON parsing, which matters at the throughput levels DecentralChain targets.    |

### Key Features

- 🔗 **Canonical Schema Definitions** — The authoritative `.proto` files for every DecentralChain message type (transactions, blocks, orders, events, gRPC APIs).
- 🌐 **Multi-Language Bindings** — Pre-generated code for JavaScript/TypeScript, Java, Scala, Rust, C#, and Python.
- 📦 **npm Package** — Published as `@decentralchain/protobuf-serialization` with full TypeScript type declarations and tree-shakeable ESM output.
- ⚡ **Optimized Build** — Minimal bundle with no `.create()`, `.verify()`, `.toObject()`, or delimited encoding — only `.encode()` and `.decode()` for maximum performance.
- 🛡️ **Enterprise-Grade Quality** — CI-enforced linting, formatting, type checking, bundle size budgets, and package validation on every commit.
- 🔌 **gRPC-Ready** — Full service definitions for the DecentralChain Node gRPC API (accounts, assets, blocks, blockchain, transactions).
- 📡 **Blockchain Events** — Subscribe to real-time blockchain updates via the event streaming proto definitions.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Core Messages](#core-messages)
  - [Events](#events)
  - [Node gRPC APIs](#node-grpc-apis)
  - [Using Raw Proto Files](#using-raw-proto-files)
- [Multi-Language Support](#multi-language-support)
- [Architecture Overview](#architecture-overview)
- [Local Source Generation](#local-source-generation)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [Code of Conduct](#code-of-conduct)
- [Changelog](#changelog)
- [License](#license)

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

This repository is designed to be consumed from **any** language in the DecentralChain ecosystem. Whether you are building a node extension in Rust, a backend service in Java, a dApp frontend in TypeScript, or analytics tooling in Python, you can generate or use pre-built bindings from the same canonical `.proto` definitions.

| Language                    | Delivery Mechanism                             | Status                     |
| --------------------------- | ---------------------------------------------- | -------------------------- |
| **JavaScript / TypeScript** | npm (`@decentralchain/protobuf-serialization`) | ✅ Pre-built ESM + `.d.ts` |
| **Java**                    | Maven (`io.decentralchain:protobuf-schemas`)   | ✅ Pre-built JAR           |
| **Scala**                   | ScalaPB (via Maven artifact)                   | ✅ Source generation       |
| **Rust**                    | Cargo (git dependency)                         | ✅ Build-time generation   |
| **C#**                      | NuGet / `.csproj` reference                    | ✅ Build-time generation   |
| **Python**                  | `grpc_tools.protoc`                            | ✅ Source generation       |

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

### C#

Requires [.NET 10 SDK](https://dotnet.microsoft.com/). Add a project reference or use the proto files directly:

```xml
<ItemGroup>
  <PackageReference Include="Google.Protobuf" Version="3.34.0" />
  <PackageReference Include="Grpc.Net.Client" Version="2.76.0" />
  <PackageReference Include="Grpc.Tools" Version="2.78.0" PrivateAssets="all" />
</ItemGroup>

<ItemGroup>
  <Protobuf Include="proto/waves/**/*.proto" ProtoRoot="proto" GrpcServices="Both" />
</ItemGroup>
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

## Architecture Overview

Understanding the proto schema layout helps when navigating the codebase or generating bindings for a new language.

```
proto/waves/
├── amount.proto                        # Asset amount (asset ID + int64 value)
├── block.proto                         # Block structure (header + transactions)
├── transaction.proto                   # All transaction types & signed wrapper
├── order.proto                         # DEX exchange orders
├── recipient.proto                     # Address / alias recipient
├── reward_share.proto                  # Block reward distribution
├── invoke_script_result.proto          # InvokeScript execution results
├── state_snapshot.proto                # Node state snapshots
├── transaction_state_snapshot.proto    # Per-transaction state snapshots
├── events/
│   ├── events.proto                    # BlockchainUpdated event definitions
│   └── grpc/
│       └── blockchain_updates.proto    # gRPC streaming service for events
├── lang/
│   └── dapp_meta.proto                 # dApp script metadata
└── node/
    └── grpc/
        ├── accounts_api.proto          # Account balance & script queries
        ├── assets_api.proto            # Asset info & distribution queries
        ├── blockchain_api.proto        # Chain height, score & feature queries
        ├── blocks_api.proto            # Block retrieval & streaming
        └── transactions_api.proto      # Transaction queries & broadcasting
```

**How it fits together:** The `.proto` files define every data structure that travels over the wire between DecentralChain nodes, clients, and gRPC consumers. The `transaction.proto` file, for example, specifies the binary layout of all 18+ transaction types (transfers, leases, data transactions, smart contract invocations, etc.). When a client submits a transaction, it is serialized using these schemas, signed, and broadcast to the network. Nodes deserialize and validate the transaction using the same schema definitions, ensuring perfect interoperability regardless of the programming language used by each participant.

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

- **Node.js** >= 24 (see `.nvmrc`)
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

We welcome contributions from the community! Whether it's a bug fix, a new language binding, improved documentation, or a feature request — every contribution helps strengthen the DecentralChain ecosystem.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and workflow.

## Security

The security of the DecentralChain protocol is paramount. If you discover a vulnerability in this repository, please report it responsibly.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting procedures.

## Code of Conduct

We are committed to fostering a welcoming and inclusive community.

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE) — Copyright (c) 2026-present DecentralChain

---

<div align="center">

**Built with ❤️ by the [DecentralChain](https://decentralchain.io) community**

[Website](https://decentralchain.io) · [Documentation](https://docs.decentralchain.io) · [GitHub](https://github.com/Decentral-America) · [Report Bug](https://github.com/Decentral-America/protobuf-serialization/issues)

</div>
