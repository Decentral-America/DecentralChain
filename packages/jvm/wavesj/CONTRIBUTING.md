# Contributing to wavesj

Thank you for your interest in contributing to the DecentralChain Java SDK!

## Code of Conduct

By participating, you agree to behave professionally. Be respectful of all
contributors and maintainers.

## Prerequisites

- **Java 25** — install via `brew install openjdk` or [sdkman.io](https://sdkman.io)
- **Maven 3.9.2+** — or use the included wrapper: `./mvnw`
- **Docker** — required to run the full integration test suite
  (unit tests run without Docker)

## Setup

```bash
cd packages/jvm/wavesj
./mvnw verify
```

## Common commands

| Command | Description |
|---|---|
| `./mvnw verify` | Full build + unit tests + SpotBugs + JaCoCo |
| `./mvnw test` | Unit tests only |
| `./mvnw verify -P integration-test` | Full tests incl. Docker integration tests |
| `./mvnw verify -P audit` | All of the above + PMD + OWASP dependency-check |
| `./mvnw spotbugs:check` | SpotBugs static analysis only |
| `./mvnw jacoco:report` | Generate HTML coverage report → `target/site/jacoco/` |
| `./mvnw dependency:analyze` | Check for unused / undeclared dependencies |

## Workflow

1. Fork the monorepo → create a branch from `dev`:
   `feat/DCC-###-short-description`
2. Make your changes + tests
3. `./mvnw verify` must exit 0
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   `feat(DCC-###): add support for ...`
5. Push → open PR against `dev` in the monorepo

## Commit convention

```
<type>(DCC-###): <lowercase imperative description, no period>
```

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore`

## Java source packages

The Java source packages (`com.wavesplatform.wavesj.*`) intentionally retain
their upstream names for binary and API compatibility. Only the Maven coordinates
have been rebranded (`io.decentralchain:wavesj`). See [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
for the full explanation and the resolution plan (DCC-249).

## Upstream

This library tracks [wavesplatform/WavesJ](https://github.com/wavesplatform/WavesJ)
via the `upstream-wavesj` remote. To pull upstream fixes into the monorepo:

```bash
cd /path/to/Ecosystem/DecentralChain
git fetch upstream-wavesj master
git subtree merge --prefix=packages/jvm/wavesj upstream-wavesj/master --squash
# Review and resolve any conflicts
git push origin dev
```

## Release

Releases are triggered by the `wavesj-publish.yml` GitHub Actions workflow
(`workflow_dispatch`). Requires: `CENTRAL_TOKEN` + `MAVEN_GPG_PASSPHRASE` secrets.
`autoPublish=false` — all Maven Central releases require human review in the
[Sonatype Central Portal](https://central.sonatype.com/) before going live.
