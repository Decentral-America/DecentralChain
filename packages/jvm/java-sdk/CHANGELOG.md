# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **`codeql-action` upgraded** from `v4.35.4` to `v4.35.5` (SHA `9e0d7b8d25671d64c341c19c0152d693099fb5ba`) in `.github/workflows/ci.yml`.
- **Maven wrapper upgraded** from `3.9.15` to `3.9.16` in `.mvn/wrapper/maven-wrapper.properties` (latest 3.9.x stable; `3.9.16` includes dependency resolution fixes and security backports).
- **CI invokes `./mvnw`** instead of bare `mvn` in both `ci.yml` and `publish-java-sdk.yml` — ensures the build always uses the Maven version pinned in `.mvn/wrapper/maven-wrapper.properties` regardless of the system-installed Maven on CI runners.
- **`ci.yml` triggers on `dev` branch** — added `dev` to the `push.branches` list (was `[main, "feat/**", "fix/**", "chore/**"]`). The `dev` branch is the primary integration branch for DCC work; CI was silently skipped on every `dev` push until this fix.
- **KNOWN_ISSUES.md** — fixed duplicate `KNOWN-4` numbering (Docker integration test entry was mis-numbered; corrected to `KNOWN-5`, transitive deps entry to `KNOWN-6`).

### Security / Dependency Review (Round 10, 2026-05-17)
- All CI action pins re-verified at latest SHA. `codeql-action` was the only stale pin.
- Maven wrapper version verified: `3.9.16` confirmed latest 3.9.x on Maven Central (`repo.maven.apache.org` direct check; Maven 4.x series intentionally deferred for ecosystem stability).
- All runtime/test dependency versions re-confirmed at latest:
  `com.wavesplatform:lang 1.6.1` ✅ (upstream latest; replacement by `io.decentralchain:lang_3` deferred per KNOWN-2),
  `com.wavesplatform:waves-transactions 1.2.7` ✅ (upstream latest),
  `testcontainers 2.0.5` ✅, `mockito-core 5.23.0` ✅,
  `commons-codec 1.22.0` ✅, `commons-compress 1.28.0` ✅,
  `protobuf-java 4.34.1` ✅.

### Changed
- **`WavesEthConverter` → `DccEthConverter`** — renamed class and file (`WavesEthConverter.java` → `DccEthConverter.java`). Logic unchanged: converts between DCC Base58 addresses and EVM hex addresses. Updated all references: `EthereumTransactionIntegrationTest.java` (import + 2 call sites), `WavesEthConverterTest.java` → `DccEthConverterTest.java` (file + class + static import).
- **`WavesJModule` → `DccModule`** — renamed class and file (`WavesJModule.java` → `DccModule.java`). Still extends `WavesTransactionsModule` (upstream parent; name cannot change until DCC-240 is complete).
- **`WavesJMapper` → `DccMapper`** — renamed class and file (`WavesJMapper.java` → `DccMapper.java`). Updated `Node.java`: field type, constructor calls, and import.
- **`codeql-action` upgraded** from `v3` to `v4.35.4` (SHA `68bde559dea0fdcac2102bfdf6230c5f70eb485e`) in `.github/workflows/ci.yml`.

### Security / Dependency Review (Session 12, 2026-05-14) — eliminates three external JAR dependencies (`httpclient5 5.6.1`, `httpcore5`, `httpcore5-h2`) from the compile and runtime classpaths. The SDK now has zero external HTTP dependencies. Concrete changes:
  - `Node` field: `CloseableHttpClient` → `HttpClient`. `close()` is a documented no-op (JDK HttpClient on Java 11–20 manages its own connection pool; Java 21+ `AutoCloseable` support is forward-compatible).
  - Private `NodeRequest` inner class replaces `ClassicRequestBuilder`. It accumulates method, path, query parameters, headers, and an optional body, then materialises a `HttpRequest` at execution time via RFC 3986–compliant `URLEncoder`-based query encoding.
  - `exec()` uses `HttpClient.send()` with `BodyHandlers.ofByteArray()`; `InterruptedException` restores the interrupt flag per Java interrupt contract.
  - SSRF protection preserved: `HttpClient.Redirect.NEVER` (was `disableRedirectHandling()`).
  - All 17 `StringEntity` / `BasicNameValuePair` / `ClassicRequestBuilder` call sites updated.
  - `MockHttpRsUtil` updated to mock `java.net.http.HttpClient` (abstract class → standard Mockito mock). Test helper signatures now declare `throws InterruptedException` to satisfy the `HttpClient.send()` checked-exception contract.
