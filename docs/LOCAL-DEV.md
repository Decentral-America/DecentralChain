# Local E2E Development Guide

Full ecosystem running on your machine — no Linode, no production credentials needed.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Your machine                                                │
│                                                              │
│  ┌─────────────────────┐     gRPC :6881                      │
│  │  node-scala (priv.) │ ──────────────────┐                 │
│  │  (chain R, Docker)  │                   ▼                 │
│  │  REST   :6869       │    ┌──────────────────────────────┐ │
│  │  P2P    :6860       │    │ blockchain-postgres-sync      │ │
│  └─────────────────────┘    │ (Docker)                      │ │
│           │                 └──────────────┬───────────────┘ │
│           │ REST                           │ SQL             │
│           │                               ▼                 │
│           │              ┌──────────────────────────────┐   │
│           │              │  PostgreSQL :5432             │   │
│           │              └──────────────┬───────────────┘   │
│           │                             │                   │
│           │                             ▼                   │
│           │              ┌──────────────────────────────┐   │
│           │              │  data-service  :3000         │   │
│           │              └──────────────────────────────┘   │
│           │                             │                   │
│           ▼                             ▼                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  exchange  :3333  │  scanner  :5173  │  cubensis-connect│ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Docker** (Desktop or Engine) — for the node and BPS
- **Node.js ≥ 24** and **pnpm ≥ 10** — for the JS apps
- **PostgreSQL 15+** — either local brew install or Docker (see Step 2)

### Optional (only if developing specific packages)

