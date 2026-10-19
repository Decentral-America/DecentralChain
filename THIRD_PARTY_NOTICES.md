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