- **`commons-lang3` removed** — `ArrayUtils.addAll(byte[], byte[])` was the sole usage, located in `WavesEthConverter.ethToWavesAddress()`. Replaced with a private `concat(byte[], byte[])` method backed by two `System.arraycopy` calls. The library was previously declared as a runtime dependency despite having zero callers in the main source tree.

### Fixed
- **`Node.waitForTransactions()` spurious 1-second sleep on successful confirmation** — the polling loop used a `finally` block for `Thread.sleep`, which executed unconditionally even when `return` was reached inside the `try` block. This caused a full `pollingIntervalInMillis` (1 000 ms) delay after all requested transactions were confirmed. Restructured: sleep moved outside the try/catch so it is only reached when the loop continues (i.e. transactions are not yet confirmed or a transient error occurred).
- **`Node.java` import block ordering** — JDK `java.net.http.*` and `java.time.Duration` imports were inserted out of alphabetical order within the `java.*` group during the HC5 migration. Re-sorted to strict alphabetical order as required by Google Java Style (enforced by Checkstyle).

### Security / Dependency Review (Session 11, 2026-05-14)
- All dependency versions re-verified at latest stable after HC5 removal:
  `jackson-databind 2.21.3` \u2705, `waves-transactions 1.2.7` (upstream-pinned) \u2705,
  `logback-classic 1.5.32` \u2705, `junit-jupiter 5.14.4` \u2705,
  `mockito-core 5.23.0` \u2705, `testcontainers 2.0.5` \u2705, `assertj-core 3.27.7` \u2705.
  Dependency management overrides: `protobuf-java 4.34.1` \u2705 (`4.35.0-RC2` skipped \u2014 RC),
  `commons-codec 1.22.0` \u2705, `commons-compress 1.28.0` \u2705.


- **`CommittedGenerator.hashCode()` omitted `conflictHeight` field** — `hashCode()` returned `Objects.hash(address, balance, transactionId)` while `equals()` also compared `conflictHeight`. Two instances differing only in `conflictHeight` were therefore `equals() == false` yet produced identical hash codes, causing unnecessary hash collisions in `HashMap`/`HashSet` and violating the expectation that code reading `equals` and `hashCode` together would see a consistent picture. Fixed by adding `conflictHeight` to `Objects.hash(address, balance, transactionId, conflictHeight)`.
- **`BlockHeaders.generationSignature` field defaulted to `null`** — the field was declared without an initializer (`private Base58String generationSignature`). When a JSON response omits the `nxt-consensus` object entirely, Jackson never invokes the `nxtConsensus()` setter, leaving `generationSignature == null`. Every other optional `Base58String` field in the same class (`stateHash`, `vrf`, `transactionsRoot`) defaults to `Base58String.empty()`. Made consistent: field now initialized to `Base58String.empty()` at declaration, so `generationSignature()` always returns a non-null value.
- **`BlockHeaders.nxtConsensus()` lacked null and type guards** — the `@JsonProperty("nxt-consensus")` setter performed `((Number) nxtConsensus.get("base-target")).longValue()` with no null check. A response with an empty `nxt-consensus` object (`{}`) or missing keys would throw `NullPointerException`. The method now returns early if the map argument is `null`, and uses `instanceof Number` / `instanceof String` checks before reading each key, falling back to 0 / `Base58String.empty()` when a key is absent or has an unexpected type.

### Security / Dependency Review (Session 10, 2026-05-14)
- All Maven plugin versions verified at latest stable:
  `maven-compiler-plugin 3.15.0` ✅, `maven-surefire-plugin 3.5.5` ✅,
  `maven-javadoc-plugin 3.12.0` ✅, `maven-source-plugin 3.4.0` ✅,
  `maven-gpg-plugin 3.2.8` ✅, `maven-enforcer-plugin 3.6.2` ✅,
  `maven-checkstyle-plugin 3.6.0` ✅, `sigstore-maven-plugin 2.0.0` ✅,
  `central-publishing-maven-plugin 0.10.0` ✅, `cyclonedx-maven-plugin 2.9.1` ✅.
- All runtime and test dependency versions verified at latest stable:
  `logback-classic 1.5.32` ✅, `junit-jupiter 5.14.4` ✅,
  `mockito-core 5.23.0` ✅, `testcontainers 2.0.5` ✅, `assertj-core 3.27.7` ✅.
