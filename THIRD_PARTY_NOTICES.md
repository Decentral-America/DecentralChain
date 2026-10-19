# Third-party notices

This file lists third-party code that is part of, or ships with, the packages in this repository,
and the licence obligations that come with it.

## GPL-3.0-only component: curve25519

| | |
|---|---|
| Package | `io.decentralchain:curve25519` (`packages/jvm/curve25519`) |
| Upstream | WhisperSystems curve25519-java, https://github.com/signalapp/curve25519-java |
| Licence | GNU General Public License v3.0 only (`packages/jvm/curve25519/LICENSE`) |
| Used by (this repo) | `io.decentralchain:crypto` (direct), `io.decentralchain:transactions` and `io.decentralchain:java-sdk` (via crypto), `io.decentralchain:ride` (RIDE JVM build) |
| Used by (other repos) | node-scala (`project/Dependencies.scala`), matcher (`project/Dependencies.scala`); both ship it in Docker images and Debian packages |

The MIT-licensed artifacts above keep their own licence for their own code, and each carries
`META-INF/NOTICE` stating the curve25519 dependency. Anyone distributing a program that includes
curve25519 (node, matcher, or an application built on java-sdk) distributes a combined work under
GPL-3.0 and must provide the corresponding source. The curve25519 source is in this repository at
`packages/jvm/curve25519`; node-scala and matcher distributions must offer their source accordingly.

Decision (operator, 2026-10-18): keep curve25519 and document the obligation; replacing it with a
permissively licensed X25519/Ed25519 implementation was considered and not chosen.

## Code derived from Waves and other upstream projects

Most packages here started as forks; their full upstream history was grafted into this
repository. The upstream copyright notices are kept in each package's LICENSE (or NOTICE).

| Package | Upstream | Upstream licence | Upstream notice |
|---|---|---|---|
| `packages/sdk/assets-pairs-order` | `@waves/assets-pairs-order` | MIT | (no named holder upstream) |
| `packages/sdk/bignumber` | `@waves/bignumber` | MIT | (no named holder upstream; author tsddaniil) |
| `packages/sdk/crypto` | Keeper-Wallet crypto | MIT | Copyright (c) Sergey Slipchenko (in LICENSE) |
| `packages/sdk/data-entities` | `@waves/data-entities` | Apache-2.0 | Copyright (c) Waves Platform (in NOTICE) |
| `packages/sdk/data-service-client` | `@waves/data-service-client-js` | MIT | (no named holder upstream; author Ivan Shmidt) |
| `packages/sdk/ledger` | `@waves/ledger` (waves-ledger-js) | Apache-2.0 | Copyright (c) Waves Platform (in NOTICE) |
| `packages/sdk/marshall` | `@waves/marshall` | MIT | Copyright (c) 2018 Wavesplatform LLC |
| `packages/sdk/node-api-grpc` | `@waves/node-api-grpc` | MIT | Copyright (c) Vyacheslav Suharnikov |
| `packages/sdk/oracle-data` | `@waves/oracle-data` | MIT | (no named holder upstream) |
| `packages/sdk/protobuf-schemas` | wavesplatform/protobuf-schemas (`@waves/protobuf-serialization`) | MIT | (no named holder upstream; author Dmitry Shuranov) |
| `packages/sdk/signature-adapter` | `@waves/signature-adapter` | MIT | Copyright (c) 2018 WavesPlatform |
| `packages/sdk/signer` | `@waves/signer` | MIT | Copyright (c) 2020 Inal Kardanov |
| `packages/sdk/transactions` | `@waves/waves-transactions` | MIT | (no named holder upstream; author wavesplatform) |
| `packages/sdk/ts-lib-crypto` | `@waves/ts-lib-crypto` | MIT | Copyright (c) 2018 WavesPlatform |
| `packages/jvm/blst` | supranational/blst via Waves | Apache-2.0 (blst) / MIT (bindings) | Copyright (c) 2025 Waves Protocol (in LICENSE) |
| `packages/jvm/crypto` | Waves crypto (Java) | MIT | Copyright (c) 2019 Maxim Smolyakov (in LICENSE) |
| `packages/jvm/groth16` | zkcrypto/bellman-based verifier | MIT | Copyright (c) 2019 Igor Gulamov (in LICENSE) |
| `packages/jvm/java-sdk` | wavesplatform/WavesJ | MIT | Copyright (c) 2018 WavesPlatform |
| `packages/jvm/transactions` | `com.wavesplatform:waves-transactions` | MIT | Copyright (c) WavesPlatform |
| `packages/ride` | wavesplatform/Waves (`lang`) | MIT | Copyright (c) 2018 WavesPlatform |
| `packages/ride/ts` | `@waves/ride-js` | MIT | Copyright (c) 2018 WavesPlatform |

### Upstreams that declare no licence (operator legal review needed)

These packages were forked from upstream projects that publish no licence file and no `license`
field: `@waves/node-api-js` -> `packages/sdk/node-api`, `@waves/money-like-to-node` ->
`packages/sdk/money-like-to-node`, `@waves/parse-json-bignumber` -> `packages/sdk/parse-json-bignumber`,
`@waves/waves-browser-bus` -> `packages/sdk/browser-bus`, `@waves/ts-types` -> `packages/sdk/types`,
Keeper-Wallet `provider-keeper` -> `packages/sdk/cubensis-connect-provider`, and Keeper
`waves-keeper-types` -> `packages/sdk/cubensis-connect-types`. Code without a licence grant is
"all rights reserved" by default. Whether to seek a licence from the original authors, rely on
their public intent, or rewrite is an operator/legal decision; until then these packages are
published under MIT for DecentralChain's own changes only.
