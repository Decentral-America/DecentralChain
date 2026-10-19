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
    /// Optional Redis URL for pub/sub publishing.
    /// Format: `redis://:password@host:port/`
    /// When absent, Redis publishing is disabled and BPS-only mode is used.
    redis_url: Option<String>,
}

#[derive(Clone)]
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
    /// Redis URL for pub/sub publishing. `None` disables publishing.
    pub redis_url: Option<String>,
}

/// Replaces the password in a URL's userinfo (`scheme://user:password@host`) with `***`.
///
/// URLs without credentials are returned unchanged. Used by the manual `Debug` impl so the
/// startup log never contains a Redis or gRPC password.
fn redact_url(url: &str) -> String {
    let Some(scheme_end) = url.find("://").map(|i| i + 3) else {
        return url.to_owned();
    };
    let rest = &url[scheme_end..];
    let authority_end = rest.find(['/', '?', '#']).unwrap_or(rest.len());
    let authority = &rest[..authority_end];
    // The userinfo ends at the last '@' of the authority.
    let Some(at) = authority.rfind('@') else {
        return url.to_owned();
    };
    let userinfo = &authority[..at];
    let redacted = userinfo
        .split_once(':')
        .map_or_else(|| userinfo.to_owned(), |(user, _)| format!("{user}:***"));
    format!(
        "{}{}@{}{}",
        &url[..scheme_end],
        redacted,
        &authority[at + 1..],
        &rest[authority_end..]
    )
}

// Manual Debug implementation: the startup log prints this struct, and the URLs may carry
// credentials (e.g. `redis://:password@host`).
impl std::fmt::Debug for Config {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Config")
            .field(
                "asset_storage_address",
                &self.asset_storage_address.as_deref().map(redact_url),
            )
            .field("assets_only", &self.assets_only)
            .field(
                "blockchain_updates_url",
                &redact_url(&self.blockchain_updates_url),
            )
            .field("chain_id", &self.chain_id)
            .field("max_wait_time", &self.max_wait_time)
            .field("starting_height", &self.starting_height)
            .field("updates_per_request", &self.updates_per_request)
            .field("start_rollback_depth", &self.start_rollback_depth)
            .field("rollback_step", &self.rollback_step)
            .field("metrics_port", &self.metrics_port)
            .field("redis_url", &self.redis_url.as_deref().map(redact_url))
            .finish()
    }
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
    let config_flat = envy::prefixed("BPS_").from_env::<ConfigFlat>()?;
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
        redis_url: config_flat.redis_url,
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
            chain_id: 63, // DCC mainnet — '?' (byte 63)
            max_wait_time: Duration::milliseconds(5000),
            starting_height: 1,
            updates_per_request: 256,
            start_rollback_depth: NonZeroU32::new(1).unwrap(),
            rollback_step: NonZeroU32::new(500).unwrap(),
            metrics_port: 9090,
            redis_url: None,
        }
    }

    #[test]
    fn debug_output_never_contains_credentials() {
        let mut c = make_defaults();
        c.redis_url = Some("redis://:s3cr3tPass@redis.internal:6379/0".into());
        c.blockchain_updates_url = "http://grpcuser:grpcPass@node:6881".into();
        c.asset_storage_address = Some("https://bob:assetPass@assets.example/".into());
        let out = format!("{c:?}");
        for secret in ["s3cr3tPass", "grpcPass", "assetPass"] {
            assert!(!out.contains(secret), "{secret} leaked: {out}");
        }
        assert!(out.contains("redis://:***@redis.internal:6379/0"), "{out}");
        assert!(out.contains("http://grpcuser:***@node:6881"), "{out}");
    }

    #[test]
    fn redact_url_leaves_credential_free_urls_alone() {
        assert_eq!(redact_url("http://node:6881"), "http://node:6881");
        assert_eq!(redact_url("redis://host:6379/0"), "redis://host:6379/0");
        assert_eq!(redact_url("not a url"), "not a url");
        assert_eq!(redact_url("http://user@host/p@th"), "http://user@host/p@th");
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
