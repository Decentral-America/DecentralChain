# websocket-api

Real-time WebSocket gateway for DecentralChain. Clients subscribe to topics and
receive the current value (`subscribed`) and every change (`update`).

Data flow: node → blockchain-postgres-sync (BPS) → Redis (`SET` + `PUBLISH` on
`topic://...`, plus the key index `topic://state-index/<address>`) →
websocket-api (`PSUBSCRIBE topic://*`) → clients.

Endpoint: `GET /ws` (testnet: `wss://testnet-ws.decentralchain.io/ws`).
Health: `GET /health` (Redis ping). Metrics: `GET /metrics`.

## Topics

| Topic | Value |
|---|---|
| `topic://state/<address>/<key>` | Current data-entry value (JSON) |
| `topic://state?address__in[]=<a>&key__match_any[]=<pattern>` | JSON array of the current values of every matching key; new matching keys arrive as `update` frames. `*` is the only wildcard. At most 20 addresses, 20 patterns and 1000 resolved keys. |
| `topic://transactions?type=all&address=<address>` | Each confirmed transaction involving the address (no initial value) |

Multi-topics are resolved through the per-address key index that BPS maintains
in Redis (`topic://state-index/<address>`).

## Messages

Client → server: `{"type":"subscribe","topic":"..."}`, `{"type":"unsubscribe","topic":"..."}`,
`{"type":"pong","message_number":N}`. Messages larger than 64 KiB are rejected.

Server → client: `subscribed`, `update`, `unsubscribed`, `ping`, `error`.

Error codes: `1` invalid message, `2` already subscribed, `3` invalid topic,
`4` subscription limit exceeded.

## Limits

- **Connections:** `MAX_CONNECTIONS` globally (HTTP 503 beyond) and
  `MAX_CONNECTIONS_PER_IP` per client (HTTP 429 beyond). The per-IP value must
  be between 1 and `MAX_CONNECTIONS`, otherwise the service refuses to start.
  The per-IP default is 50, so **setting `MAX_CONNECTIONS` below 50 requires
  lowering `MAX_CONNECTIONS_PER_IP` too.**
- **Client address:** the service runs on the host network behind a reverse
  proxy on the same host. `X-Real-IP` (then the last `X-Forwarded-For` entry) is
  trusted only when the TCP peer is loopback; any other peer is accounted by its
  own address.
- **Subscriptions per connection:** `MAX_SUBSCRIPTIONS_PER_CLIENT` direct
  subscriptions, and `MAX_INDIRECT_SUBTOPICS_PER_CLIENT` keys reached through
  multi-topics (error code 4 beyond either).
- **Multi-topic size:** at most 20 addresses, 20 key patterns and 1000 resolved keys.
- **Resolution load:** at most `MULTITOPIC_RESOLVE_CONCURRENCY` multi-topic
  resolutions run against Redis at once.

## Configuration (environment)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Listen port (deployments use `8081`, behind Caddy) |
| `MAX_CONNECTIONS` | `10000` | Global connection cap |
| `MAX_CONNECTIONS_PER_IP` | `50` | Per-client-IP cap; must be `<= MAX_CONNECTIONS` |
| `MAX_SUBSCRIPTIONS_PER_CLIENT` | `500` | Direct subscriptions per connection |
| `MAX_INDIRECT_SUBTOPICS_PER_CLIENT` | `5000` | Multi-topic-resolved keys per connection (1 to 100000) |
| `MULTITOPIC_RESOLVE_CONCURRENCY` | `8` | Concurrent multi-topic resolutions (1 to 256) |
| `SHARD_COUNT` | `20` | Client-map shards |
| `GRACEFUL_SHUTDOWN_DURATION_SECONDS` | `25` | Drain window on SIGTERM |
| `CLIENT_PING_INTERVAL_IN_SECS` / `CLIENT_PING_FAILURES_THRESHOLD` | `30` / `3` | Keep-alive |
| `REPO__HOST`, `REPO__PORT`, `REPO__USERNAME`, `REPO__PASSWORD` | —, `6379` | Redis connection |
| `REPO__KEY_TTL`, `REPO__MAX_POOL_SIZE`, `REPO__REFRESH_THREADS` | `60`, `10`, `1` | Subscription-marker TTL (10 to 86400 s) and pool |

## Build and test

    cargo build --locked
    cargo test --locked

`Cargo.lock` is committed; images and CI build with `--locked`.

## Deployment

`deploy-websocket-api.yml` deploys only commits that are on `main`; the image build runs the Rust test suite first.
