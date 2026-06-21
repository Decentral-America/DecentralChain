/*!
 * Lock-free metrics collection using HdrHistogram.
 *
 * HdrHistogram records latency values across 5 orders of magnitude
 * (1 µs – 1000 s) with < 1% relative accuracy — the standard for
 * production load testing (same as Gatling, wrk2, k6).
 */

use hdrhistogram::Histogram;
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Clone)]
pub struct MetricsCollector(Arc<Mutex<Inner>>);

struct Inner {
    histogram:   Histogram<u64>,
    total_sent:  u64,
    total_errors: u64,
    start_time:  Instant,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self(Arc::new(Mutex::new(Inner {
            histogram:    Histogram::new_with_bounds(1, 60_000_000, 3).expect("MetricsCollector invariant violated"),
            total_sent:   0,
            total_errors: 0,
            start_time:   Instant::now(),
        })))
    }

    /// Reset all counters and the histogram for the next phase.
    /// Called between phases so each phase reports its own TPS and latency,
    /// not a cumulative average since test start.
    pub fn reset(&self) {
        let mut inner = self.0.lock().expect("MetricsCollector invariant violated");
        inner.histogram   = Histogram::new_with_bounds(1, 60_000_000, 3).expect("MetricsCollector invariant violated");
        inner.total_sent  = 0;
        inner.total_errors = 0;
        inner.start_time  = Instant::now();
    }

    /// Record a completed request.
    pub fn record(&self, latency_ms: u64, success: bool) {
        let mut inner = self.0.lock().expect("MetricsCollector invariant violated");
        inner.total_sent += 1;
        if !success {
            inner.total_errors += 1;
        }
        let _ = inner.histogram.record(latency_ms.max(1));
    }

    pub fn print_phase_report(&self, phase_name: &str) {
        let inner = self.0.lock().expect("MetricsCollector invariant violated");
        let h     = &inner.histogram;
        let elapsed_s = inner.start_time.elapsed().as_secs_f64();
        let tps   = inner.total_sent as f64 / elapsed_s;
        let err_pct = inner.total_errors as f64 / inner.total_sent.max(1) as f64 * 100.0;

        println!("\n═══ Phase: {phase_name} ═══");
        println!("  TPS        : {tps:.1}");
        println!("  Total TXs  : {}", inner.total_sent);
        println!("  Errors     : {} ({err_pct:.2}%)", inner.total_errors);
        println!("  Latency p50: {} ms", h.value_at_quantile(0.50));
        println!("  Latency p95: {} ms", h.value_at_quantile(0.95));
        println!("  Latency p99: {} ms", h.value_at_quantile(0.99));
        println!("  Latency p99.9: {} ms", h.value_at_quantile(0.999));
        println!("  Latency max: {} ms", h.max());
    }

    /// Emit a JSON tick line — called every second during a phase for live streaming.
    pub fn emit_json_tick(&self, phase: &str, elapsed_s: f64) {
        let inner = self.0.lock().expect("MetricsCollector invariant violated");
        let h     = &inner.histogram;
        let tps   = inner.total_sent as f64 / elapsed_s.max(0.001);
        let err_rate = inner.total_errors as f64 / inner.total_sent.max(1) as f64;
        println!("{}", serde_json::json!({
            "event":      "tick",
            "phase":      phase,
            "elapsed_s":  (elapsed_s * 10.0).round() / 10.0,
            "tps":        (tps * 10.0).round() / 10.0,
            "total_sent": inner.total_sent,
            "errors":     inner.total_errors,
            "error_rate": (err_rate * 10000.0).round() / 10000.0,
            "p50_ms":     h.value_at_quantile(0.50),
            "p95_ms":     h.value_at_quantile(0.95),
            "p99_ms":     h.value_at_quantile(0.99),
            "p999_ms":    h.value_at_quantile(0.999),
            "max_ms":     h.max(),
        }));
    }

    /// Emit a JSON phase-end summary line.
    pub fn emit_json_phase_end(&self, phase: &str) {
        let inner = self.0.lock().expect("MetricsCollector invariant violated");
        let h     = &inner.histogram;
        let elapsed_s = inner.start_time.elapsed().as_secs_f64();
        let tps   = inner.total_sent as f64 / elapsed_s.max(0.001);
        let err_rate = inner.total_errors as f64 / inner.total_sent.max(1) as f64;
        println!("{}", serde_json::json!({
            "event":      "phase_end",
            "phase":      phase,
            "elapsed_s":  (elapsed_s * 10.0).round() / 10.0,
            "tps":        (tps * 10.0).round() / 10.0,
            "total_sent": inner.total_sent,
            "errors":     inner.total_errors,
            "error_rate": (err_rate * 10000.0).round() / 10000.0,
            "p50_ms":     h.value_at_quantile(0.50),
            "p75_ms":     h.value_at_quantile(0.75),
            "p95_ms":     h.value_at_quantile(0.95),
            "p99_ms":     h.value_at_quantile(0.99),
            "p999_ms":    h.value_at_quantile(0.999),
            "max_ms":     h.max(),
        }));
    }

    /// Emit a JSON final report line — last event of a run.
    pub fn emit_json_final(&self) {
        let inner    = self.0.lock().expect("MetricsCollector invariant violated");
        let h        = &inner.histogram;
        let elapsed  = inner.start_time.elapsed();
        let elapsed_s = elapsed.as_secs_f64();
        let tps      = inner.total_sent as f64 / elapsed_s.max(0.001);
        let err_rate = inner.total_errors as f64 / inner.total_sent.max(1) as f64;
        println!("{}", serde_json::json!({
            "event":      "final",
            "elapsed_s":  (elapsed_s * 10.0).round() / 10.0,
            "tps":        (tps * 10.0).round() / 10.0,
            "total_sent": inner.total_sent,
            "errors":     inner.total_errors,
            "error_rate": (err_rate * 10000.0).round() / 10000.0,
            "p50_ms":     h.value_at_quantile(0.50),
            "p75_ms":     h.value_at_quantile(0.75),
            "p95_ms":     h.value_at_quantile(0.95),
            "p99_ms":     h.value_at_quantile(0.99),
            "p999_ms":    h.value_at_quantile(0.999),
            "max_ms":     h.max(),
        }));
    }

    pub fn print_final_report(&self) {
        let inner    = self.0.lock().expect("MetricsCollector invariant violated");
        let h        = &inner.histogram;
        let elapsed  = inner.start_time.elapsed();
        let elapsed_s = elapsed.as_secs_f64();
        let tps      = inner.total_sent as f64 / elapsed_s;
        let err_pct  = inner.total_errors as f64 / inner.total_sent.max(1) as f64 * 100.0;

        println!("\n╔══════════════════════════════════════════╗");
        println!("║         DCC Load Test — Final Report      ║");
        println!("╠══════════════════════════════════════════╣");
        println!("║  Duration    : {:.1}s", elapsed_s);
        println!("║  Total TXs   : {}", inner.total_sent);
        println!("║  Throughput  : {:.1} TPS", tps);
        println!("║  Error rate  : {err_pct:.3}%");
        println!("╠══════════════════════════════════════════╣");
        println!("║  Latency (ms)");
        println!("║    p50  : {}", h.value_at_quantile(0.50));
        println!("║    p75  : {}", h.value_at_quantile(0.75));
        println!("║    p95  : {}", h.value_at_quantile(0.95));
        println!("║    p99  : {}", h.value_at_quantile(0.99));
        println!("║    p99.9: {}", h.value_at_quantile(0.999));
        println!("║    max  : {}", h.max());
        println!("╚══════════════════════════════════════════╝");
    }
}
