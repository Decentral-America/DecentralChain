# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
# git is required by Nx for workspace operations (affected detection, hashing)
RUN apk add --no-cache git
WORKDIR /workspace

# Copy only the workspace files needed to build scanner and its workspace deps.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json biome.json tsconfig.base.json .node-version ./
COPY scripts ./scripts
COPY tools ./tools
COPY packages ./packages
COPY apps/scanner ./apps/scanner

RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile
RUN pnpm nx run scanner:build --skip-nx-cache
RUN pnpm --filter scanner --prod deploy --legacy /prod/scanner \
    && cp -R apps/scanner/build /prod/scanner/build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
#
# react-router v7 SSR produces a Node server bundle at build/server/index.js.
# It is served with `react-router-serve`, not nginx.
# nginx would only work for a static SPA export (ssr: false), which this is not.
FROM base AS runtime

# Security: run as non-root
RUN addgroup -S scanner && adduser -S -G scanner scanner

WORKDIR /app

# Only copy the deployed scanner app and its production dependencies.
COPY --from=build /prod/scanner ./

# Ensure non-root owns the files
RUN chown -R scanner:scanner /app
USER scanner

# Runtime-configurable environment variables with safe defaults
# Override at deploy time via --env or docker-compose environment:
ENV NODE_ENV=production \
    PORT=3000 \
    DCC_NODE_URL=https://mainnet-node.decentralchain.io \
    DCC_MATCHER_URL=https://mainnet-matcher.decentralchain.io \
    DCC_DATA_SERVICE_URL=https://data-service.decentralchain.io/v0 \
    VITE_SENTRY_DSN=""

EXPOSE 3000

# react-router-serve reads build/server/index.js and handles SSR
CMD ["pnpm", "start"]
