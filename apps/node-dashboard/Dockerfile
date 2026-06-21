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
COPY apps/node-dashboard ./apps/node-dashboard

RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile
RUN cd apps/node-dashboard && pnpm react-router typegen

RUN pnpm nx run node-dashboard:build --skip-nx-cache
RUN pnpm --filter node-dashboard --prod deploy --legacy /prod/node-dashboard \
    && cp -R apps/node-dashboard/build /prod/node-dashboard/build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM base AS runtime

RUN apk upgrade --no-cache libcrypto3 libssl3

RUN addgroup -S nodedash && adduser -S -G nodedash nodedash

WORKDIR /app

COPY --from=build /prod/node-dashboard ./

RUN chown -R nodedash:nodedash /app
USER nodedash

ENV NODE_ENV=production \
    PORT=3001 \
    APP_URL="https://admin.decentralchain.io" \
    DCC_NODE_URL=https://testnet-node.decentralchain.io \
    SCANNER_URL=https://testnet-scanner.decentralchain.io \
    GITHUB_OAUTH_CLIENT_ID="" \
    GITHUB_OAUTH_CLIENT_SECRET="" \
    GITHUB_ORG="Decentral-America" \
    ADMIN_JWT_SECRET="" \
    DCC_LOAD_TESTER_PATH="/opt/dcc/load-tester" \
    LOG_LEVEL="info"

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
