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

# Copy workspace manifests and all package sources.
# Copying all packages (not just direct deps) avoids fragile enumeration of
# transitive workspace dependencies and mirrors the scanner Dockerfile pattern.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json biome.json nx.json .node-version ./
COPY scripts ./scripts
COPY tools ./tools
COPY packages ./packages
COPY apps/data-service ./apps/data-service

# git init is required because pnpm prepare scripts (lefthook) call git rev-parse
RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile

# Build the data-service and all its workspace dependencies via Nx task graph
RUN pnpm nx run data-service:build --skip-nx-cache

# `pnpm deploy --prod` creates a self-contained directory with:
#   - Production node_modules (no devDependencies)
#   - Workspace dependencies resolved and inlined
#   - The package directory contents (including dist/)
# --legacy bypasses ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE (pnpm v10+ requirement)
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
