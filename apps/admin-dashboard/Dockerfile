# ── Stage 1: Build ──────────────────────────────────────────────────────────
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# The base image's bundled npm ships sigstore@4.1.0 (CVE-2026-48815, HIGH).
# npm itself isn't used at runtime (pnpm + react-router-serve), but Trivy scans
# the whole final image, and this stage is FROM'd by the runtime stage below —
# upgrade npm to pull in a patched sigstore rather than chase a new base digest.
RUN npm install -g npm@latest

# -----------------------------------------------------------------------------
# Workspace manifests: the package.json of every app and of e2e, nothing else.
# pnpm-lock.yaml records every workspace project, and pnpm 12 refuses a frozen
# install when a recorded project's package.json is missing. Copying only the
# manifests keeps the install valid without pulling the other apps' sources, and
# this stage's output changes only when a manifest does, so the cache holds.
# -----------------------------------------------------------------------------
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS manifests
WORKDIR /src
COPY apps ./apps
COPY e2e ./e2e
RUN for f in apps/*/package.json e2e/package.json; do \
      mkdir -p "/out/${f%/*}" && cp "$f" "/out/$f"; \
    done

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
# Every workspace manifest first (see the manifests stage), then this app's source.
COPY --from=manifests /out/ ./
COPY apps/admin-dashboard ./apps/admin-dashboard

RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile \
      --filter . --filter './packages/**' --filter ./apps/admin-dashboard
RUN cd apps/admin-dashboard && pnpm react-router typegen

RUN pnpm nx run admin-dashboard:build --skip-nx-cache
RUN pnpm --filter admin-dashboard --prod deploy --legacy /prod/admin-dashboard \
    && cp -R apps/admin-dashboard/build /prod/admin-dashboard/build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM base AS runtime

RUN apk upgrade --no-cache libcrypto3 libssl3

# npm is only needed in the build stage (it's inherited from `base`, which patches
# its bundled sigstore CVE) -- runtime uses pnpm's deployed node_modules directly
# via react-router-serve and never invokes npm. Remove it here rather than track
# CVEs in npm's own vendored deps (e.g. brace-expansion, ip-address), which pnpm
# overrides in pnpm-workspace.yaml can't reach since they aren't part of our
# dependency graph.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

RUN addgroup -S admindash && adduser -S -G admindash admindash

WORKDIR /app

COPY --from=build /prod/admin-dashboard ./

RUN chown -R admindash:admindash /app
USER admindash

# Network-neutral runtime defaults only. Per-network values (ADMIN_DASHBOARD_URL,
# ADMIN_DASHBOARD_SCANNER_URL, DCC_NODE_URL, ADMIN_DASHBOARD_PG_DATABASE) come from
# the deploy's env file; the server refuses to start in production without them,
# so a mainnet deploy can never silently run against testnet.
ENV NODE_ENV=production \
    PORT=3001 \
    ADMIN_DASHBOARD_GITHUB_ORG="Decentral-America" \
    DCC_LOAD_TESTER_PATH="/opt/dcc/load-tester" \
    DCC_WALLET_CSV_PATH="/opt/dcc/test-wallets.csv" \
    E2E_SUITE_PATH="/opt/dcc/DecentralChain" \
    LOG_LEVEL="info"
    # Secret vars below are injected at runtime via env_file — never baked into the image:
    # ADMIN_DASHBOARD_GITHUB_PAT          — fine-grained PAT: Actions:Read, Contents:Read on Decentral-America/*
    # GRAFANA_URL               — Grafana dashboard base URL
    # SENTRY_AUTH_TOKEN         — Sentry org auth token (read-only)
    # TREASURY_SEED             — dedicated treasury wallet seed for the Load Test page's
    #                             auto-fund/auto-sweep; used only when the UI's own seed
    #                             field is left blank (see api.treasury.fund.ts / .stream.ts)

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
