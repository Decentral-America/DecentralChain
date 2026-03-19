# DecentralChain Scanner — Operations Runbook

> **Applies to**: `apps/scanner` (React Router 7 SSR, Node.js runtime)
> **Node requirement**: ≥ 24
> **Container image**: multi-stage Docker build → Node.js 24 Alpine

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Pre-Deploy Checklist](#pre-deploy-checklist)
3. [Build](#build)
4. [Deploy](#deploy)
5. [Post-Deploy Verification](#post-deploy-verification)
6. [Health Check](#health-check)
7. [Rollback](#rollback)
8. [Network Variants](#network-variants)
9. [Monitoring & Alerting](#monitoring--alerting)
10. [Incident Response](#incident-response)
11. [Common Issues](#common-issues)

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | Port the SSR server listens on |
| `DCC_NODE_URL` | `https://mainnet-node.decentralchain.io` | DecentralChain node RPC endpoint |
| `DCC_MATCHER_URL` | `https://mainnet-matcher.decentralchain.io` | DEX matcher endpoint (orderbook) |
| `DCC_DATA_SERVICE_URL` | `https://data-service.decentralchain.io/v0` | Data service (pair info, aggregates) |
| `VITE_SENTRY_DSN` | _(empty)_ | Sentry DSN — leave empty to disable error reporting |

All variables have safe defaults. Override only what differs from mainnet.

---

## Pre-Deploy Checklist

Run this before every production deploy:

```bash
# 1. From monorepo root — ensure workspace is consistent
pnpm install --frozen-lockfile

# 2. Validate module boundaries
node scripts/check-boundaries.mjs

# 3. Lint
pnpm nx run scanner:biome-lint

# 4. Type-check
pnpm nx run scanner:typecheck

# 5. Unit tests
pnpm nx run scanner:test

# 6. Build and verify artifact
pnpm nx run scanner:build
node -e "const fs=require('fs'); if(!fs.existsSync('apps/scanner/build/server/index.js')) { console.error('BUILD ARTIFACT MISSING'); process.exit(1); } console.log('OK');"

# 7. Security audit
cd apps/scanner && npm audit --audit-level=high
```

Or run the full gate in one command (from `apps/scanner/`):

```bash
npm run release:gate
```

---

## Build

### Local / CI build

```bash
# From monorepo root
pnpm nx run scanner:build
# Output: apps/scanner/build/
#   build/client/   — static assets served by the SSR handler
#   build/server/   — Node.js SSR bundle (entry: build/server/index.js)
```

### Docker build

```bash
cd apps/scanner

# Build image
docker build -t decentralchain/scanner:latest .

# Tag for a specific version
docker build -t decentralchain/scanner:v1.2.3 .
```

The Dockerfile is a two-stage build:
1. **build stage** — installs deps with `npm ci --ignore-scripts`, runs `npm run build`
2. **runtime stage** — copies only `build/`, `node_modules/`, `package.json`; runs as non-root `scanner` user

---

## Deploy

### Docker Compose (recommended for single-host)

```bash
# Start (or restart) the container
docker compose up -d --force-recreate

# Override network endpoints (e.g. testnet)
DCC_NODE_URL=https://testnet-node.decentralchain.io \
  docker compose up -d --force-recreate
```

### Manual Docker run

```bash
docker run -d \
  --name scanner \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DCC_NODE_URL=https://mainnet-node.decentralchain.io \
  -e DCC_MATCHER_URL=https://mainnet-matcher.decentralchain.io \
  decentralchain/scanner:latest
```

### Kubernetes (example)

```yaml
env:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: "3000"
  - name: DCC_NODE_URL
    valueFrom:
      configMapKeyRef:
        name: scanner-config
        key: node_url
livenessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 30
readinessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
```

---

## Post-Deploy Verification

After deploying, verify these manually or via a smoke script:

```bash
BASE=http://localhost:3000

# 1. Homepage renders (SSR)
curl -sf "$BASE/" | grep -q "DecentralChain" && echo "✓ homepage" || echo "✗ homepage"

# 2. Blocks page
curl -sf "$BASE/blocks" | grep -q "<" && echo "✓ /blocks" || echo "✗ /blocks"

# 3. Network page
curl -sf "$BASE/network" | grep -q "<" && echo "✓ /network" || echo "✗ /network"

# 4. Asset route (deep-link)
curl -sf "$BASE/asset" | grep -q "<" && echo "✓ /asset" || echo "✗ /asset"
```

Expected: all return HTTP 200 with HTML content.

---

## Health Check

The `docker-compose.yml` configures a built-in health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

Check container health:

```bash
docker inspect scanner --format='{{.State.Health.Status}}'
# Expected: "healthy"
```

**Unhealthy** means the SSR server is not responding. Check logs:

```bash
docker logs scanner --tail=100
```

---

## Rollback

### Docker Compose rollback

```bash
# Tag the current "good" image before deploying
docker tag decentralchain/scanner:latest decentralchain/scanner:prev

# On rollback — restore prev tag
docker tag decentralchain/scanner:prev decentralchain/scanner:latest
docker compose up -d --force-recreate
```

### Image-tag rollback

```bash
# Roll back to a specific version
docker compose down
docker run -d \
  --name scanner \
  --restart unless-stopped \
  -p 3000:3000 \
  decentralchain/scanner:v1.2.2   # ← previous known-good version
```

### Git rollback

If the issue is in source code:

```bash
# Identify last good commit
git log --oneline apps/scanner/

# Revert the bad commit
git revert <bad-commit-sha>

# Re-run the full release gate
cd apps/scanner && npm run release:gate

# Rebuild and redeploy
docker build -t decentralchain/scanner:latest .
docker compose up -d --force-recreate
```

---

## Network Variants

| Network | Node URL | Matcher URL |
|---|---|---|
| **Mainnet** | `https://mainnet-node.decentralchain.io` | `https://mainnet-matcher.decentralchain.io` |
| **Testnet** | `https://testnet-node.decentralchain.io` | `https://testnet-matcher.decentralchain.io` |
| **Stagenet** | `https://stagenet-node.decentralchain.io` | `https://stagenet-matcher.decentralchain.io` |

Deploy testnet instance:

```bash
docker run -d \
  --name scanner-testnet \
  -p 3001:3000 \
  -e DCC_NODE_URL=https://testnet-node.decentralchain.io \
  -e DCC_MATCHER_URL=https://testnet-matcher.decentralchain.io \
  decentralchain/scanner:latest
```

---

## Monitoring & Alerting

### Sentry (Error Tracking)

Set `VITE_SENTRY_DSN` to enable. Sentry captures:
- Runtime JavaScript errors (client-side)
- SSR handler errors
- Slow API calls (via Sentry performance)

```bash
# Enable on deploy
docker run -e VITE_SENTRY_DSN="https://your-dsn@sentry.io/project" ...
```

### Key Metrics to Watch

| Metric | Warning Threshold | Critical Threshold |
|---|---|---|
| HTTP error rate (5xx) | > 1% | > 5% |
| Response time (p95) | > 2s | > 5s |
| Container restart count | > 1/hour | > 5/hour |
| Node API reachability | any failure | 3 consecutive |

### Log Aggregation

The app writes structured logs to stdout/stderr. Collect via:

```bash
# Docker log driver (e.g. to Loki)
docker run --log-driver=loki \
  --log-opt loki-url="http://loki:3100/loki/api/v1/push" \
  decentralchain/scanner:latest
```

---

## Incident Response

### Scanner returns 500 on all pages

1. Check container logs: `docker logs scanner --tail=50`
2. Verify node API is reachable: `curl -sf $DCC_NODE_URL/blocks/height`
3. Verify matcher is reachable: `curl -sf $DCC_MATCHER_URL/matcher/orderbook`
4. If SSR bundle is corrupted → rollback (see [Rollback](#rollback))

### Blank page / client-side error

1. Check browser console for JS errors
2. Check Sentry for exception reports
3. Verify build artifacts are intact: `ls apps/scanner/build/server/ apps/scanner/build/client/`
4. Redeploy from a known-good image tag

### High memory / CPU

The SSR server is single-process. For high traffic:
1. Scale horizontally behind a load balancer
2. Each instance is stateless — safe to run multiple containers on different ports
3. Shared nothing — no session state, no database

### Node API unreachable

The scanner performs read-only calls to the DCC node. If the node is down:
- Pages will show error states (no data)
- SSR renders error boundaries (gracefully degraded, not a blank page)
- Fix: restore node connectivity or point to a different node via `DCC_NODE_URL`

---

## Common Issues

### `build/server/index.js` not found

```
Error: ENOENT: no such file or directory, open 'build/server/index.js'
```

Cause: build did not run, or ran in SPA mode (`ssr: false`).

Fix:
```bash
# Verify react-router.config.ts has ssr: true
grep "ssr" apps/scanner/react-router.config.ts

# Re-run build
pnpm nx run scanner:build
```

### Docker container exits immediately

Check for startup errors:
```bash
docker logs scanner
```

Typically caused by:
- Missing `node_modules` in the runtime image (copy from build stage)
- Wrong `build/server/index.js` path in CMD
- Non-root user lacking read permissions on `/app`

### `react-router-serve` not found

```
sh: react-router-serve: not found
```

The `node_modules/.bin/react-router-serve` must be present in the runtime image.

In `Dockerfile`, ensure `node_modules` is copied from the build stage:
```dockerfile
COPY --from=build /app/node_modules ./node_modules
```

### Permission denied errors

The container runs as non-root user `scanner`. Ensure:
```dockerfile
RUN chown -R scanner:scanner /app
USER scanner
```

The `read_only: true` in docker-compose + `/tmp` tmpfs handles write needs.