- **Rust + wasm-pack** — required to build `@decentralchain/crypto` (BPS native crypto). Install via [rustup](https://rustup.rs/) and `cargo install wasm-pack`
- **JDK 21+** and **Maven 3.9+** — required to run `java-sdk` tests. Recommend [SDKMAN](https://sdkman.io/) for installation
- **nektos/act** — required to run GitHub Actions locally (see [Step 7](#step-7--run-github-actions-locally-with-act))

Check:
```bash
docker --version
node --version   # need 24+
pnpm --version   # need 10+
psql --version   # need 15+ (Option B postgres only)
# Optional:
rustc --version  # need 1.80+ (if building @decentralchain/crypto)
wasm-pack --version  # need 0.15+ (if building @decentralchain/crypto)
java --version   # need 21+ (if running java-sdk tests)
mvn --version    # need 3.9+ (if running java-sdk tests)
act --version    # need 0.2.88+ (if running GitHub Actions locally)
```

---

## Step 1 — Start the private node

The private node is a fully configured localnet. It starts with:
- Chain ID: `R` (network byte 82)
- 10-second block times
- All protocol features pre-activated at height 0
- One pre-funded rich account with all tokens

> **Corrected 2026-08-13** — there is no separate `node-scala-private` image; it never existed
> (confirmed against the GHCR package list). There's only ever one `node-scala` image — the
> "private" chain is the regular image with two config files mounted in. This is exactly what
> `docker-compose.test.yml` at the repo root already does (see the "One-command test stack"
> section below) — the manual `docker run` below just spells out the same thing one step at a
> time. Confirmed against source: `node-scala/docker/entrypoint.sh` (loads `/etc/dcc/dcc.conf`
> when present), `DecentralChain/docker/private-node/decentralchain.custom.conf` (fixes the
> genesis recipient), and `DecentralChain/docker-compose.test.yml`'s own `dcc-node` service.

```bash
# Create a shared Docker network (required for inter-container communication on macOS)
docker network create dcc-net 2>/dev/null || true

docker pull ghcr.io/decentral-america/node-scala:latest

# Run from Ecosystem/DecentralChain — the two conf files live at docker/private-node/
docker run -d \
  --name dcc-private-node \
  --network dcc-net \
  -p 6869:6869 \
  -p 6860:6860 \
  -p 6881:6881 \
  -v "$(pwd)/docker/private-node/decentralchain.custom.conf:/etc/dcc/dcc.conf:ro" \
  -v "$(pwd)/docker/private-node/local.conf:/etc/dcc/local.conf:ro" \
  -e DCC_WALLET_SEED="dcc private node seed with dcc tokens" \
  -e DCC_WALLET_PASSWORD="test" \
  -e DCC_REST_API_BIND="0.0.0.0" \
  ghcr.io/decentral-america/node-scala:latest
```

> **Port 6881** (BlockchainUpdates gRPC, needed by blockchain-postgres-sync) is already enabled
> by the mounted `local.conf` — no extra step needed; the
> [Enabling BlockchainUpdates locally](#enabling-blockchainstates-locally) section further down
> is for enabling it on a *different* base config that doesn't already include it.

> **Not zero-config** (corrected — the seed/password above must be passed via `-e`; nothing is
> baked into the image). What genuinely is fixed is the genesis block itself: the mounted
> `decentralchain.custom.conf` hard-codes the rich account's **address** at the protocol level
> (`3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr`, 100M DCC) — the seed above is the real, correct
> mnemonic for that address (not a placeholder), confirmed against `docker-compose.test.yml`'s
> own comment block and `DecentralChain/.env.example`'s `DCC_TEST_MINER_SEED`.

Verify the node is running (wait ~15s for startup):
```bash
curl -s http://localhost:6869/node/version | jq .
```

**Rich account** (all tokens are here — genesis-fixed address, verified real seed):
```
Seed:    dcc private node seed with dcc tokens
Address: 3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr
```

> **Corrected 2026-08-13** — there is no baked-in API key. `decentralchain.custom.conf` has
> `api-key-hash` commented out by default (set via `DCC_API_KEY_HASH` if you need protected
> endpoints locally — e.g. `POST /wallet/seed`). Most read endpoints (`/node/version`,
> `/blocks/height`, `/addresses/balance/...`) don't require one.

To stop and preserve state:
```bash
docker stop dcc-private-node
docker start dcc-private-node   # resumes from same block height
```

To wipe and start fresh:
```bash
docker rm -f dcc-private-node
# then re-run the docker run command above
```

---

## Step 2 — Start PostgreSQL

### Option A: Docker (recommended, no install needed)

```bash
docker run -d \
  --name dcc-postgres \
  --network dcc-net \
  -p 5432:5432 \
  -e POSTGRES_DB=dcc \
  -e POSTGRES_USER=dcc \
  -e POSTGRES_PASSWORD=dcc_local \
  postgres:17-alpine
```

### Option B: Local Homebrew

> ⚠ If using Option B, the BPS Docker container cannot reach `dcc-postgres` by name.
> Replace `HOST=dcc-postgres` with `HOST=host.docker.internal` in Steps 3a and 3b.

```bash
brew services start postgresql@17
createdb dcc
createuser dcc
psql -c "ALTER USER dcc WITH PASSWORD 'dcc_local';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE dcc TO dcc;"
```

---

## Step 3 — Run blockchain-postgres-sync

BPS subscribes to the node's gRPC stream and writes blockchain data into PostgreSQL. It must run two phases: **migration** (schema setup) then **consumer** (ongoing sync).

### 3a — Run the database migration

BPS uses `POSTGRES__` (double underscore) prefix for database config and the migration binary requires `up` to apply:

```bash
docker run --rm \
  --network dcc-net \
  -e POSTGRES__HOST=dcc-postgres \
  -e POSTGRES__DATABASE=dcc \
  -e POSTGRES__USER=dcc \
  -e POSTGRES__PASSWORD=dcc_local \
  ghcr.io/decentral-america/blockchain-postgres-sync:latest \
  ./migration up
```

### 3b — Start the consumer

Consumer config uses unprefixed env vars (`BLOCKCHAIN_UPDATES_URL`, `CHAIN_ID`, `STARTING_HEIGHT`):

```bash
docker run -d \
  --name dcc-bps \
  --network dcc-net \
  -p 9090:9090 \
  -e POSTGRES__HOST=dcc-postgres \
  -e POSTGRES__DATABASE=dcc \
  -e POSTGRES__USER=dcc \
  -e POSTGRES__PASSWORD=dcc_local \
  -e BLOCKCHAIN_UPDATES_URL=http://dcc-private-node:6881 \
  -e CHAIN_ID=82 \
  -e STARTING_HEIGHT=1 \
  ghcr.io/decentral-america/blockchain-postgres-sync:latest
```

> **CHAIN_ID=82** is the ASCII value of `R` (the private node's network byte).

Check health:
```bash
curl -s http://localhost:9090/health
```

---

## Step 4 — Start data-service

```bash
cd Ecosystem/DecentralChain
pnpm install

# Build data-service and its deps
pnpm --filter @decentralchain/data-service... build

# Create local config
cat > apps/data-service/variables.env << 'EOF'
PGHOST=localhost
PGPORT=5432
PGDATABASE=dcc
PGUSER=dcc
PGPASSWORD=dcc_local
PGSSLMODE=disable
PORT=3000
LOG_LEVEL=debug
NODE_ENV=development
# Required by rates and matcher API endpoints
DEFAULT_MATCHER=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr
RATE_PAIR_ACCEPTANCE_VOLUME_THRESHOLD=1
RATE_THRESHOLD_ASSET_ID=DCC
EOF

# Start (variables.env must be exported — pnpm dev does not load it automatically)
cd apps/data-service
set -a && source variables.env && set +a && pnpm dev
```

Verify:
```bash
curl -s http://localhost:3000/ | jq .
```

---

## Step 5 — Start exchange

The exchange is a Vite React app. For local dev you need a `.env.local` that overrides the URLs:

```bash
cd Ecosystem/DecentralChain/apps/exchange

cat > .env.local << 'EOF'
VITE_APP_ENV=development
VITE_NETWORK=mainnet
VITE_NETWORK_BYTE=R
VITE_NODE_URL=http://localhost:6869
VITE_MATCHER_URL=http://localhost:6886/matcher
VITE_API_URL=http://localhost:3000
VITE_DATA_SERVICE_URL=http://localhost:3000
VITE_EXPLORER_URL=http://localhost:5173
VITE_DEBUG=true
VITE_ENABLE_MOCKS=false
VITE_SENTRY_ENABLED=false
EOF

# From monorepo root
cd Ecosystem/DecentralChain
pnpm --filter exchange dev
```

Exchange opens at **http://localhost:3333**

---

## Step 6 — Start scanner

The scanner (blockchain explorer) reads from the node and data-service:

```bash
cd Ecosystem/DecentralChain

# Set env vars inline for the dev server
DCC_NODE_URL=http://localhost:6869 \
DCC_DATA_SERVICE_URL=http://localhost:3000/v0 \
pnpm --filter scanner dev
```

Scanner opens at **http://localhost:5173**.

---

## Step 7 — cubensis-connect e2e tests (optional)

The browser extension has a full Selenium/Docker-based e2e suite that already knows about the private node:

```bash
cd Ecosystem/DecentralChain/apps/cubensis-connect

# This spins up: private node + Selenium Hub + Chrome + screen recording
docker compose up -d

# Run tests against it
pnpm test:e2e   # check package.json for exact script name
```

The `docker-compose.yml` for cubensis-connect points `BROWSER_NODE_URL` at `http://dcc-private-node:6869` automatically.

---

## Full startup sequence (TL;DR)

Run these in order, each in its own terminal tab:

```bash
# One-time setup — create shared Docker network
docker network create dcc-net 2>/dev/null || true

# Terminal 1 — node (run from Ecosystem/DecentralChain; see Step 1 above for why)
docker run -d --name dcc-private-node --network dcc-net \
  -p 6869:6869 -p 6860:6860 -p 6881:6881 \
  -v "$(pwd)/docker/private-node/decentralchain.custom.conf:/etc/dcc/dcc.conf:ro" \
  -v "$(pwd)/docker/private-node/local.conf:/etc/dcc/local.conf:ro" \
  -e DCC_WALLET_SEED="dcc private node seed with dcc tokens" \
  -e DCC_WALLET_PASSWORD="test" \
  -e DCC_REST_API_BIND="0.0.0.0" \
  ghcr.io/decentral-america/node-scala:latest

# Terminal 2 — postgres
docker run -d --name dcc-postgres --network dcc-net -p 5432:5432 \
  -e POSTGRES_DB=dcc -e POSTGRES_USER=dcc -e POSTGRES_PASSWORD=dcc_local \
  postgres:17-alpine

# Terminal 3 — bps migration then consumer
docker run --rm --network dcc-net \
  -e POSTGRES__HOST=dcc-postgres -e POSTGRES__DATABASE=dcc \
  -e POSTGRES__USER=dcc -e POSTGRES__PASSWORD=dcc_local \
  ghcr.io/decentral-america/blockchain-postgres-sync:latest ./migration up
docker run -d --name dcc-bps --network dcc-net -p 9090:9090 \
  -e POSTGRES__HOST=dcc-postgres -e POSTGRES__DATABASE=dcc \
  -e POSTGRES__USER=dcc -e POSTGRES__PASSWORD=dcc_local \
  -e BLOCKCHAIN_UPDATES_URL=http://dcc-private-node:6881 -e CHAIN_ID=82 \
  -e STARTING_HEIGHT=1 \
  ghcr.io/decentral-america/blockchain-postgres-sync:latest

# Terminal 4 — data-service (build first, then load env vars and start)
cd Ecosystem/DecentralChain && pnpm --filter @decentralchain/data-service... build
cd apps/data-service
set -a && source variables.env && set +a && pnpm dev

# Terminal 5 — exchange
cd Ecosystem/DecentralChain && pnpm --filter exchange dev

# Terminal 6 — scanner
cd Ecosystem/DecentralChain && \
  DCC_NODE_URL=http://localhost:6869 \
  DCC_DATA_SERVICE_URL=http://localhost:3000/v0 \
  pnpm --filter scanner dev
```

### One-command test stack (alternative)

For SDK integration tests only, use the pre-configured compose file:

```bash
cd Ecosystem/DecentralChain

# Start the test stack (node + postgres + BPS + data-service)
docker compose -f docker-compose.test.yml up -d --wait

# Run integration tests
pnpm nx run transactions:test:integration

# Tear down
docker compose -f docker-compose.test.yml down
```

---

## Ports reference

| Service | Port | Notes |
|---|---|---|
| node REST API | 6869 | Swagger at http://localhost:6869 |
| node P2P | 6860 | Only needed for peering |
| node BlockchainUpdates gRPC | 6881 | Required by BPS |
| PostgreSQL | 5432 | |
| blockchain-postgres-sync health | 9090 | `/health`, `/readiness` |
| data-service | 3000 | REST API for exchange data |
| exchange | 3333 | Vite dev server |
| scanner | 5173 | React Router dev server |

---

## Tear down

```bash
docker rm -f dcc-private-node dcc-postgres dcc-bps
docker network rm dcc-net
```

---

## Enabling BlockchainUpdates locally

> **Obsolete as of 2026-08-13.** This section assumed a separate "private" image that doesn't
> exist. The corrected Step 1 above already mounts `docker/private-node/local.conf`, which has
> `com.decentralchain.events.BlockchainUpdates` enabled on port 6881 by default — there's nothing
> further to do. Kept only in case a *different* base config (one that doesn't already include
> `local.conf`) needs the same extension enabled by hand: mount a `local.conf` with the block
> above at `/etc/dcc/local.conf` on `ghcr.io/decentral-america/node-scala:latest`, same as Step 1.

---

## Step 7 — Run GitHub Actions locally with act

[nektos/act](https://nektosact.com/) runs your `.github/workflows/` locally via Docker. Every repo in `Ecosystem/` has an `.actrc` preconfigured for macOS ARM64.

### Install

```bash
brew install act
act --version   # 0.2.88+
```

### First-time setup: secrets

Each repo has a `.secrets.example` template. Copy and fill with real values:

```bash
cd Ecosystem/DecentralChain
cp .secrets.example .secrets
# Edit .secrets — add your GitHub PAT, Codecov token, etc.
# .secrets is gitignored and NEVER committed.
```

For GITHUB_TOKEN, the easiest method is GitHub CLI:
```bash
act -s GITHUB_TOKEN="$(gh auth token)"
```

### Quick reference — running workflows

```bash
# List all workflows act can run
act -l

# List workflows for a specific event
act -l push
act -l pull_request

# Dry-run (no Docker containers, just plan)
act push -n

# Run all push-triggered workflows
act push

# Run a specific workflow file
act push -W .github/workflows/ci.yml

# Run a specific job within a workflow
act push -j ci
act push -j quality

# Run with secrets file
act push --secret-file .secrets

# Run pull_request event with simulated PR payload
act pull_request -e .github/act/pull_request.json

# Run workflow_dispatch (manual trigger)
act workflow_dispatch

# Run workflow_dispatch with inputs
act workflow_dispatch --input network=testnet
```

### Per-repo cheatsheet

| Repo | Recommended first test | Command |
|------|----------------------|---------|
| DecentralChain | Monorepo CI (lint + test + build) | `cd Ecosystem/DecentralChain && act push -j ci` |
| matcher | Compile + unit tests | `cd Ecosystem/matcher && act push -j quality` |
| node-scala | Build | `cd Ecosystem/node-scala && act push -j build` |
| infra | Validate (tofu + docker compose + shellcheck) | `cd Ecosystem/infra && act push` |
| docs | GitHub Pages build | `cd Ecosystem/docs && act push` |

### What `.actrc` configures

Each repo's `.actrc` sets:

| Flag | Value | Why |
|------|-------|-----|
| `-P ubuntu-latest=` | `catthehacker/ubuntu:act-latest` | Medium-weight runner image with common tools |
| `--artifact-server-path` | `/tmp/act-artifacts` | Enables upload/download-artifact actions |
| `--pull=false` | (flag) | Uses cached Docker images — no network needed |
| `--action-offline-mode` | (flag) | Caches actions for offline use after first run |
| `-P macos-latest=-self-hosted` | (DecentralChain only) | groth16 native build runs natively on your Mac |

### Known limitations

| Limitation | Impact | Workaround |
|---|---|---|
| `services:` containers | Not natively supported by act | Use `docker run` in step (already done in our workflows) |
| Cross-repo checkout | Needs real `GHCR_TOKEN` for private repos | Set in `.secrets` or pass via `gh auth token` — **verified working** |
| `actions/cache` | Works but slower than GitHub-hosted | Use `--action-offline-mode` to skip re-downloading actions |
| SARIF upload to Security tab | `github/codeql-action/upload-sarif` needs real token | Skip with `if: ${{ !env.ACT }}` (already no-ops locally) |
| Docker-in-Docker | OWASP dep-check `docker run` inside act container | Mount Docker socket: `act push --container-options "--privileged -v /var/run/docker.sock:/var/run/docker.sock"` |
| `apt-get install` packages | Medium runner image lacks some packages (e.g. `shellcheck`) | Use full image: `-P ubuntu-latest=catthehacker/ubuntu:full-latest` (18GB) or install from binary |
| `pnpm/action-setup` + `actions/setup-node` | DCC CI: pnpm PATH change makes `node` unfindable by setup-node | Run DCC monorepo quality gates natively: `pnpm nx affected -t biome-lint build typecheck test` |
| sbt project compilation time | Matcher/node-scala CI take 30-60 min in Docker | Run `sbt compile test` natively; use act only to validate checkout + setup |
| wasm-pack x86_64 binary | DCC CI downloads linux-musl x86_64 binary; fails on ARM64 | Build crypto package natively: `cd packages/sdk/crypto && wasm-pack build` |
| Full runner image (18GB) | `catthehacker/ubuntu:full-latest` matches GitHub exactly | Only use if medium image is insufficient: `-P ubuntu-latest=catthehacker/ubuntu:full-latest` |

### Skipping steps locally

Any step can be skipped during local testing by checking the `ACT` env var:

```yaml
- name: Upload to Codecov
  if: ${{ !env.ACT }}
  uses: codecov/codecov-action@v6
```

Any job can be skipped with an event property:

```yaml
jobs:
  deploy:
    if: ${{ !github.event.act }}
```

Then run with: `act push -e .github/act/push.json` (the event file sets `"act": true`).

---

## Known limitations

| Limitation | Impact | Workaround |
|---|---|---|
| No DEX matcher locally | Exchange orderbook/matching doesn't work | Use testnet matcher URL or skip |
| Private chain data starts from block 0 | Scanner/explorer has no tx history initially | Send test transactions via API |
| BPS must start from genesis (`STARTING_HEIGHT=0`) | First startup indexes from block 1 | Wait a few seconds — blocks come every 10s |
| `variables.env` is gitignored | Each developer creates their own | Template is in `variables.env.example` (if it exists) |
