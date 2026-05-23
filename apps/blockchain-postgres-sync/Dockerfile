# syntax=docker/dockerfile:1

# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM rust:1.95 AS builder
WORKDIR /app

# Install build-time system deps (protoc for tonic-prost-build, libpq for diesel)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        protobuf-compiler \
        libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Cache dependencies separately from source (layer invalidated only on Cargo.* change)
COPY Cargo.toml Cargo.lock ./
COPY build.rs ./
COPY proto/ ./proto/
# Create a stub lib so `cargo build` resolves deps without compiling our src
RUN mkdir -p src/bin src/lib && \
    echo 'fn main() {}' > src/bin/consumer.rs && \
    echo 'fn main() {}' > src/bin/migration.rs && \
    echo '' > src/lib/lib.rs && \
    cargo build --release && \
    rm -rf src

COPY src/ ./src/
# Force re-compile of our crate (timestamps on stub artefacts are newer)
RUN touch src/lib/lib.rs src/bin/consumer.rs src/bin/migration.rs && \
    cargo build --release

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM debian:12-slim AS runtime
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/Decentral-America/blockchain-postgres-sync" \
      org.opencontainers.image.description="Blockchain-to-PostgreSQL sync daemon for DecentralChain" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.vendor="Decentral America"

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN useradd --system --no-create-home --uid 1001 --shell /bin/false app

COPY --from=builder /app/target/release/consumer ./consumer
COPY --from=builder /app/target/release/migration ./migration
COPY --from=builder /app/migrations ./migrations/

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS "http://localhost:${METRICS_PORT:-9090}/health" || exit 1

CMD ["./consumer"]
