# ── Stage 1: Build ──────────────────────────────────────────────────────────
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

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
# Every workspace manifest first (see the manifests stage), then this app's source.
COPY --from=manifests /out/ ./
COPY apps/scanner ./apps/scanner

RUN --mount=type=cache,id=pnpm,target=/pnpm/store git init && pnpm install --frozen-lockfile \
      --filter . --filter './packages/**' --filter ./apps/scanner
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
# --chown here, not a later chown -R layer: that layer rewrote pnpm's hardlinked files and
# produced a tar containerd could not extract (hardlink target missing) on the VPS.
COPY --from=build --chown=scanner:scanner /prod/scanner ./

# node:24-alpine ships npm's own bundled node_modules (tar, brace-expansion,
# sigstore, ip-address, etc.) as part of the base image. This service never
# invokes npm at runtime (served via react-router-serve), so those vendored
# packages are pure unused surface — remove them rather than wait on upstream
# alpine/npm patches for CVEs in code that never executes here.
RUN rm -rf /usr/local/lib/node_modules/npm

# The TypeScript 7 native compiler (a Go binary) arrives through the workspace file: packages.
# It is a build-time tool that never runs here, and its bundled Go stdlib carries unpatched
# advisories, so drop it from the runtime image.
RUN find /app/node_modules -path '*@typescript/typescript-linux-*' -prune -exec rm -rf {} + \
    && find /app/node_modules/.pnpm -maxdepth 1 -name '@typescript+typescript-linux-*' -exec rm -rf {} +

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
