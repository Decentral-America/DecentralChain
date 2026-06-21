# DCC Load Tester

Mainnet-grade stress tester for DecentralChain nodes. Designed for accurate p99.9 latency measurement and sustained high-TPS load.

## Architecture

```
Pre-sign phase (CPU)          Load phase (I/O)
─────────────────────         ────────────────────────────────────────
seed → private key            200 tokio workers → reqwest → node
     → sign N TXs             rate-limited by tokio::time::interval
     → JSON array             HdrHistogram → p50/p95/p99/p99.9 report
```

Pre-signing separates crypto (CPU-bound) from broadcasting (I/O-bound). Workers never stall on signing during the load phase — true sustained TPS.

## Build

```bash
cd apps/load-tester
cargo build --release
```

## Usage

```bash
# Testnet: 500 TPS sustained for 5 minutes
./target/release/load-tester \
  --node https://testnet-node.decentralchain.io \
  --seed "pizza walk tourist speed dress wagon ..." \
  --chain-id "!" \
  --workers 200 \
  --target-tps 500 \
  --duration 300

# Mainnet stress test: 2,000 TPS for 10 minutes
./target/release/load-tester \
  --node https://mainnet-node.decentralchain.io \
  --seed "..." \
  --chain-id "?" \
  --workers 500 \
  --target-tps 2000 \
  --duration 600
```

## Output

```
╔══════════════════════════════════════════╗
║         DCC Load Test — Final Report      ║
╠══════════════════════════════════════════╣
║  Duration    : 300.0s
║  Total TXs   : 150,000
║  Throughput  : 500.0 TPS
║  Error rate  : 0.002%
╠══════════════════════════════════════════╣
║  Latency (ms)
║    p50  : 42
║    p75  : 68
║    p95  : 95
║    p99  : 143
║    p99.9: 287
║    max  : 412
╚══════════════════════════════════════════╝
```

## Multi-sender mode (high TPS)

Each DCC node enforces a per-account UTX pool limit. A single sender can fill
the pool in ~1 block at moderate TPS. Use `--sender-count N` to distribute
across N accounts derived from the seed (nonce 0, 1, …, N-1).

**Important**: secondary senders must be funded before the test:

```bash
# Fund secondary senders from primary account (one-time setup)
DCC_PRIVATE_KEY="your seed" pnpm -C packages/e2e-blockchain test --grep "fund-senders"
# OR use the load tester's own fund-senders mode (coming soon)
```

Each additional sender acts as an independent UTX slot budget, multiplying
the effective ceiling by N with zero node config changes.

## Why Rust

- No GIL — true OS parallelism across all CPU cores
- HdrHistogram — accurate p99.9 without GC pauses skewing results
- Pre-signing separates crypto cost from load measurement
- Same `packages/sdk/crypto` primitives as the rest of the DCC ecosystem
- 10–100× throughput vs Python pywaves-ce for equivalent hardware
