# blockchain-postgres-sync

A high-performance blockchain-to-PostgreSQL sync daemon for the **DecentralChain** network.

Subscribes to a node's gRPC Blockchain Updates API, processes block and microblock events in real time, and persists structured data (assets, transactions, candles) into PostgreSQL for use by data services, explorers, and analytics.

**Current testnet image:** `fbece975a` — type-19 (CommitToGeneration) enabled, gRPC dedup+upsert fix applied, Loader.scala re-seek bug fixed. Deployed and healthy.

[![CI](https://github.com/Decentral-America/DecentralChain/actions/workflows/bps.yml/badge.svg)](https://github.com/Decentral-America/DecentralChain/actions/workflows/bps.yml)

---

## Architecture

```
DCC Node (gRPC)
      │  BlockchainUpdates stream
      ▼
 consumer binary
      │  tokio async runtime
      ▼
  consumer loop  ──────► PostgreSQL (diesel + deadpool)
      │
      ▼
 axum health server  (GET /health, GET /readiness)
```

The `migration` binary runs Diesel migrations against the database before the consumer starts.

The health server exposes two endpoints:
- `GET /health` — returns `200 OK` when the process is running
- `GET /readiness` — validates the database connection pool; returns `200 OK` only when the pool is healthy

---

## Binaries

| Binary | Purpose |
|---|---|
| `consumer` | Main daemon — subscribes to gRPC updates and writes to PostgreSQL |
| `migration` | One-shot: applies pending Diesel database migrations |

---

## Supported Transaction Types

All standard Waves-protocol transaction types (1–18) plus the DCC-original:

| Type | Name | Table | Notes |
|------|------|-------|-------|
| 1–18 | Standard Waves-protocol types | `txs_1` – `txs_18` | Full coverage |
| **19** | **CommitToGeneration** | **`txs_19`** | DCC-original — T2 HotStuff generator commitment; migration `2026-06-28-000000_add_txs_19_commit_to_generation` |

---

## Production Fixes (2026-06-28)

### gRPC duplicate-block delivery (dedup + upsert)

The gRPC `BlockchainUpdates` stream can deliver the same block more than once under reconnect scenarios. Without protection this causes a unique-constraint violation and crashes the consumer.

**Fix:** `insert_blocks_or_microblocks` in `pg.rs` uses an `INSERT … ON CONFLICT DO UPDATE` (upsert) pattern combined with an in-process dedup set. Duplicate deliveries are silently absorbed.

### Loader.scala gRPC re-seek bug

The node-side `Loader.scala` tracks the height of the last block sent to gRPC subscribers using a RocksDB key. A bug caused it to re-read a stale height after rollbacks, re-seeking into already-delivered ranges and triggering the duplicate delivery above.

**Fix:** `Loader.scala` now tracks the actual RocksDB key height to prevent re-seek into gaps. Deployed in node image `v1.6.3-be2dcfc0`.

---

## Environment Variables

All variables are read via [`envy`](https://docs.rs/envy) with an explicit prefix per config
struct — `POSTGRES__` (double underscore) for database config, `BPS_` for consumer config.
Bare names like `HOST` or `CHAIN_ID` are **not** recognized at runtime.

### Required

| Variable | Description |
|---|---|
| `BPS_BLOCKCHAIN_UPDATES_URL` | gRPC endpoint of the DCC node, e.g. `http://node:6881` |
| `BPS_CHAIN_ID` | Network byte (`63` = Mainnet, `33` = Testnet, `83` = Stagenet) |
| `BPS_STARTING_HEIGHT` | Block height to begin sync from (use `0` for genesis) |
| `POSTGRES__HOST` | PostgreSQL host |
| `POSTGRES__DATABASE` | PostgreSQL database name |
| `POSTGRES__USER` | PostgreSQL username |
| `POSTGRES__PASSWORD` | PostgreSQL password |

### Optional

| Variable | Default | Description |
|---|---|---|
| `POSTGRES__PORT` | `5432` | PostgreSQL port |
| `POSTGRES__POOLSIZE` | `1` | PostgreSQL connection pool size |
| `BPS_ASSETS_ONLY` | `false` | When `true`, skip transaction indexing |
| `BPS_ASSET_STORAGE_ADDRESS` | — | Address of the asset storage contract (for oracle data) |
| `BPS_UPDATES_PER_REQUEST` | `256` | gRPC batch size |
| `BPS_MAX_WAIT_TIME_IN_MSECS` | `5000` | Max wait for a gRPC response before retry |
| `BPS_START_ROLLBACK_DEPTH` | `1` | How many blocks back to roll back on start |
| `BPS_ROLLBACK_STEP` | `500` | Blocks per rollback step |
| `BPS_METRICS_PORT` | `9090` | Port for the health/readiness HTTP endpoint |
| `BPS_REDIS_URL` | — | Optional Redis URL (`redis://:password@host:port/`) for pub/sub publishing; omit to disable |

---

## Docker

### Build

```bash
docker build -t blockchain-postgres-sync .
```

### Run

```bash
docker run --rm \
  -e BPS_BLOCKCHAIN_UPDATES_URL=http://node:6881 \
  -e BPS_CHAIN_ID=63 \
  -e BPS_STARTING_HEIGHT=0 \
  -e POSTGRES__HOST=postgres \
  -e POSTGRES__DATABASE=blockchain \
  -e POSTGRES__USER=postgres \
  -e POSTGRES__PASSWORD=secret \
  blockchain-postgres-sync

# Testnet (chain ID `!` = byte 33):
docker run --rm \
  -e BPS_BLOCKCHAIN_UPDATES_URL=http://node:6881 \
  -e BPS_CHAIN_ID=33 \
  -e BPS_STARTING_HEIGHT=0 \
  -e POSTGRES__HOST=postgres \
  -e POSTGRES__DATABASE=bps_testnet \
  -e POSTGRES__USER=postgres \
  -e POSTGRES__PASSWORD=secret \
  blockchain-postgres-sync
```

### With Docker Compose

```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: blockchain
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret

  migration:
    image: blockchain-postgres-sync
    command: migration
    environment:
      POSTGRES__HOST: postgres
      POSTGRES__DATABASE: blockchain
      POSTGRES__USER: postgres
      POSTGRES__PASSWORD: secret
    depends_on: [postgres]

  consumer:
    image: blockchain-postgres-sync
    environment:
      BPS_BLOCKCHAIN_UPDATES_URL: http://node:6881
      BPS_CHAIN_ID: 63
      BPS_STARTING_HEIGHT: 0
      POSTGRES__HOST: postgres
      POSTGRES__DATABASE: blockchain
      POSTGRES__USER: postgres
      POSTGRES__PASSWORD: secret
    depends_on: [migration]
```

---

## Development

### Prerequisites

- Rust stable (≥ 1.88)
- PostgreSQL ≥ 14
- `protoc` (protobuf compiler) — `brew install protobuf` / `apt install protobuf-compiler`
- `libpq` — `brew install libpq` / `apt install libpq-dev`
- `cargo-audit` — `cargo install cargo-audit --locked`

On macOS, set the library path before building:

```bash
export LIBRARY_PATH=/opt/homebrew/opt/libpq/lib
```

### Build

```bash
cargo build
```

### Test

```bash
cargo test
```

### Lint

```bash
cargo clippy --all-targets -- -D warnings
cargo fmt --all -- --check
```

### Dependency policy check

```bash
cargo deny check
```

---

## CI

`bps.yml` runs on every push and pull request touching this app:

1. `cargo fmt --all -- --check` — formatting check
2. `cargo build --all-targets` — compilation
3. `cargo clippy --all-targets -- -D warnings` — zero warnings policy
4. `cargo llvm-cov nextest` — full test suite with coverage, uploaded to Codecov
5. `cargo doc --no-deps --all-features` (with `RUSTDOCFLAGS="-D warnings"`) — doc build check
6. `cargo deny check` — dependency policy / license / advisory check
7. `cargo machete` — unused dependency check

Docker image build and deploy live in the separate `deploy-bps.yml` workflow, not in CI.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
