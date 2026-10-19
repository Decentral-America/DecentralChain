use anyhow::{Error, Result};
use deadpool_diesel::{Manager as DManager, Pool as DPool, Runtime};
use diesel::Connection;
use diesel::pg::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use std::time::Duration;

use crate::config::postgres::Config;
use crate::error::Error as AppError;

pub type PgPool = Pool<ConnectionManager<PgConnection>>;
pub type PgAsyncPool = DPool<DManager<PgConnection>>;

/// # Errors
///
/// Returns an error if the pool builder fails or the configuration is invalid.
#[allow(clippy::unused_async)] // deadpool build() is sync; async signature needed by callers
pub async fn async_pool(config: &Config) -> Result<PgAsyncPool> {
    let db_url = config.database_url();

    let manager = DManager::new(db_url, Runtime::Tokio1);
    let pool = DPool::builder(manager)
        .max_size(config.poolsize as usize)
        .build()?;
    Ok(pool)
}

/// # Errors
///
/// Returns an error if the connection pool cannot be created.
pub fn pool(config: &Config) -> Result<PgPool, AppError> {
    let db_url = config.database_url();

    let manager = ConnectionManager::<PgConnection>::new(db_url);
    Ok(Pool::builder()
        .min_idle(Some(1))
        .max_size(config.poolsize)
        .idle_timeout(Some(Duration::from_secs(60)))
        .connection_timeout(Duration::from_secs(5))
        .build(manager)?)
}

/// # Errors
///
/// Returns an error if the database connection cannot be established.
pub fn unpooled(config: &Config) -> Result<PgConnection> {
    let db_url = config.database_url();

    PgConnection::establish(&db_url).map_err(|err| Error::new(AppError::ConnectionError(err)))
}

/// The schema migrations shipped in this crate (`migrations/`).
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

/// Applies every pending embedded migration and returns the applied versions.
///
/// The consumer calls this on start, so a fresh or reset database, or a new image
/// with new migrations, needs no separate `migration up` step.
///
/// # Errors
///
/// Returns an error if the connection cannot be established or a migration fails.
pub fn run_pending_migrations(config: &Config) -> Result<Vec<String>> {
    let mut conn = unpooled(config)?;
    let applied = conn
        .run_pending_migrations(MIGRATIONS)
        .map_err(|e| anyhow::anyhow!("running schema migrations failed: {e}"))?;
    Ok(applied.into_iter().map(|v| v.to_string()).collect())
}