- **JUnit 6.0.3** released 2026-02-15 (stable). Migration deferred: JUnit 6 requires **Java 17 minimum** (see release notes §6.0.0 breaking changes). The SDK currently targets Java 11 (`<release>11</release>`). Upgrade is blocked until the SDK Java baseline is raised in a dedicated version-bump sprint.

### Fixed
- **`EthereumTransactionInfo.isTransferTransaction()` / `isInvokeTransaction()` returned boxed `Boolean`** — these predicate methods used the boxed `Boolean` return type. The `instanceof` operator can never produce `null`, making boxing unnecessary and misleading (callers could defensively add null-checks that are never reached). Changed to primitive `boolean`.
- **`EthereumTransactionInfo.getStateChanges()` / `getBytes()` used inconsistent naming** — every other getter in the SDK uses a no-prefix accessor style (e.g. `height()`, `applicationStatus()`, `stateChanges()` on `InvokeScriptTransactionInfo`). These were the only two methods in the info hierarchy that used `get` prefix. Renamed to `stateChanges()` and `bytes()` for API consistency. Test references updated accordingly.
- **`EthereumTransactionInfo` missing `equals()` and `hashCode()`** — the class adds two fields (`stateChanges`, `bytes`) beyond the parent `TransactionInfo`. Without overriding `equals()` / `hashCode()`, two `EthereumTransactionInfo` instances with identical transaction, status, and height but different `stateChanges` or `bytes` would incorrectly compare as equal (false positive equality). Both methods now delegate to `super` and then compare the two subclass-specific fields using `Objects.equals` / `Objects.hash`. The `toString()` output is also updated to name the class as `EthereumTransactionInfo` (was `"EthereumTransaction{}"`) and include the subclass fields.
- **`TransactionWithStatus.tx(Class<T>)` unchecked cast ignored its own parameter** — the method signature `<T extends Transaction> T tx(Class<T> clazz)` accepted a `Class<T>` token but never used it, performing a raw `(T) tx` cast instead. This generated an `-Xlint:unchecked` compiler warning and gave a confusing stack trace on type mismatch (the cast failure appeared at the call site with no reference to the expected type). Changed to `clazz.cast(tx)`, which uses the parameter, eliminates the unchecked-cast warning, and throws `ClassCastException` with a clear message including the expected class name on mismatch.

### Added
- **Maven wrapper (`mvnw` / `mvnw.cmd`)** — `mvn wrapper:wrapper -Dmaven=3.9.15` was run to generate `.mvn/wrapper/maven-wrapper.properties` and the `mvnw` launcher script. CI, contributors, and reproducible-build tooling can now invoke `./mvnw` without requiring a pre-installed Maven binary. The wrapper fetches Maven 3.9.15 from Maven Central on first use.
- **`@JsonCreator` on all peer model constructors** — `ConnectedPeer`, `BlacklistedPeer`, `Peer`, and `SuspendedPeer` now explicitly annotate their constructors with `@JsonCreator`. Previously these relied on Jackson's implicit single-constructor heuristic, which is version-sensitive behavior. The explicit annotation is consistent with every other Jackson-deserialized model class in the SDK and is reliable across all Jackson 2.x releases.

