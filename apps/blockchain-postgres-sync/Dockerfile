# syntax=docker/dockerfile:1

# ─── Stage 1: build ──────────────────────────────────────────────────────────
# renovate: image=rust tag=1.96
FROM rust:1.96@sha256:19dfb952582d0e17841fdb8cd70febfb6cb0761c4e0cd84f3cb1f07bb3281a8d AS builder
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
COPY migrations/ ./migrations/
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
# renovate: image=debian tag=12-slim
FROM debian:12-slim@sha256:b29f74a267526ae6ea104eed6c46133b0ca70ce812525df8cd5817698f0a624a AS runtime
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
