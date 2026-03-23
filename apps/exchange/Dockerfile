# Multi-stage Docker build for DecentralExchange React App
# Simple single-network build (for development/testing)
# For production multi-network builds, use Dockerfile.production

# ================================================================
# Stage 1: Build the React application
# ================================================================
# renovate: image=node tag=24-alpine
FROM node:24-alpine@sha256:7fddd9ddeae8196abf4a3ef2de34e11f7b1a722119f91f28ddf1e99dcafdf114 AS builder

# Build arguments for network configuration
ARG VITE_NETWORK=mainnet
ARG VITE_NODE_URL=https://mainnet-node.decentralchain.io
ARG VITE_MATCHER_URL=https://mainnet-matcher.decentralchain.io
ARG VITE_DATA_SERVICE_URL=https://data-service.decentralchain.io

# Set environment variables for build
ENV VITE_NETWORK=$VITE_NETWORK
ENV VITE_NODE_URL=$VITE_NODE_URL
ENV VITE_MATCHER_URL=$VITE_MATCHER_URL
ENV VITE_DATA_SERVICE_URL=$VITE_DATA_SERVICE_URL

# Install git (needed for some npm packages)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (--ignore-scripts skips native module compilation
# like node-hid/usb which are Electron-only and not needed for web builds)
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# ================================================================
# Stage 2: Serve with Nginx
# ================================================================
# renovate: image=nginx tag=stable-alpine
FROM nginx:stable-alpine@sha256:5b4900b042ccfa8b0a73df622c3a60f2322faeb2be800cbee5aa7b44d241649e

# Environment variable for runtime
ARG VITE_NETWORK=mainnet
ENV WEB_ENVIRONMENT=$VITE_NETWORK

# Railway / reverse-proxy injects PORT at runtime. Default to 8080 so the
# container can run as a non-root user (ports < 1024 require CAP_NET_BIND_SERVICE).
ENV PORT=8080

# Install tools
RUN apk update && apk add gettext libintl

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config as template (envsubst will replace $PORT at runtime)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Grant the nginx user write access to the directories it needs at runtime.
# This must happen while we are still root (before USER nginx).
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

# Drop to unprivileged user for all subsequent operations including CMD.
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Use envsubst to inject PORT into nginx config, then start nginx
CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