### Fixed
- **Maven wrapper pinned obsolete Maven 3.9.9** — `.mvn/wrapper/maven-wrapper.properties` updated to Maven 3.9.15 (released April 13, 2026), the current latest stable 3.9.x release. Maven 4.0 remains in RC; the 3.9.x channel is the production-stable branch.
- **`CommittedGenerator.equals()` used reference equality for object fields** — `address == that.address` and `transactionId == that.transactionId` used the `==` operator, which compares object identity rather than value. This caused `equals()` to return `false` for semantically identical instances deserialized from separate JSON payloads. Both fields now use `Objects.equals()` to match the contract established by `hashCode()`.
- **`ActivationStatus.features` stored mutable Jackson list** — the `List<Feature>` deserialized by Jackson was stored directly, allowing callers to mutate internal SDK state. Now wrapped with `Collections.unmodifiableList(new ArrayList<>(...))` at construction time, with a null guard returning an empty list when the JSON field is absent.
- **`InvokeAction.payments` stored mutable Jackson list** — the `List<Amount>` deserialized by Jackson was stored directly. Now wrapped with `Collections.unmodifiableList(new ArrayList<>(...))` at construction time, with a null guard consistent with all other list fields in the SDK.
- **`FinalizationVoting.endorserIndexes` and `conflictEndorsements` stored mutable Jackson lists** — the null-branch correctly returned `Collections.emptyList()` (immutable), but the non-null branch stored the Jackson-provided `ArrayList` unwrapped. Both non-null branches now use `Collections.unmodifiableList(new ArrayList<>(...))` defensive copies, making all code paths immutable.
- **`ChallengedHeader.features` stored mutable Jackson list** — the null-branch returned `List.of()` (immutable), but the non-null branch stored the Jackson-provided list directly. Now consistently uses `Collections.unmodifiableList(new ArrayList<>(...))` for the non-null path. The null-branch is also unified to `Collections.emptyList()` for consistency.
- **`FunctionDeser.parseArgsList()` NPE on absent `args` field** — `json.get("args")` returns `null` when the field is absent from the JSON (e.g., a `Function` invocation with no arguments). The subsequent `list.size()` call in the loop header threw a `NullPointerException`. Added an explicit null/isNull/isArray guard at the top of the method that returns an empty list, matching the semantics of a missing field and eliminating the NPE.


### Fixed
- **`BlockHeaders.nxtConsensus()` dead variable** — `Object baseTargetObj = nxtConsensus.get("base-target")` was assigned and never referenced. This generated a `-Xlint:all` unused-variable warning. The dead assignment has been removed; the `base-target` value is read directly into `this.baseTarget`.
- **`BlockHeaders.rewardShares` returned mutable map** — when the JSON `rewardShares` field is present, the Jackson-deserialized `HashMap` was stored and returned directly. It is now wrapped with `Collections.unmodifiableMap(new HashMap<>(...))` at construction time, consistent with all other collection fields in the SDK.
- **`AssetDistribution.items` returned mutable map** — the Jackson-provided `Map<Address, Long>` was stored unwrapped, allowing callers to mutate the distribution items in-place. Wrapped with `Collections.unmodifiableMap(new HashMap<>(...))` at construction time.
- **`ScriptInfo.callableComplexities` returned mutable map** — the `Map<String, Integer>` from Jackson was stored and returned directly. Wrapped with `Collections.unmodifiableMap(new HashMap<>(...))` at construction time.
- **`ScriptMeta.callableFunctions` returned deeply mutable map** — both the outer `Map<String, List<ArgMeta>>` and each inner `List<ArgMeta>` value were mutable. Now deeply wrapped: inner lists wrapped with `Collections.unmodifiableList(new ArrayList<>(...))`, outer map wrapped with `Collectors.toUnmodifiableMap(...)`.
- **`Node.waitForTransactions()` exited poll loop on first network error** — a `break` statement in the `catch (Exception e)` block caused the method to abandon polling on the first `IOException` or `NodeException` from the network (e.g. a transient node restart or connection reset). The method now behaves consistently with `waitForTransaction()`: it records the exception as `lastException` and continues retrying until the `waitingInSeconds` timeout expires.

### Added
- **FindSecBugs 1.14.0 (OWASP) integrated into SpotBugs** — `findsecbugs-plugin:1.14.0` (Jun 2025, latest) added as a SpotBugs detector plugin. The OWASP-endorsed security analyzer now runs alongside SpotBugs `Max` effort / `High` threshold during `mvn verify`, covering injection, SSRF, weak crypto, path traversal, and 160+ additional security patterns.
- **CI: SBOM artifact upload** — CycloneDX `bom.xml` / `bom.json` files (generated during `package`) are now uploaded as a 90-day CI artifact (Java 11 build only). Enables downstream supply-chain consumers and Dependency-Track integration without a separate `mvn package` run.
- **CI: Dependency review for pull requests** — `actions/dependency-review-action v5.0.0` (SHA-pinned) now runs on every pull request targeting `main`. It fails the build for any new dependency with a known HIGH or CRITICAL CVE, and posts a summary comment on the PR for visibility.
- **CycloneDX SBOM generation** — `cyclonedx-maven-plugin 2.9.1` runs at `package` phase, producing `bom.xml` / `bom.json` (CycloneDX 1.6 schema) and attaching them as build artifacts. Enables downstream supply-chain tooling (Dependency-Track, etc.).
- **Reproducible builds baseline** — `project.build.outputTimestamp` property set to `2024-01-01T00:00:00Z`. Update to release timestamp on every release. Verify with `mvn artifact:check-buildplan`.
- **Compiler lint flags** — `maven-compiler-plugin` now passes `-Xlint:all -Xlint:-serial -Xlint:-processing`. Deprecation and all unchecked/cast warnings are surfaced at compile time.
- **Enforcer: Java version gate** — `requireJavaVersion 11` added alongside existing Maven version check, ensuring builds are never accidentally run on Java 8.
- **Enforcer: ban duplicate POM dependency versions** — `banDuplicatePomDependencyVersions` rule catches accidental duplicate `<dependency>` declarations.

