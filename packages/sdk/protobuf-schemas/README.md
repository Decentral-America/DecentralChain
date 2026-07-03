<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/protobuf-schemas</h3>

<p align="center">
  Protobuf schema definitions and generated bindings for the DecentralChain blockchain protocol.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/protobuf-schemas"><img src="https://img.shields.io/npm/v/@decentralchain/protobuf-schemas?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/protobuf-schemas" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/protobuf-schemas"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/protobuf-schemas" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/protobuf-schemas" alt="node" /></a>
</p>

---

## Overview

This repository contains the canonical `.proto` schema files for DecentralChain blockchain transactions, blocks, events, and gRPC APIs. It provides pre-generated bindings for multiple languages: JavaScript/TypeScript (npm), Java (Maven), Rust (Cargo), C# (.NET), and Python.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/protobuf-schemas
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

```javascript
import { dcc } from "@decentralchain/protobuf-schemas";
import Long from "long";

// Encode an Amount message
const buffer = dcc.Amount.encode({
  assetId: new Uint8Array([1, 2, 3, 4]),
  amount: Long.fromNumber(1_000_000),
}).finish();

// Decode it back
const decoded = dcc.Amount.decode(buffer);
console.log(decoded.amount.toNumber()); // 1000000
```

> **Note**: The `dcc` namespace is the **protocol-level identifier** inherited from the blockchain's protobuf schema. It defines the wire format and must remain unchanged for serialization compatibility.

## API Reference

The package exports a `dcc` namespace containing all protobuf message types:

### Core Messages

| Message                   | Proto File                 | Description                      |
| ------------------------- | -------------------------- | -------------------------------- |
| `dcc.Amount`            | `dcc/amount.proto`       | Asset amount (asset_id + int64)  |
| `dcc.Block`             | `dcc/block.proto`        | Block with header + transactions |
| `dcc.Transaction`       | `dcc/transaction.proto`  | Transaction types                |
| `dcc.SignedTransaction` | `dcc/transaction.proto`  | Signed transaction wrapper       |
| `dcc.Order`             | `dcc/order.proto`        | Exchange order                   |
| `dcc.Recipient`         | `dcc/recipient.proto`    | Address or alias recipient       |
| `dcc.RewardShare`       | `dcc/reward_share.proto` | Block reward distribution        |

### Events

| Message                          | Proto File                                   |
| -------------------------------- | -------------------------------------------- |
| `dcc.events.BlockchainUpdated` | `dcc/events/events.proto`                  |
| `dcc.events.grpc.*`            | `dcc/events/grpc/blockchain_updates.proto` |

### Node gRPC APIs

| Service                           | Proto File                               |
| --------------------------------- | ---------------------------------------- |
| `dcc.node.grpc.AccountsApi`     | `dcc/node/grpc/accounts_api.proto`     |
| `dcc.node.grpc.AssetsApi`       | `dcc/node/grpc/assets_api.proto`       |
| `dcc.node.grpc.BlockchainApi`   | `dcc/node/grpc/blockchain_api.proto`   |
| `dcc.node.grpc.BlocksApi`       | `dcc/node/grpc/blocks_api.proto`       |
| `dcc.node.grpc.TransactionsApi` | `dcc/node/grpc/transactions_api.proto` |

Each message type provides:

- `.encode(message)` — encode a message to a `Writer`
- `.decode(reader)` — decode a message from a `Reader` or `Uint8Array`

> **Note**: `.create()`, `.verify()`, `.toObject()`, `.fromObject()`, and delimited encoding are excluded from the build to minimize bundle size.

### Using Raw Proto Files

Raw `.proto` files are available at `@decentralchain/protobuf-schemas/proto/*` for custom code generation with tools like `protoc`, `grpc-tools`, `pbjs`, or language-specific protobuf compilers.

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
     (f: File) => f.getName.endsWith(".proto") && f.getParent.endsWith("dcc")
   ),
   PB.targets += scalapb.gen(flatPackage = true) -> sourceManaged.value
))
```

See [ScalaPB docs](https://scalapb.github.io/docs/third-party-protos) for more info.

### Rust

Add dependency to your `Cargo.toml`:

```toml
[dependencies]
decentralchain-protobuf-schemas = { git = "https://github.com/Decentral-America/protobuf-schemas" }
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
  <Protobuf Include="proto/dcc/**/*.proto" ProtoRoot="proto" GrpcServices="Both" />
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
git clone https://github.com/Decentral-America/protobuf-schemas.git
cd protobuf-schemas
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
| `npm run lint`          | Biome lint |
| `npm run lint:fix`      | Biome lint with auto-fix                         |
| `npm run format`        | Format with Biome                         |
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

## Related packages

| Package                                                                                      | Description                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------ |
| [`@decentralchain/marshall`](https://www.npmjs.com/package/@decentralchain/marshall)         | Binary serialization/deserialization |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers     |
| [`@decentralchain/types`](https://www.npmjs.com/package/@decentralchain/types)         | Core TypeScript type definitions     |
| [`@decentralchain/node-api`](https://www.npmjs.com/package/@decentralchain/node-api)   | Node REST API client                 |

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](../../SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)
