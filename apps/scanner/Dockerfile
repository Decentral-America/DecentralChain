# ── Stage 1: Build ──────────────────────────────────────────────────────────
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:9a2c6269f83d74af45665c0b738b78c7b5f07bf2374c72a4c540065a975b9693 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
# git        — required by Nx for workspace operations (affected detection, hashing)
# curl       — used by Rust toolchain installer and wasm-pack binary download
# build-base — provides cc/gcc linker required by Rust crate build scripts
RUN apk add --no-cache git curl build-base

# Install Rust toolchain (required by @decentralchain/crypto wasm build step)
# --profile minimal skips rust-docs to keep image size down
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --profile minimal --no-modify-path
ENV PATH="/root/.cargo/bin:$PATH"
RUN rustup target add wasm32-unknown-unknown

# Install wasm-pack v0.15.0 — pre-built musl binary (no cargo compile needed)
RUN curl -fsSL \
    https://github.com/wasm-bindgen/wasm-pack/releases/download/v0.15.0/wasm-pack-v0.15.0-x86_64-unknown-linux-musl.tar.gz \
    | tar xz -C /tmp && \
    mv /tmp/wasm-pack-v0.15.0-x86_64-unknown-linux-musl/wasm-pack /usr/local/bin/wasm-pack && \
    rm -rf /tmp/wasm-pack-v0.15.0-x86_64-unknown-linux-musl

WORKDIR /workspace

# Copy only the workspace files needed to build scanner and its workspace deps.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json biome.json tsconfig.base.json .node-version ./
# Required by @nx/vitest plugin — all 22 package vitest.config.ts files import this.
COPY vitest.base.config.ts ./
COPY scripts ./scripts
COPY tools ./tools
COPY packages ./packages
COPY apps/scanner ./apps/scanner

RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile
# React Router v7 generates +types/ virtual modules into .react-router/types/ (gitignored).
# Run typegen before the build so Rolldown can resolve ./+types/* imports.
RUN cd apps/scanner && pnpm react-router typegen

# SENTRY_RELEASE is the git tag (e.g. scanner/v1.2.3) passed as a build arg from
# deploy-scanner.yml. It becomes VITE_APP_VERSION so the Sentry release name
# matches the tag, and SENTRY_RELEASE so @sentry/vite-plugin associates source
# maps with the correct release. SENTRY_AUTH_TOKEN is mounted as a Docker secret
# so it never appears in any image layer or build cache.
ARG SENTRY_RELEASE
# SENTRY_AUTH_TOKEN intentionally omitted until dcc-scanner project is created in Sentry.
RUN SENTRY_RELEASE="${SENTRY_RELEASE}" \
    VITE_APP_VERSION="${SENTRY_RELEASE}" \
    pnpm nx run scanner:build --skip-nx-cache
RUN pnpm --filter scanner --prod deploy --legacy /prod/scanner \
    && cp -R apps/scanner/build /prod/scanner/build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
#
# react-router v7 SSR produces a Node server bundle at build/server/index.js.
# It is served with `react-router-serve`, not nginx.
# nginx would only work for a static SPA export (ssr: false), which this is not.
FROM base AS runtime

# Patch CVE-2026-45447 (OpenSSL heap use-after-free) while node:24-alpine awaits rebuild.
# Remove once upstream node:24-alpine ships openssl ≥ 3.5.7-r0.
RUN apk upgrade --no-cache libcrypto3 libssl3

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

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Invoke react-router-serve directly to bypass Corepack (read_only container
# prevents Corepack from writing its package-manager cache to the home dir).
CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
