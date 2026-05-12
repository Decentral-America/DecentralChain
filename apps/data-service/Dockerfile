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

# Install system deps required for native build tools (e.g. node-gyp)
RUN apk add --no-cache python3 make g++

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
COPY packages/assets-pairs-order/package.json packages/assets-pairs-order/
COPY packages/data-entities/package.json        packages/data-entities/
COPY packages/parse-json-bignumber/package.json packages/parse-json-bignumber/
COPY apps/data-service/package.json             apps/data-service/

# --- Layer: dependency install ---
RUN pnpm install --frozen-lockfile

# --- Layer: source files ---
COPY packages/assets-pairs-order/ packages/assets-pairs-order/
COPY packages/data-entities/       packages/data-entities/
COPY packages/parse-json-bignumber/ packages/parse-json-bignumber/
COPY apps/data-service/            apps/data-service/

# --- Layer: build ---
# Build workspace SDK packages first (data-service depends on them),
# then build the data-service itself.
RUN pnpm --filter @decentralchain/assets-pairs-order build && \
    pnpm --filter @decentralchain/data-entities       build && \
    pnpm --filter @decentralchain/parse-json-bignumber build && \
    pnpm --filter @decentralchain/data-service        build

# --- Layer: deploy ---
# `pnpm deploy --prod` creates a self-contained directory with:
#   - Production node_modules (no devDependencies)
#   - Workspace dependencies resolved and inlined
#   - The package directory contents (including dist/)
RUN pnpm --filter @decentralchain/data-service deploy --prod /app/standalone

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

# Health check — the API server returns 200 on GET /
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-3000}/" || exit 1

EXPOSE 3000

ENV NODE_ENV=production

# Default: run the API server.
# Override CMD to run the pairs daemon:
#   docker run ... node dist/daemons/pairs/index.mjs
CMD ["node", "dist/index.mjs"]
