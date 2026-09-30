# ── Dependency planner ────────────────────────────────────────────────────────
# cargo-chef computes a "recipe" from Cargo.toml / Cargo.lock that captures
# the exact dependency graph. The recipe is stable across application code
# changes, so the cook layer is only invalidated when dependencies change.
# renovate: image=rust tag=1.98-slim
FROM rust:1.98-slim@sha256:4cd829461bd5c4d511c32e269da9cb8929223b666519d8004e35fc8d1d771ab7 AS chef
RUN cargo install cargo-chef --locked
WORKDIR /usr/src/service

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ── Dependency compiler ───────────────────────────────────────────────────────
FROM chef AS builder
RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=planner /usr/src/service/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# ── Application compiler ──────────────────────────────────────────────────────
COPY . .
RUN cargo build --release --bin service --bin healthcheck

# ── Runtime image ─────────────────────────────────────────────────────────────
# distroless/cc-debian13 adds libgcc-s1 and libstdc++6 on top of base.
# The Rust binary links against libgcc_s.so.1 even with panic=abort (via
# async/await machinery in tokio). cc is the correct variant for Rust binaries.
# :nonroot runs as uid 65532 — no useradd step required.
# renovate: image=gcr.io/distroless/cc-debian13 tag=nonroot
FROM gcr.io/distroless/cc-debian13:nonroot@sha256:54df941ed0d06a1bd95ef5e0ce391fd8d9f94b64782dc9a60062727849ee3f97

WORKDIR /app
COPY --from=builder /usr/src/service/target/release/service .
COPY --from=builder /usr/src/service/target/release/healthcheck .

EXPOSE 8081

# Use exec form (no shell) so the healthcheck binary runs directly.
# start-period=30s: allows time for Redis pool initialisation before probes begin.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD ["/app/healthcheck"]

CMD ["/app/service"]
