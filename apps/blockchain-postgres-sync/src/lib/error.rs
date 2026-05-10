#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("LoadConfigFailed: {0}")]
    LoadConfigFailed(#[from] envy::Error),

    #[error("InvalidMessage: {0}")]
    InvalidMessage(String),

    #[error("DbDieselError: {0}")]
    DbDieselError(#[from] diesel::result::Error),

    #[error("DeadpoolError: {0}")]
    DeadpoolError(String),

    #[error("ConnectionPoolError: {0}")]
    ConnectionPoolError(#[from] r2d2::Error),

    #[error("ConnectionError: {0}")]
    ConnectionError(#[from] diesel::ConnectionError),

    #[error("StreamClosed: {0}")]
    StreamClosed(String),

    #[error("StreamError: {0}")]
    StreamError(String),

    #[error("SerializationError: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("CursorDecodeError: {0}")]
    CursorDecodeError(#[from] base64::DecodeError),

    #[error("JoinError: {0}")]
    JoinError(#[from] tokio::task::JoinError),

    #[error("InconsistDataError: {0}")]
    InconsistDataError(String),
}

// impl done manually because InteractError is not Sync
impl From<deadpool_diesel::InteractError> for Error {
    fn from(err: deadpool_diesel::InteractError) -> Self {
        Self::DeadpoolError(err.to_string())
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn invalid_message_display() {
        let e = Error::InvalidMessage("bad msg".into());
        assert_eq!(e.to_string(), "InvalidMessage: bad msg");
    }

    #[test]
    fn inconsist_data_display() {
        let e = Error::InconsistDataError("missing field".into());
        assert_eq!(e.to_string(), "InconsistDataError: missing field");
    }

    #[test]
    fn stream_closed_display() {
        let e = Error::StreamClosed("gRPC gone".into());
        assert_eq!(e.to_string(), "StreamClosed: gRPC gone");
    }

    #[test]
    fn stream_error_display() {
        let e = Error::StreamError("timeout".into());
        assert_eq!(e.to_string(), "StreamError: timeout");
    }

    #[test]
    fn deadpool_from_interact_error() {
        // InteractError is non-Sync; we test that From is wired correctly by
        // checking the variant via the manual impl (uses .to_string() internally).
        let e: Error = deadpool_diesel::InteractError::Panic(Box::new("oops")).into();
        assert!(e.to_string().starts_with("DeadpoolError:"));
    }
}
