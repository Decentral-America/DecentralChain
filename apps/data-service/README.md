# DecentralChain Data Service

A high-performance read API for the DecentralChain blockchain. Provides HTTP endpoints for querying transactions, candles, pairs, rates, and market data — backed by a PostgreSQL database synchronised via [blockchain-postgres-sync](../../blockchain-postgres-sync).

## API base URLs

| Network | URL |
|---------|-----|
| Testnet | `https://testnet-data-service.decentralchain.io/v0` |
| Mainnet | See the network page of the DecentralChain docs |

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

The API server listens on `http://localhost:3000` by default (override with `PORT`; deployments use `PORT=8080` behind Caddy).

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
| `PORT` | — | HTTP listen port (default 3000; 8080 in deployments) |
| `PGSTATEMENTTIMEOUT` | — | Postgres statement timeout in ms (default 25000; `0` or `false` disables) |
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

The API never writes to PostgreSQL and should connect with a read-only role (`dcc_ro`). The pairs daemon (`dist/daemons/pairs/index.mjs`) is the only writer: it truncates and refills the `pairs` table (role `dcc_pairs`). All other writes come from `blockchain-postgres-sync`.

On `SIGTERM` the API stops accepting connections, lets in-flight requests finish, then exits. The rate limiter keys clients by `X-Real-IP`, trusted only when the TCP peer is loopback (the Caddy proxy on the same host); any other peer is keyed by its own address.

Deployment (`deploy-data-service.yml`) is limited to commits on `main` with a green `ci.yml` run.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.
