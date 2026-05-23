# syntax=docker/dockerfile:1.7

# =============================================================================
# Build from the monorepo root:
#   docker build -f apps/data-service/Dockerfile -t decentralchain/data-service:latest .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: builder
# Installs all workspace dependencies, builds SDK packages and the data-service,
# then uses `pnpm deploy` to produce a fully self-contained deployment directory.
# -----------------------------------------------------------------------------
FROM node:24-alpine AS builder

# Install system deps required for native build tools (e.g. node-gyp) and git
# (git is required by pnpm lifecycle scripts during install)
RUN apk add --no-cache python3 make g++ git

WORKDIR /workspace

# Enable Corepack so pnpm version is driven by package.json#packageManager
RUN corepack enable

# --- Layer: workspace manifests (changes rarely → cached layer) ---
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY biome.json ./
COPY nx.json ./

# Copy only the package.json files needed for workspace resolution first.
# This lets pnpm install run before copying source, maximising cache hits.
COPY packages/sdk/bignumber/package.json            packages/sdk/bignumber/
COPY packages/sdk/assets-pairs-order/package.json packages/sdk/assets-pairs-order/
COPY packages/sdk/data-entities/package.json       packages/sdk/data-entities/
COPY packages/sdk/parse-json-bignumber/package.json packages/sdk/parse-json-bignumber/
COPY apps/data-service/package.json                apps/data-service/

# --- Layer: dependency install ---
# git init is required because pnpm prepare scripts (lefthook) call git rev-parse
RUN git init && pnpm install --frozen-lockfile

# --- Layer: source files ---
COPY packages/sdk/bignumber/            packages/sdk/bignumber/
COPY packages/sdk/assets-pairs-order/ packages/sdk/assets-pairs-order/
COPY packages/sdk/data-entities/      packages/sdk/data-entities/
COPY packages/sdk/parse-json-bignumber/ packages/sdk/parse-json-bignumber/
COPY apps/data-service/               apps/data-service/

# --- Layer: build ---
# Build workspace SDK packages first (data-service depends on them),
# then build the data-service itself.
RUN pnpm --filter @decentralchain/bignumber           build && \
    pnpm --filter @decentralchain/assets-pairs-order build && \
    pnpm --filter @decentralchain/data-entities       build && \
    pnpm --filter @decentralchain/parse-json-bignumber build && \
    pnpm --filter @decentralchain/data-service        build

# --- Layer: deploy ---
# `pnpm deploy --prod` creates a self-contained directory with:
#   - Production node_modules (no devDependencies)
#   - Workspace dependencies resolved and inlined
#   - The package directory contents (including dist/)
RUN pnpm --filter @decentralchain/data-service deploy --legacy --prod /app/standalone

# -----------------------------------------------------------------------------
# Stage 2: production
# Minimal runtime image — no build tools, no source, no dev dependencies.
# -----------------------------------------------------------------------------
FROM node:24-alpine AS production

# Security: run as non-root
RUN addgroup -S dcc && adduser -S -G dcc -u 1001 dcc

WORKDIR /app

# Copy only the standalone deployment from the builder
COPY --from=builder --chown=dcc:dcc /app/standalone .

USER dcc

# Health check — GET /health returns {"status":"ok"} with HTTP 200.
# Production deployments set PORT=8080 via the compose environment block.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-3000}/health" || exit 1

# Production port is 8080 (set via PORT env var). 3000 is the default fallback
# for local development without the compose PORT override.
EXPOSE 3000

ENV NODE_ENV=production

# Default: run the API server.
# Override CMD to run the pairs daemon:
#   docker run ... node dist/daemons/pairs/index.mjs
CMD ["node", "dist/index.mjs"]
