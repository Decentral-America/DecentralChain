use clap::Parser;

#[derive(Parser, Debug)]
#[command(
    name    = "dcc-load-tester",
    about   = "Mainnet-grade load and stress tester for DecentralChain nodes",
    version
)]
pub struct Args {
    /// Node REST URL (e.g. https://testnet-node.decentralchain.io)
    #[arg(long, env = "DCC_NODE", default_value = "https://testnet-node.decentralchain.io")]
    pub node: String,

    /// Primary sender seed phrase (15+ words).
    /// For high-TPS loads, use --sender-count > 1 to distribute across multiple accounts.
    #[arg(long, env = "DCC_PRIVATE_KEY")]
    pub seed: String,

    /// Number of sender accounts to derive from the primary seed (nonce 0, 1, 2, ...).
    /// Each sender has its own UTX slot budget — required to exceed the node's
    /// per-account UTX pool limit at high TPS. Default: 1 (single sender).
    #[arg(long, default_value_t = 1)]
    pub sender_count: usize,

    /// Chain ID character (! for testnet, ? for mainnet)
    #[arg(long, env = "DCC_CHAIN_ID", default_value = "!")]
    pub chain_id: String,

    /// Recipient address (defaults to sender self-transfer)
    #[arg(long)]
    pub recipient: Option<String>,

    /// Number of concurrent workers (tokio tasks)
    #[arg(long, default_value_t = 200)]
    pub workers: usize,

    /// Target sustained TPS
    #[arg(long, default_value_t = 500)]
    pub target_tps: u64,

    /// Duration of sustained phase in seconds
    #[arg(long, default_value_t = 300)]
    pub duration: u64,

    /// Number of TXs to pre-sign before load starts (default: target_tps × duration × 2)
    #[arg(long)]
    pub pre_sign: Option<usize>,

    /// Emit JSON lines to stdout instead of human-readable tables.
    /// Each line is a self-contained JSON object — safe to pipe or stream.
    /// Events: {"event":"tick",...} every second during a phase,
    ///         {"event":"phase_end",...} at the end of each phase,
    ///         {"event":"final",...} at the end of the run.
    #[arg(long, default_value_t = false)]
    pub json: bool,
}

impl Args {
    /// Total TXs to pre-sign. Must cover all three phases with no reuse:
    ///   warmup (30 s × 10% TPS) + ramp (60 s × 50% TPS) + sustained (duration × TPS)
    /// Multiply by 1.5× safety margin for timing jitter.
    pub fn pre_sign_count(&self) -> usize {
        self.pre_sign.unwrap_or_else(|| {
            let warmup   = 30  * (self.target_tps / 10).max(1);
            let ramp     = 60  * (self.target_tps / 2).max(1);
            let sustained = self.duration * self.target_tps;
            let total    = (warmup + ramp + sustained) as usize;
            // 1.5× safety margin — never reuse a TX
            (total * 3 / 2).min(10_000_000)
        })
    }
}
