# Changelog

All notable changes to `io.decentralchain:wavesj` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [DecentralChain version conventions](https://github.com/Decentral-America/DecentralChain/blob/dev/CONTRIBUTING.md).

---

## [1.6.4.0] — 2026-05-16

Initial DCC release — fork of [wavesplatform/WavesJ](https://github.com/wavesplatform/WavesJ)
at commit `2f78fd3f6`.

### Changed
- Maven coordinates: `com.wavesplatform:wavesj` → `io.decentralchain:wavesj`
- Version: `1.6.4-SNAPSHOT` → `1.6.4.0` (DCC convention: upstream + `.0`)
- Java: upgraded 11 → 25 (`<release>25</release>`)
- HTTP client: replaced Apache `httpclient 4.5.14` with JDK `java.net.http.HttpClient`
  (zero external HTTP dependency; `HttpClient.Redirect.NEVER`; `InterruptedException`
  restores interrupt flag; private `NodeRequest` inner class)
- Removed `commons-lang3:3.20.0` runtime dependency; replaced `ArrayUtils.addAll()` with
  private `concat(byte[], byte[])` via `System.arraycopy` in `DccEthConverter`
- `logback-classic`: demoted to `test` scope (was `compile` — not shipped to consumers)
- `waves-transactions:1.2.7` → `io.decentralchain:transactions-java:1.0.0` (DCC-240)
- `DccEthConverter.java` (renamed from `WavesEthConverter.java`)
- `DccModule.java` (renamed from `WavesJModule.java`)
- `DccMapper.java` (renamed from `WavesJMapper.java`)
- `Profile.java`: updated node endpoints to DecentralChain mainnet + testnet URLs
- Testcontainers: `2.0.3` → `2.0.5`; removed dropped `junit-jupiter` TC module
  (container lifecycle via static initializer in `BaseTestWithNodeInDocker`)
- mockito-core: `5.21.0` → `5.23.0`
- junit-jupiter: `5.14.1` → `5.14.4`
- `DccEthConverterTest.java` (renamed from `WavesEthConverterTest.java`)
- `EthereumTransactionIntegrationTest.java`: updated imports + `DccEthConverter` calls

### Added
- Enterprise Maven build: enforcer (Java 25 gate), JaCoCo coverage, SpotBugs + FindSecBugs,
  CycloneDX SBOM, maven-source-plugin, maven-javadoc-plugin
- `config/pmd-ruleset.xml` — PMD source analysis (audit profile)
- `config/spotbugs-exclude.xml` — SpotBugs false-positive exclusions
- `config/owasp-suppressions.xml` — OWASP dependency-check suppressions
- `KNOWN_ISSUES.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.github/workflows/wavesj-ci.yml` — CI on push/PR
- `.github/workflows/wavesj-publish.yml` — manual publish to Maven Central
- `project.json` — Nx project descriptor
- Maven wrapper for reproducible builds

### Security
- `protobuf-java` → `4.34.1` (latest stable via `dependencyManagement`)
- `commons-codec` → `1.22.0` (via `dependencyManagement`)
- `jackson-databind` → `2.21.3` (via `dependencyManagement`)
- `logback-classic 1.5.32`: CVE-2026-1225 (ACE) fix (requires 1.5.25+)
- Removed `dev.sigstore:sigstore-maven-plugin` (upstream default; DCC uses GPG only)
- `autoPublish=false`: Maven Central releases require human review

---

## Upstream history (wavesplatform/WavesJ)


- significantly redesigned interface
- based on [Waves Crypto](https://github.com/wavesplatform/waves-crypto-java) and [Waves transactions](https://github.com/wavesplatform/waves-transactions-java) libraries
- supported most of Waves Node API
- feature #15 of Waves Node 1.2 Malibu release is now supported

## 0.17.0
- new InvokeScriptTransactionStCh with stateChanges attribute was added. It was design to provide an additional information about Invocation transaction and couldn't be used to post invokes into blockchain. That why constructor was marked as package-private
- new AllTxIterator class to navigate over all account transactions. It has a generic semantic and can be used for other endpoints and transaction.
- new methods to retrieve information about state changes were added into Node:
  - Node#getStateChanges
  - Node#getAddressStateChanges
  - Node#getAllAddressStateChanges
- applicationStatus supported to see if any transaction has failed in blockchain


## 0.16.0
- Support Order version 3
- Support blockchain rewards information


## 0.14.1

- Support for InvokeScript transaction
- Support for Exchange transaction version 2
- Separated getBodyBytes() (tx bytes without signature) and getBytes() (whole tx bytes) methods.
- Crypto hash methods are public now
- Bug fixing


## 0.13.2

- Asset distribution method was added
- Burn chain id serialization was fixed

## 0.13.1

- Address transaction method was added

## 0.13

- Batch cancel method was added
- Transaction ids calculation was fixed

## 0.10
- All existed transactions was realized as objects
- Block now contains parsed transactions objects

## 0.9
- Added network timeouts to Node so that requests do not hang
- Support for aliases in transfers and leases

## 0.8
- Support for transactions version 2 (compatible with Waves 0.13)
- `Transaction.setProof()` was renamed `withProof()` to better reflect the fact that it doesn't modify the object but rather returns new one
- `char PublicKeyAccount.scheme` was replaced with `byte chainId`
- Introduced `Transaction.getBytes()`

## 0.7
- Support for account scripts
- Added `getBlock()` and `getTransaction()` to `Node`
- Transaction factory methods got overrides that accept `timestamp` parameter
- String entries in Data transactions

## 0.6

Reworked signing and proofs:
- Removed `signers` parameter from factory methods
- Moved `sign` method from `Transaction` to `PrivateKeyAccount`
- In `Transaction`, `addProof(String)` becomes `setProof(int, String)` so that it's possible to create non-contiguous lists of proofs, e.g. define proofs 1 and 3 but leave proof 2 out.

This is a non-compatible change, but hopefully not many people have started using features from version 0.5 given that they are three days old now.

## 0.5

Added multisig support in Transaction. Factory methods now accept PublicKeyAccount for `sender` rather than PrivateKeyAccount, and a separate `signers` array. This is a source-compatible change, however, existing code may need to be recompiled.

Also replaced `signature` with `proofs`, and added methods to add proofs to a transaction.
