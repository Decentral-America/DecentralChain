/*!
 * DCC Load Tester — mainnet-grade stress testing for DecentralChain nodes.
 *
 * Architecture:
 *   1. Pre-sign N transactions offline (zero blocking on crypto during load phase)
 *   2. Fan-out across `--workers` tokio tasks, each blasting the broadcast endpoint
 *   3. Record latency in a lock-free HdrHistogram
 *   4. Report p50/p95/p99/p99.9 latency + TPS + error rate after each phase
 *
 * Usage:
 *   load-tester --node https://testnet-node.decentralchain.io \
 *               --seed "your seed phrase" \
 *               --chain-id "!" \
 *               --workers 200 \
 *               --target-tps 500 \
 *               --duration 300
 *
 * Phases (matches industry standard — same pattern as wrk2 / Gatling):
 *   - Warmup:   10% of target TPS for 30 s
 *   - Ramp:     linearly increase to target TPS over 60 s
 *   - Sustained: target TPS for --duration seconds
 *   - Cool-down: drain pending confirmations
 */

mod crypto;
mod tx;
mod worker;
mod metrics;
mod cli;

use clap::Parser;
use tracing::info;
use tracing_subscriber::{EnvFilter, fmt};

use cli::Args;
use metrics::MetricsCollector;
use worker::LoadPhase;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("load_tester=info".parse()?))
        .json()
        .init();

    let args = Args::parse();
    info!(
        node = %args.node,
        workers = args.workers,
        target_tps = args.target_tps,
        duration_s = args.duration,
        "DCC Load Tester starting"
    );

    // ── Phase 1: Pre-sign transactions ────────────────────────────────────────
    info!("Pre-signing {} transactions...", args.pre_sign_count());
    let signed_txs = tx::presign_batch(
        &args.seed,
        &args.chain_id,
        args.recipient.as_deref(),
        args.pre_sign_count(),
        args.sender_count,
    )?;
    info!("Pre-signing complete — {} TXs ready", signed_txs.len());

    // ── Phase 2: Run load phases ──────────────────────────────────────────────
    let client   = reqwest::Client::builder()
        .pool_max_idle_per_host(args.workers * 2)
        .tcp_keepalive(std::time::Duration::from_secs(30))
        .build()?;

    let collector  = MetricsCollector::new();
    // Shared cursor persists across all phases — no TX is ever re-broadcast
    let tx_cursor  = std::sync::Arc::new(std::sync::atomic::AtomicUsize::new(0));

    let phases = [LoadPhase::Warmup, LoadPhase::Ramp, LoadPhase::Sustained];
    for (i, phase) in phases.iter().enumerate() {
        let is_last = i == phases.len() - 1;
        let phase = *phase;
        let phase_tps      = phase.target_tps(args.target_tps);
        let phase_duration = phase.duration_secs(args.duration);
        info!(?phase, tps = phase_tps, secs = phase_duration, "Starting phase");

        // In JSON mode, spawn a 1-second ticker so the dashboard can stream live metrics.
        let ticker_handle = if args.json {
            let met        = collector.clone();
            let phase_name = phase.name().to_string();
            let start      = std::time::Instant::now();
            Some(tokio::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(1));
                interval.tick().await; // skip the immediate first tick
                loop {
                    interval.tick().await;
                    met.emit_json_tick(&phase_name, start.elapsed().as_secs_f64());
                }
            }))
        } else {
            None
        };

        worker::run_phase(worker::PhaseConfig {
            client:     client.clone(),
            node:       &args.node,
            txs:        &signed_txs,
            workers:    args.workers,
            target_tps: phase_tps,
            duration_s: phase_duration,
            metrics:    collector.clone(),
            tx_cursor:  std::sync::Arc::clone(&tx_cursor),
        }).await?;

        // Stop the ticker before emitting the phase summary.
        if let Some(h) = ticker_handle { h.abort(); }

        if args.json {
            collector.emit_json_phase_end(phase.name());
        } else {
            collector.print_phase_report(&phase.name());
        }

        // Reset between phases so each phase reports its own TPS and latency.
        // Skip reset after the last phase — the final report reads from this data.
        if !is_last {
            collector.reset();
        }
    }

    // ── Phase 3: Final report — shows sustained phase stats ───────────────────
    if args.json {
        collector.emit_json_final();
    } else {
        collector.print_final_report();
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Validate that Rust address derivation matches pywaves output.
    /// Known: seed "pizza walk tourist speed dress wagon link property answer sell drum random loop high paper"
    ///        produces address 31PmKNdHAU5sZbtg8TrzKh8WfE7E8xBc9WD on testnet (chain_id = '!')
    #[test]
    fn test_address_derivation_matches_pywaves() {
        let seed = "pizza walk tourist speed dress wagon link property answer sell drum random loop high paper";
        let (_, _, addr) = crypto::derive_account(seed, b'!');
        assert_eq!(addr, "31PmKNdHAU5sZbtg8TrzKh8WfE7E8xBc9WD",
            "Address mismatch — crypto derivation doesn't match pywaves");
    }

    #[test]
    fn test_api_key_hash_matches_node_config() {
        let key = "***REDACTED_MAIN_API_KEY***=";
        let hash = crypto::api_key_hash(key);
        assert_eq!(hash, "5gZJk3xTibMQ65CvKeBzoHR4pY5h7EYmAc87ZZcLW7ps",
            "API key hash mismatch — check keccak256(blake2b256(key)) implementation");
    }
    #[test]
    fn test_proto_sign_bytes_match_pywaves() {
        let txs = tx::presign_batch(
            "pizza walk tourist speed dress wagon link property answer sell drum random loop high paper",
            "!",
            Some("31PmKNdHAU5sZbtg8TrzKh8WfE7E8xBc9WD"),
            1,
            1,
        ).expect("presign_batch failed");

        assert_eq!(txs.len(), 1);
        let body = &txs[0].body;
        assert_eq!(body["type"], 4);
        assert_eq!(body["version"], 3);
        assert_eq!(body["senderPublicKey"], "GegVBYKsoCdcBoEnba259Xq9pdkVmUaA2cooyfbdWkVN");
        let proofs = body["proofs"].as_array().expect("proofs must be array");
        assert!(!proofs.is_empty(), "proofs must not be empty");
        assert!(proofs[0].as_str().unwrap().len() > 60, "proof must be a valid base58 signature");
    }
}
