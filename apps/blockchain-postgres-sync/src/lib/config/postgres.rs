use crate::error::Error;
use serde::Deserialize;

const fn default_port() -> u16 {
    5432
}

const fn default_poolsize() -> u32 {
    1
}

#[derive(Deserialize)]
struct ConfigFlat {
    host: String,
    #[serde(default = "default_port")]
    port: u16,
    database: String,
    user: String,
    password: String,
    #[serde(default = "default_poolsize")]
    poolsize: u32,
}

#[derive(Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub user: String,
    pub password: String,
    pub poolsize: u32,
}

// Manual Debug implementation to prevent the database password from appearing
// in log output, panic messages, or error chains.
impl std::fmt::Debug for Config {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Config")
            .field("host", &self.host)
            .field("port", &self.port)
            .field("database", &self.database)
            .field("user", &self.user)
            .field("password", &"[REDACTED]")
            .field("poolsize", &self.poolsize)
            .finish()
    }
}

impl Config {
    #[must_use]
    pub fn database_url(&self) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}",
            self.user, self.password, self.host, self.port, self.database
        )
    }
}

/// # Errors
///
/// Returns an error if the `POSTGRES__*` environment variables are missing or unparsable.
pub fn load() -> Result<Config, Error> {
    let config_flat = envy::prefixed("POSTGRES__").from_env::<ConfigFlat>()?;

    Ok(Config {
        host: config_flat.host,
        port: config_flat.port,
        database: config_flat.database,
        user: config_flat.user,
        password: config_flat.password,
        poolsize: config_flat.poolsize,
    })
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn sample_config(port: u16) -> Config {
        Config {
            host: "localhost".into(),
            port,
            database: "mydb".into(),
            user: "admin".into(),
            password: "secret".into(),
            poolsize: 5,
        }
    }

    #[test]
    fn database_url_format() {
        let cfg = sample_config(5432);
        assert_eq!(
            cfg.database_url(),
            "postgres://admin:secret@localhost:5432/mydb"
        );
    }

    #[test]
    fn database_url_custom_port() {
        let cfg = sample_config(9999);
        assert!(cfg.database_url().contains(":9999/"));
    }

    #[test]
    fn default_port_value() {
        assert_eq!(default_port(), 5432);
    }

    #[test]
    fn default_poolsize_value() {
        assert_eq!(default_poolsize(), 1);
    }

    #[test]
    fn database_url_contains_user_and_db() {
        let cfg = sample_config(5432);
        let url = cfg.database_url();
        assert!(url.contains("admin"));
        assert!(url.contains("mydb"));
        assert!(url.starts_with("postgres://"));
    }
}
