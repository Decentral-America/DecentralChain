# blockchain-postgres-sync

A high-performance blockchain-to-PostgreSQL sync daemon for the **DecentralChain** network.

Subscribes to a node's gRPC Blockchain Updates API, processes block and microblock events in real time, and persists structured data (assets, transactions, candles) into PostgreSQL for use by data services, explorers, and analytics.

**Current testnet image:** `fbece975a` — type-19 (CommitToGeneration) enabled, gRPC dedup+upsert fix applied, Loader.scala re-seek bug fixed. Deployed and healthy.

[![CI](https://github.com/Decentral-America/blockchain-postgres-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/blockchain-postgres-sync/actions/workflows/ci.yml)

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
| **19** | **CommitToGeneration** | **`txs_19`** | DCC-original — T2 HotStuff generator commitment; migration `20260628000000` |

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

### Required

| Variable | Description |
|---|---|
| `BLOCKCHAIN_UPDATES_URL` | gRPC endpoint of the DCC node, e.g. `http://node:6881` |
| `CHAIN_ID` | Network byte (`63` = Mainnet, `33` = Testnet, `83` = Stagenet) |
| `STARTING_HEIGHT` | Block height to begin sync from (use `0` for genesis) |
| `HOST` | PostgreSQL host |
| `DATABASE` | PostgreSQL database name |
| `USER` | PostgreSQL username |
| `PASSWORD` | PostgreSQL password |

### Optional

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5432` | PostgreSQL port |
| `POOLSIZE` | `1` | PostgreSQL connection pool size |
| `ASSETS_ONLY` | `false` | When `true`, skip transaction indexing |
| `ASSET_STORAGE_ADDRESS` | — | Address of the asset storage contract (for oracle data) |
| `UPDATES_PER_REQUEST` | `256` | gRPC batch size |
| `MAX_WAIT_TIME_IN_MSECS` | `5000` | Max wait for a gRPC response before retry |
| `START_ROLLBACK_DEPTH` | `1` | How many blocks back to roll back on start |
| `ROLLBACK_STEP` | `500` | Blocks per rollback step |
| `METRICS_PORT` | `9090` | Port for the health/readiness HTTP endpoint |

---

## Docker

### Build

```bash
docker build -t blockchain-postgres-sync .
```

### Run

```bash
docker run --rm \
  -e BLOCKCHAIN_UPDATES_URL=http://node:6881 \
  -e CHAIN_ID=63 \
  -e STARTING_HEIGHT=0 \
  -e HOST=postgres \
  -e DATABASE=blockchain \
  -e USER=postgres \
  -e PASSWORD=secret \
  blockchain-postgres-sync

# Testnet (chain ID `!` = byte 33):
docker run --rm \
  -e BLOCKCHAIN_UPDATES_URL=http://node:6881 \
  -e CHAIN_ID=33 \
  -e STARTING_HEIGHT=0 \
  -e HOST=postgres \
  -e DATABASE=bps_testnet \
  -e USER=postgres \
  -e PASSWORD=secret \
  blockchain-postgres-sync
```

### With Docker Compose

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: blockchain
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret

  migration:
    image: blockchain-postgres-sync
    command: migration
    environment:
      HOST: postgres
      DATABASE: blockchain
      USER: postgres
      PASSWORD: secret
    depends_on: [postgres]

  consumer:
    image: blockchain-postgres-sync
    environment:
      BLOCKCHAIN_UPDATES_URL: http://node:6881
      CHAIN_ID: 63
      STARTING_HEIGHT: 0
      HOST: postgres
      DATABASE: blockchain
      USER: postgres
      PASSWORD: secret
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

### Security audit

```bash
cargo audit
```

---

## CI

GitHub Actions runs on every push and pull request to `main`:

1. `cargo fmt` — formatting check
2. `cargo build` — compilation
3. `cargo clippy -- -D warnings` — zero warnings policy
4. `cargo test` — full test suite
5. `cargo audit --deny warnings` — blocks on any known vulnerability
6. Docker image build (smoke test, main branch only)

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
