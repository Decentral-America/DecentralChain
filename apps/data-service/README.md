# DecentralChain Data Service

A high-performance read API for the DecentralChain blockchain. Provides HTTP endpoints for querying transactions, candles, pairs, rates, and market data — backed by a PostgreSQL database synchronised via [blockchain-postgres-sync](../../blockchain-postgres-sync).

## API base URLs

| Network | URL |
|---------|-----|
| Mainnet | `https://api.decentral.exchange` |
| Testnet | `https://api.testnet.decentral.exchange` |

## Local development

### Prerequisites

- Node.js ≥ 24
- pnpm ≥ 10
- PostgreSQL 15+

### Setup

```sh
# Install dependencies from the monorepo root
pnpm install

# Build SDK packages the service depends on
pnpm --filter @decentralchain/data-service... build

# Copy and edit environment variables
cp apps/data-service/variables.env.example apps/data-service/variables.env
# Edit variables.env with your local PostgreSQL connection details
```

### Run

```sh
# Start the API server
cd apps/data-service
pnpm start

# Start the pairs daemon (optional — needed for /matchers/*/pairs endpoints)
pnpm pairs
```

The API server listens on `http://localhost:3000` by default. Override via `PORT` env var.

### Tests

```sh
cd apps/data-service

# Unit tests (no database required)
pnpm test

# Integration tests (requires a live PostgreSQL database)
# Set up variables.env with DB connection details first
pnpm test:i
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PGHOST` | ✅ | PostgreSQL host |
| `PGPORT` | ✅ | PostgreSQL port (default 5432) |
| `PGDATABASE` | ✅ | Database name |
| `PGUSER` | ✅ | Database user |
| `PGPASSWORD` | ✅ | Database password |
| `PORT` | — | HTTP listen port (default 3000) |
| `LOG_LEVEL` | — | Log verbosity: `error`, `warn`, `info`, `debug` (default `info`) |
| `DOCS_URL` | — | Custom docs URL returned by `GET /` |
| `NODE_ENV` | — | Set to `production` in production deployments |

## Docker

Build and run from the monorepo root:

```sh
# Build the production image
docker build -f apps/data-service/Dockerfile -t decentralchain/data-service:latest .

# Run the API server
docker run -d \
  --name dcc-data-service \
  -p 3000:3000 \
  -e PGHOST=<host> \
  -e PGPORT=5432 \
  -e PGDATABASE=dcc \
  -e PGUSER=dcc \
  -e PGPASSWORD=<password> \
  decentralchain/data-service:latest

# Run the pairs daemon
docker run -d \
  --name dcc-pairs-daemon \
  -e PGHOST=<host> \
  -e PGPORT=5432 \
  -e PGDATABASE=dcc \
  -e PGUSER=dcc \
  -e PGPASSWORD=<password> \
  decentralchain/data-service:latest \
  node dist/daemons/pairs/index.mjs
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service version and metadata |
| `GET` | `/transactions/exchange` | Exchange transactions |
| `GET` | `/candles/{amountAsset}/{priceAsset}` | OHLCV candle data |
| `GET` | `/pairs` | Active trading pairs |
| `GET` | `/matchers` | Known matchers |
| `GET` | `/matchers/{address}/pairs` | Pairs for a specific matcher |
| `GET` | `/matchers/{address}/tickers` | Tickers for a specific matcher |
| `GET` | `/rates` | Asset exchange rates |

Full OpenAPI specification: see `docs/swagger.json` or run the service and visit `/docs`.

## Architecture

```
PostgreSQL ← blockchain-postgres-sync ← DecentralChain node
                      ↑
           apps/data-service (this service)
                      ↑
                 HTTP clients
```

The data service is read-only. It never writes to PostgreSQL. The `blockchain-postgres-sync` service handles all writes.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.