### Fixed
- **`Node.getData(Address, String key)` path injection** — the `key` parameter is now URL-encoded with `URLEncoder.encode(key, UTF_8).replace("+", "%20")` before being inserted into the request path. Previously, a key containing `/`, `?`, `#`, or `..` sequences was appended raw, allowing a malicious or malformed key to traverse to a different API endpoint (OWASP A1 injection).
- **`Node` default constructor follows HTTP redirects** — the default `HttpClients.custom()` setup now calls `.disableRedirectHandling()`. For a financial library targeting fixed node endpoints, automatically following a redirect to an attacker-controlled URL could leak state or cause SSRF. Callers that genuinely need redirect following should inject a custom `CloseableHttpClient`.
- **`Node.getTransactionsByAddress()` NPE on empty response array** — the Waves API quirk returns transactions wrapped in an outer array (`[[tx1, tx2]]`). `asJson(request).get(0)` returned `null` when the outer array was empty, triggering a `NullPointerException` in `ObjectMapper.readValue`. Now uses an explicit `isArray() && !isEmpty()` guard, returning an empty list for an empty or unexpected response.
- **`Block.transactions` field returned mutable list** — wrapped with `Collections.unmodifiableList(new ArrayList<>(...))` at construction time, consistent with `StateChanges` (fixed in the previous session).
- **`BlockHeaders.features` field returned mutable list** — wrapped with `Collections.unmodifiableList(new ArrayList<>(...))` at construction time. Callers can no longer modify a block's feature list in-place.
- **`TransactionInfoDeser.stateChangesFromJson()` NPE on missing `payload` field** — `json.get("payload")` is now null-checked before accessing `.get("stateChanges")`. Previously, an Ethereum transaction response that lacked a `payload` field caused an unguarded `NullPointerException`.
- **`StateChanges` returns mutable internal lists** — All nine list fields (`data`, `transfers`, `issues`, `reissues`, `burns`, `sponsorFees`, `leases`, `leaseCancels`, `invokes`) are now wrapped with `Collections.unmodifiableList` at construction time. Callers can no longer mutate the internal state of a blockchain response object.
- **`EthRpcRequest.JSON_MAPPER` exposed as public mutable field** — Changed from `public static final` to package-private `static final`. This closes the door on callers registering modules or configuring the serializer from outside the package, which could silently corrupt Ethereum RPC request serialization.
- **`Common` utility class instantiable** — Added `private Common()` constructor to prevent accidental instantiation of the pure-static utility class.
- **`TypeRef` utility class instantiable** — Added `private TypeRef()` constructor to prevent accidental instantiation of the pure-static `TypeReference` holder.
- **Publish workflow: `mvn deploy -DskipTests` failed JaCoCo check** — The deploy step now passes `-Djacoco.skip=true -Dspotbugs.skip=true -Dcheckstyle.skip=true`. The separate `verify` step already ran all quality gates; re-running them during `deploy` with no coverage data caused the JaCoCo coverage check to fail (0% vs 20% minimum).

