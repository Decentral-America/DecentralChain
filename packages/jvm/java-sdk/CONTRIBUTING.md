# Contributing to DecentralChain Java SDK

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to behave professionally. Be respectful of contributors and maintainers.

## Prerequisites

- **Java 11+** (Java 17 or 21 recommended)
- **Maven 3.9.2+** — or use the included wrapper: `./mvnw`
- **Docker** — required to run the full integration test suite

## Setup

```bash
git clone https://github.com/Decentral-America/java-sdk.git
cd java-sdk
./mvnw verify -Dgpg.skip=true -Dsigstore.skip=true
```

## Scripts

| Command | Description |
|---|---|
| `./mvnw verify -Dgpg.skip=true -Dsigstore.skip=true` | Full build + unit tests + static analysis |
| `./mvnw test` | Unit tests only |
| `./mvnw spotbugs:check` | SpotBugs static analysis |
| `./mvnw checkstyle:check` | Checkstyle style report |
| `./mvnw jacoco:report` | Generate coverage report → `target/site/jacoco/` |
| `./mvnw dependency:analyze` | Check for unused / undeclared dependencies |

## Workflow

1. Fork → create a branch from `dev` using the DCC naming convention:
   `feat/DCC-###-short-description`
2. Make changes with tests
3. `./mvnw verify -Dgpg.skip=true -Dsigstore.skip=true` must exit 0
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   `feat(DCC-###): add support for ...`
5. Push → open PR against `dev`

## Commit Convention

```
<type>(DCC-###): <lowercase imperative description, no period>
```

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore`

## Java Source Packages

The Java source packages use the `io.decentralchain.sdk.*` namespace, matching the Maven groupId `io.decentralchain`. This was renamed from the upstream `io.decentralchain.sdk.*` as part of the DCC rebrand (DCC-249). See the workspace root `STATUS.md` Per-Package Known Issues section for migration notes.

## Upstream

This library tracks [Decentral-America/java-sdk](https://github.com/Decentral-America/java-sdk) as the `upstream` remote. To incorporate upstream fixes:

```bash
git fetch upstream
git log upstream/master --oneline | head -10   # review changes
# cherry-pick or merge relevant commits
git merge upstream/master --no-ff -m "chore: merge upstream WavesJ <commit>"
```

## Secrets for Publishing

Publishing to Maven Central requires three GitHub secrets in the `maven-central` environment:
- `MAVEN_CENTRAL_USERNAME` — Sonatype Central Portal username
- `MAVEN_CENTRAL_PASSWORD` — Sonatype Central Portal token
- `MAVEN_GPG_PRIVATE_KEY` — GPG private key (armored, base64)
- `MAVEN_GPG_PASSPHRASE` — GPG key passphrase
