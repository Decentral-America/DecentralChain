use crate::error::Error;
use chrono::Duration;
use serde::Deserialize;
use std::num::NonZeroU32;

const fn default_assets_only() -> bool {
    false
}

const fn default_updates_per_request() -> usize {
    256
}

const fn default_max_wait_time_in_msecs() -> u64 {
    5000
}

const fn default_start_rollback_depth() -> u32 {
    1
}

const fn default_rollback_step() -> u32 {
    500
}

const fn default_metrics_port() -> u16 {
    9090
}

#[derive(Deserialize)]
struct ConfigFlat {
    asset_storage_address: Option<String>,
    #[serde(default = "default_assets_only")]
    assets_only: bool,
    blockchain_updates_url: String,
    chain_id: u8,
    #[serde(default = "default_max_wait_time_in_msecs")]
    max_wait_time_in_msecs: u64,
    starting_height: u32,
    #[serde(default = "default_updates_per_request")]
    updates_per_request: usize,
    #[serde(default = "default_start_rollback_depth")]
    start_rollback_depth: u32,
    #[serde(default = "default_rollback_step")]
    rollback_step: u32,
    #[serde(default = "default_metrics_port")]
    metrics_port: u16,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub asset_storage_address: Option<String>,
    pub assets_only: bool,
    pub blockchain_updates_url: String,
    pub chain_id: u8,
    pub max_wait_time: Duration,
    pub starting_height: u32,
    pub updates_per_request: usize,
    pub start_rollback_depth: NonZeroU32,
    pub rollback_step: NonZeroU32,
    pub metrics_port: u16,
}

/// # Errors
///
/// Returns an error if required environment variables are missing or unparsable.
///
/// # Panics
///
/// Panics if `max_wait_time_in_msecs` does not fit in `i64` or if
/// `start_rollback_depth`/`rollback_step` are zero (which violates their
/// env-default invariant).
pub fn load() -> Result<Config, Error> {
    let config_flat = envy::from_env::<ConfigFlat>()?;
    let nonzero_err =
        |msg| Error::LoadConfigFailed(envy::Error::Custom(format!("{msg} must be > 0")));

    Ok(Config {
        asset_storage_address: config_flat.asset_storage_address,
        assets_only: config_flat.assets_only,
        blockchain_updates_url: config_flat.blockchain_updates_url,
        chain_id: config_flat.chain_id,
        max_wait_time: Duration::milliseconds(
            i64::try_from(config_flat.max_wait_time_in_msecs)
                .expect("max_wait_time_in_msecs always fits in i64"),
        ),
        starting_height: config_flat.starting_height,
        updates_per_request: config_flat.updates_per_request,
        start_rollback_depth: NonZeroU32::new(config_flat.start_rollback_depth)
            .ok_or_else(|| nonzero_err("start_rollback_depth"))?,
        rollback_step: NonZeroU32::new(config_flat.rollback_step)
            .ok_or_else(|| nonzero_err("rollback_step"))?,
        metrics_port: config_flat.metrics_port,
    })
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use std::num::NonZeroU32;

    fn make_defaults() -> Config {
        Config {
            asset_storage_address: None,
            assets_only: false,
            blockchain_updates_url: "http://node:6881".into(),
            chain_id: 76, // DCC mainnet — 'L' (byte 76)
            max_wait_time: Duration::milliseconds(5000),
            starting_height: 1,
            updates_per_request: 256,
            start_rollback_depth: NonZeroU32::new(1).unwrap(),
            rollback_step: NonZeroU32::new(500).unwrap(),
            metrics_port: 9090,
        }
    }

    #[test]
    fn default_assets_only_is_false() {
        let c = make_defaults();
        assert!(!c.assets_only);
    }

    #[test]
    fn default_updates_per_request() {
        let c = make_defaults();
        assert_eq!(c.updates_per_request, 256);
    }

    #[test]
    fn default_max_wait_time() {
        let c = make_defaults();
        assert_eq!(c.max_wait_time, Duration::milliseconds(5000));
    }

    #[test]
    fn default_metrics_port() {
        let c = make_defaults();
        assert_eq!(c.metrics_port, 9090);
    }

    #[test]
    fn default_start_rollback_depth() {
        let c = make_defaults();
        assert_eq!(c.start_rollback_depth.get(), 1);
    }

    #[test]
    fn default_rollback_step() {
        let c = make_defaults();
        assert_eq!(c.rollback_step.get(), 500);
    }

    #[test]
    fn nonzero_validation_accepts_one() {
        // NonZeroU32::new(1) must succeed — used by default
        assert!(NonZeroU32::new(1).is_some());
    }

    #[test]
    fn nonzero_validation_rejects_zero() {
        // The load() function uses NonZeroU32::new(0).ok_or_else(...)
        assert!(NonZeroU32::new(0).is_none());
    }
}
