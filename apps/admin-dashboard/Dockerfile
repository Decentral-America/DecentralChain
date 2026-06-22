# ── Stage 1: Build ──────────────────────────────────────────────────────────
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:156b55f92e98ccd5ef49578a8cea0df4679826564bad1c9d4ef04462b9f0ded6 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
RUN apk add --no-cache git curl build-base

# Rust toolchain — required for @decentralchain/crypto wasm build
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --profile minimal --no-modify-path
ENV PATH="/root/.cargo/bin:$PATH"
RUN rustup target add wasm32-unknown-unknown

# wasm-pack v0.15.0 musl binary
RUN curl -fsSL \
    https://github.com/wasm-bindgen/wasm-pack/releases/download/v0.15.0/wasm-pack-v0.15.0-x86_64-unknown-linux-musl.tar.gz \
    | tar xz -C /tmp && \
    mv /tmp/wasm-pack-v0.15.0-x86_64-unknown-linux-musl/wasm-pack /usr/local/bin/wasm-pack && \
    rm -rf /tmp/wasm-pack-v0.15.0-x86_64-unknown-linux-musl

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json biome.json tsconfig.base.json .node-version ./
COPY vitest.base.config.ts ./
COPY scripts ./scripts
COPY tools ./tools
COPY packages ./packages
COPY apps/admin-dashboard ./apps/admin-dashboard

RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile
RUN cd apps/admin-dashboard && pnpm react-router typegen

RUN pnpm nx run admin-dashboard:build --skip-nx-cache
RUN pnpm --filter admin-dashboard --prod deploy --legacy /prod/admin-dashboard \
    && cp -R apps/admin-dashboard/build /prod/admin-dashboard/build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM base AS runtime

RUN apk upgrade --no-cache libcrypto3 libssl3

RUN addgroup -S admindash && adduser -S -G admindash admindash

WORKDIR /app

COPY --from=build /prod/admin-dashboard ./

RUN chown -R admindash:admindash /app
USER admindash

# Non-secret runtime configuration — safe to bake as ENV defaults.
# Secret values (OAuth credentials, JWT secret) are injected at runtime
# via the host env_file; they are NOT set here to avoid leaking into image layers.
ENV NODE_ENV=production \
    PORT=3001 \
    ADMIN_DASHBOARD_URL="https://testnet-admin.decentralchain.io" \
    DCC_NODE_URL=https://testnet-node.decentralchain.io \
    ADMIN_DASHBOARD_SCANNER_URL=https://testnet-scanner.decentralchain.io \
    ADMIN_DASHBOARD_GITHUB_ORG="Decentral-America" \
    DCC_LOAD_TESTER_PATH="/opt/dcc/load-tester" \
    DCC_WALLET_CSV_PATH="/opt/dcc/test-wallets.csv" \
    E2E_SUITE_PATH="/opt/dcc/DecentralChain" \
    ADMIN_DASHBOARD_PG_DATABASE="admin_testnet" \
    LOG_LEVEL="info"
    # Secret vars below are injected at runtime via env_file — never baked into the image:
    # ADMIN_DASHBOARD_GITHUB_PAT          — fine-grained PAT: Actions:Read, Contents:Read on Decentral-America/*
    # BACKUP_OBJ_ACCESS_KEY     — Cloudflare R2 access key for backup bucket
    # BACKUP_OBJ_SECRET_KEY     — Cloudflare R2 secret key
    # BACKUP_OBJ_BUCKET         — R2 bucket name (e.g. dcc-backups-testnet)
    # BACKUP_OBJ_ENDPOINT       — R2 S3-compatible endpoint URL
    # GRAFANA_URL               — Grafana dashboard base URL
    # SENTRY_AUTH_TOKEN         — Sentry org auth token (read-only)

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
