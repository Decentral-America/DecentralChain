# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# Copy manifests first for layer-caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
#
# react-router v7 SSR produces a Node server bundle at build/server/index.js.
# It is served with `react-router-serve`, not nginx.
# nginx would only work for a static SPA export (ssr: false), which this is not.
FROM node:24-alpine AS runtime

# Security: run as non-root
RUN addgroup -S scanner && adduser -S -G scanner scanner

WORKDIR /app

# Only copy build output and the runtime server package
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

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
CMD ["npx", "react-router-serve", "./build/server/index.js"]
