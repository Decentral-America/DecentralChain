# blockchain-postgres-sync

A high-performance blockchain-to-PostgreSQL sync daemon for the **DecentralChain** network.

Subscribes to a node's gRPC Blockchain Updates API, processes block and microblock events in real time, and persists structured data (assets, transactions, candles) into PostgreSQL for use by data services, explorers, and analytics.

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
 axum health server  (GET /health)
```

The `migration` binary runs Diesel migrations against the database before the consumer starts.

---

## Binaries

| Binary | Purpose |
|---|---|
| `consumer` | Main daemon — subscribes to gRPC updates and writes to PostgreSQL |
| `migration` | One-shot: applies pending Diesel database migrations |

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `BLOCKCHAIN_UPDATES_URL` | gRPC endpoint of the DCC node, e.g. `http://node:6887` |
| `CHAIN_ID` | Network byte (`84` = Testnet, `76` = Mainnet) |
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
  -e BLOCKCHAIN_UPDATES_URL=http://node:6887 \
  -e CHAIN_ID=76 \
  -e STARTING_HEIGHT=0 \
  -e HOST=postgres \
  -e DATABASE=blockchain \
  -e USER=postgres \
  -e PASSWORD=secret \
  blockchain-postgres-sync
```

### With Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
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
      BLOCKCHAIN_UPDATES_URL: http://node:6887
      CHAIN_ID: 76
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
