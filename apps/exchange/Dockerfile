# ─────────────────────────────────────────────────────────────────────────────
# DCC Exchange — production Docker image
# Build context: monorepo root
#
#   docker build \
#     -f apps/exchange/Dockerfile \
#     --build-arg BUILD_MODE=production \
#     --build-arg NETWORK=mainnet \
#     -t ghcr.io/decentral-america/exchange:mainnet-latest \
#     .
#
# BUILD_MODE → selects which .env.<mode> file Vite loads at build time:
#   production  → .env.production  → VITE_NETWORK=mainnet
#   staging     → .env.staging     → VITE_NETWORK=stagenet
#   testnet     → .env.testnet     → VITE_NETWORK=testnet
#
# NETWORK → names the nginx document root subdirectory:
#   mainnet | stagenet | testnet
#
# Each image is single-network and immutable. Network selection is baked in
# at build time — there is no runtime switching.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:9a2c6269f83d74af45665c0b738b78c7b5f07bf2374c72a4c540065a975b9693 AS builder
ARG BUILD_MODE=production

WORKDIR /app

# Enable pnpm (version resolved from package.json#packageManager via corepack)
RUN corepack enable

# ── Dependency layer (cache-busts only when pnpm-lock.yaml changes) ──────────
# pnpm fetch downloads all packages to the local store from the lockfile alone,
# without requiring workspace source files. This layer is cheap to cache.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ── Source ────────────────────────────────────────────────────────────────────
# Copy only what is needed for the exchange build: root TypeScript config,
# all SDK packages, and the exchange app itself. Other apps (scanner,
# data-service, cubensis-connect) are intentionally excluded.
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/exchange/ apps/exchange/

# Install from the pre-populated local store (no network access required)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline

# ── Build SDK dependencies ────────────────────────────────────────────────────
# Workspace packages must be compiled before the exchange can import them.
# This mirrors Nx's dependsOn: ["^build"] task graph behaviour.
RUN pnpm --filter './packages/**' run build

# ── Build the exchange ────────────────────────────────────────────────────────
# tsc -b compiles TypeScript project references; vite build produces dist/.
# --mode selects the .env.<mode> file that is baked into the bundle.
RUN pnpm --filter ./apps/exchange exec tsc -b && \
    pnpm --filter ./apps/exchange exec vite build --mode "${BUILD_MODE}"

# ── Stage 2: production ───────────────────────────────────────────────────────
# Minimal nginx:stable-alpine — no build tools, no source code, no secrets.
# Runs as the non-root nginx user on port 8080.
# renovate: image=nginx tag=stable-alpine
FROM nginx:stable-alpine@sha256:5f979dcfed4ce6461873f087e8c980d6e29b084b9e8776d9704a7e989b5f4898 AS production
ARG NETWORK=mainnet

# ── nginx configuration ───────────────────────────────────────────────────────
# Main config: worker settings, rate-limiting zones, gzip, non-root temp paths.
COPY apps/exchange/docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Server block: resolve the ${WEB_ENVIRONMENT} placeholder at build time.
# Each image serves exactly one network so runtime envsubst is unnecessary.
COPY apps/exchange/docker/nginx/default.conf /tmp/default.conf.tpl
RUN mkdir -p /etc/nginx/conf.d /tmp/nginx && \
    sed "s|\${WEB_ENVIRONMENT}|${NETWORK}|g" /tmp/default.conf.tpl \
        > /etc/nginx/conf.d/default.conf && \
    rm /tmp/default.conf.tpl

# ── Static assets ─────────────────────────────────────────────────────────────
# Copy the Vite bundle into the network-specific subdirectory.
# The nginx root directive is: /srv/www/dcc-react/dist/<network>/
COPY --from=builder /app/apps/exchange/dist/ /tmp/exchange-dist/
RUN mkdir -p "/srv/www/dcc-react/dist/${NETWORK}" && \
    mv /tmp/exchange-dist/* "/srv/www/dcc-react/dist/${NETWORK}/" && \
    rmdir /tmp/exchange-dist

# ── Non-root setup ────────────────────────────────────────────────────────────
# Grant the nginx user write access to paths it needs at runtime.
# Must happen while still running as root (before USER nginx).
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx \
        /var/run/nginx.pid \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d \
        /tmp/nginx \
        /srv/www/dcc-react

USER nginx

EXPOSE 8080

# Health check — matches the /health location defined in default.conf
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