### Changed
- Forked from [wavesplatform/WavesJ](https://github.com/wavesplatform/WavesJ) v1.6.4
- Rebranded to **DecentralChain Java SDK** (`io.decentralchain:java-sdk`)
- JaCoCo code coverage enforcement (70% line/branch minimum)
- SpotBugs static analysis (High threshold, Max effort)
- Checkstyle style enforcement (Google Java Style)
- GitHub Actions CI matrix: Java 11, 17, 21, **24**
- GitHub Actions publish workflow with dry-run option
- `.editorconfig` for consistent editor settings
- `jackson-databind` added to `<dependencyManagement>` at 2.21.3 to enforce security override across all transitive consumers
- ~~KNOWN-6~~: Apache HttpClient 5.x migration plan — **completed in current release** (see `### Changed` below: HC5 → JDK `java.net.http.HttpClient`)
- KNOWN-7: documented `WavesConfig.chainId()` global static mutation thread-safety risk

### Fixed
- **`CompilationException` message lost on serialization/reflection** — constructor now calls `super(message)` so `Throwable.detailMessage` is set correctly. Previously the private `message` field override meant stack traces and `Throwable.toString()` output was missing the message text.
- **`Node` resource leak — HTTP connection pool never closed** — `Node` now implements `java.io.Closeable`. When using the default constructor (which creates its own `CloseableHttpClient`), calling `node.close()` (or using try-with-resources) will now close the connection pool and eviction threads. Constructors that accept an external `CloseableHttpClient` do not close it (caller owns the lifecycle).
- **`Node` constructor `IndexOutOfBoundsException` on empty address list** — both default and custom-client constructors now throw a descriptive `NodeException` instead of an opaque `IndexOutOfBoundsException` if the node returns an empty address list.
- **`Node.sendEthRequest()` ignores HTTP error status** — added HTTP status code check matching the pattern in `exec()`. Non-200 responses are now deserialized as `NodeException` rather than silently parsed as a valid RPC response.
- **`Node.handleEthResponse()` NPE on missing `result` field** — added null/type guard before accessing `result.hasNonNull("error")`. A missing or non-object `result` field now throws a descriptive `NodeException` instead of a `NullPointerException`.
- **`InterruptedException` swallowed without restoring interrupt flag** — in `waitForTransaction`, `waitForTransactions`, and `waitForHeight`, `catch (InterruptedException ignored)` blocks now call `Thread.currentThread().interrupt()` to restore the interrupt flag per the Java interrupt contract.
- **HTTP connection leak in `Node.asInputStream()`** — response entity is now buffered to `ByteArrayInputStream` and the underlying `CloseableHttpResponse` is closed in a `finally` block. Previously the HTTP connection was held open until GC.
- **HTTP connection leak in `Node.exec()` error path** — `CloseableHttpResponse` is now closed in a `finally` block when a non-200 status triggers `NodeException` deserialization.
- **HTTP connection leak in `Node.sendEthRequest()`** — `CloseableHttpResponse` is now closed in a `finally` block after reading the Ethereum RPC response body.
- **Utility classes instantiable** — `HashUtil`, `WavesEthConverter`, and `CompilationUtil` now declare `private` constructors, preventing accidental instantiation of pure-static utility classes.
- **`AssetBalance.equals()` NPE on null `issueTransaction` field** — `issueTransaction` is a nullable field (the Waves API omits it for non-issued assets). The `equals()` implementation called `issueTransaction.equals(that.issueTransaction)` directly, throwing `NullPointerException` whenever either instance had a null `issueTransaction`. Fixed to `Objects.equals(issueTransaction, that.issueTransaction)`.
- **`ConflictEndorsement.equals()` and `FinalizationVoting.equals()` unnecessarily autoboxed `int` primitives** — both classes used `Objects.equals(finalizedHeight, that.finalizedHeight)` where `finalizedHeight` is `int`. `Objects.equals(Object, Object)` forces autoboxing to `Integer`, which allocates heap objects for every equality check. Fixed to direct primitive comparison `finalizedHeight == that.finalizedHeight`.
- **`get`-prefix accessor naming inconsistency across 7 DTO classes** — the SDK convention is no-prefix accessors (e.g. `height()`, `status()`, `id()`). Seven model classes violated this by using JavaBean `getXxx()` style. Renamed for consistency:
  - `Balance`: `getAddress()` → `address()`, `getBalance()` → `balance()`. Also changed `equals()`/`hashCode()` to compare fields directly rather than calling the accessor methods.
  - `NodeStatus`: `getBlockchainHeight()` → `blockchainHeight()`, `getStateHeight()` → `stateHeight()`, `getUpdatedTimestamp()` → `updatedTimestamp()`, `getUpdatedDate()` → `updatedDate()`.
  - `Feature`: `getId()` → `id()`, `getDescription()` → `description()`, `getBlockchainStatus()` → `blockchainStatus()`, `getNodeStatus()` → `nodeStatus()`, `getActivationHeight()` → `activationHeight()`.
  - `ConflictEndorsement`: `getEndorserIndex()` → `endorserIndex()`, `getFinalizedBlockId()` → `finalizedBlockId()`, `getFinalizedHeight()` → `finalizedHeight()`, `getSignature()` → `signature()`.
  - `FinalizationVoting`: `getEndorserIndexes()` → `endorserIndexes()`, `getAggregatedEndorsementSignature()` → `aggregatedEndorsementSignature()`, `getFinalizedHeight()` → `finalizedHeight()`, `getConflictEndorsements()` → `conflictEndorsements()`.
  - `ChallengedHeader`: `getHeaderSignature()` → `headerSignature()`, `getFeatures()` → `features()`, `getGenerator()` → `generator()`, `getGeneratorPublicKey()` → `generatorPublicKey()`, `getDesiredReward()` → `desiredReward()`, `getStateHash()` → `stateHash()`, `getFinalizationVoting()` → `finalizationVoting()`.
  - `ActivationStatus`: `getHeight()` → `height()`, `getVotingInterval()` → `votingInterval()`, `getVotingThreshold()` → `votingThreshold()`, `getNextCheck()` → `nextCheck()`, `getFeatures()` → `features()`.
  All test call sites updated accordingly.

### ⚠ Breaking changes
- **`Node(URI, HttpClient)` → `Node(URI, CloseableHttpClient)`** — the `HttpClient` parameter type (HC4 `org.apache.http.client.HttpClient`) is replaced with `CloseableHttpClient` (`org.apache.hc.client5.http.impl.classic.CloseableHttpClient`). Update any custom client injection.
- **`Node(String, HttpClient)` and `Node(Profile, HttpClient)`** — same type change.
- **`Node.client()` returns `CloseableHttpClient`** instead of `HttpClient`.
- **`Node` constructors no longer call `WavesConfig.chainId()`** — the previous behavior of auto-setting the JVM-global chain ID on every `Node` construction has been removed. It was a thread-safety hazard (the second `Node` targeting a different chain silently clobbered the first). Callers that relied on this side-effect must now call `WavesConfig.chainId(node.chainId())` explicitly after construction.

### Changed
- **CI: Trivy SARIF now uploaded to GitHub Security tab** — replaced `actions/upload-artifact` with `github/codeql-action/upload-sarif@7fd177fa...` (v3, SHA-pinned). SARIF findings are now visible under the repository's Security → Code scanning tab, not buried as a build artifact download.
- `groupId`: `com.wavesplatform` → `io.decentralchain`
- `artifactId`: `wavesj` → `java-sdk`
- `central-publishing-maven-plugin`: 0.9.0 → 0.10.0
- `testcontainers`: 2.0.3 → 2.0.5
- `jackson-core`: 2.20.1 → **2.21.3**
- `jackson-databind`: 2.21.3 (newly pinned in dependencyManagement)
- `protobuf-java`: 4.33.2 → **4.34.1**
- `commons-codec`: 1.20.0 → **1.22.0**
- `logback-classic`: 1.5.29 → **1.5.32** (test scope)
- `junit-jupiter`: 5.14.1 → **5.14.4**
- `mockito-core`: 5.21.0 → **5.23.0**
- `maven-compiler-plugin`: 3.14.1 → **3.15.0**
- `maven-surefire-plugin`: 3.5.4 → **3.5.5**
- **`httpclient` 4.5.14 (EOL) → `httpclient5` 5.6.1** — full migration to Apache HttpClient 5 classic APIs. `RequestBuilder` → `ClassicRequestBuilder`; `HttpUriRequest` → `ClassicHttpRequest`; `HttpResponse.getStatusLine().getStatusCode()` → `HttpResponse.getCode()`; timeouts moved from `RequestConfig` to `ConnectionConfig` on `PoolingHttpClientConnectionManagerBuilder`; cookie spec `CookieSpecs.STANDARD` → `StandardCookieSpec.STRICT`.
- CI: `scacap/action-surefire-report@v1` (unmaintained, unpinned) → `ScalableCapital/action-surefire-report@6f5c2b5...` **v2.0.2** (SHA-pinned; fixes CVE-2026-24400 in action's internal assertj-core dep)
- CI: `build` job now declares `permissions: checks: write` (required for surefire report API write)
- CI: Java matrix extended to include **Java 24**
- GPG loopback pinentry mode declared in pom.xml
- SCM block updated to Decentral-America/java-sdk

### Removed
- Dead dependency `org.testcontainers:junit-jupiter:1.21.4` (unused — no @Testcontainers annotations in test sources)

---

## 1.0.0
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
