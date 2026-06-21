/*!
 * Load phase execution with configurable TPS rate limiting.
 *
 * Uses tokio::time::interval for precise rate limiting — not sleep loops.
 * Each worker pulls from a shared Arc<Vec<SignedTx>> and broadcasts in rotation.
 *
 * Critical: `tx_cursor` is passed in from the caller and persists across all three
 * phases (warmup → ramp → sustained). Each phase starts where the previous left
 * off, so no pre-signed TX is ever re-broadcast — preventing "already in UTX"
 * rejections from the node.
 */

use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, Instant};
use tokio::sync::Semaphore;
use tracing::{debug, warn};

use crate::metrics::MetricsCollector;
use crate::tx::SignedTx;

#[derive(Debug, Clone, Copy)]
pub enum LoadPhase {
    Warmup,
    Ramp,
    Sustained,
}

impl LoadPhase {
    pub fn target_tps(&self, base_tps: u64) -> u64 {
        match self {
            Self::Warmup    => (base_tps / 10).max(1),
            Self::Ramp      => base_tps / 2,
            Self::Sustained => base_tps,
        }
    }

    pub fn duration_secs(&self, sustained_secs: u64) -> u64 {
        match self {
            Self::Warmup    => 30,
            Self::Ramp      => 60,
            Self::Sustained => sustained_secs,
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            Self::Warmup    => "Warmup",
            Self::Ramp      => "Ramp",
            Self::Sustained => "Sustained",
        }
    }
}

/// Configuration for a single load phase run.
pub struct PhaseConfig<'a> {
    pub client:     reqwest::Client,
    pub node:       &'a str,
    pub txs:        &'a [SignedTx],
    pub workers:    usize,
    pub target_tps: u64,
    pub duration_s: u64,
    pub metrics:    MetricsCollector,
    /// Shared cursor persists across phases — no TX is ever re-broadcast.
    pub tx_cursor:  Arc<AtomicUsize>,
}

/// Run one load phase.
pub async fn run_phase(cfg: PhaseConfig<'_>) -> anyhow::Result<()> {
    anyhow::ensure!(!cfg.txs.is_empty(), "TX pool is empty — pre-sign count must be > 0");

    let broadcast_url = format!("{}/transactions/broadcast", cfg.node.trim_end_matches('/'));
    let txs           = Arc::new(cfg.txs.iter().map(|t| t.body.clone()).collect::<Vec<_>>());
    let deadline      = Instant::now() + Duration::from_secs(cfg.duration_s);
    let sem           = Arc::new(Semaphore::new(cfg.workers));

    let interval_us = 1_000_000u64 / cfg.target_tps.max(1);
    let mut interval = tokio::time::interval(Duration::from_micros(interval_us));
    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

    while Instant::now() < deadline {
        interval.tick().await;

        let permit = Arc::clone(&sem).acquire_owned().await?;
        let client = cfg.client.clone();
        let url    = broadcast_url.clone();
        let txs    = Arc::clone(&txs);
        let cursor = Arc::clone(&cfg.tx_cursor);
        let met    = cfg.metrics.clone();

        tokio::spawn(async move {
            let _permit = permit;

            let raw = cursor.fetch_add(1, Ordering::Relaxed);
            let i   = raw % txs.len();

            if raw >= txs.len() {
                warn!(
                    "TX pool exhausted (cursor={}, pool_size={}) — pre-sign count too low",
                    raw, txs.len()
                );
            }

            let tx       = &txs[i];
            let t0       = Instant::now();
            let result   = client.post(&url).json(tx).send().await;
            let latency  = t0.elapsed().as_millis() as u64;

            let success = match result {
                Ok(resp) => {
                    let status = resp.status();
                    if status.is_success() {
                        debug!("Broadcast OK (cursor={})", raw);
                        true
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        debug!(
                            "Broadcast rejected (cursor={}, status={}): {}",
                            raw,
                            status.as_u16(),
                            &body[..body.len().min(200)],
                        );
                        false
                    }
                }
                Err(e) => {
                    warn!("Broadcast network error (cursor={}): {}", raw, e);
                    false
                }
            };

            met.record(latency, success);
        });
    }

    let _ = sem.acquire_many(cfg.workers as u32).await;
    Ok(())
}
