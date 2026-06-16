use crate::client::ClientSubscriptionKey;
use crate::error::Error;
use axum::extract::ws;
use axum::extract::ws::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Maximum accepted WebSocket message size (64 KiB).
/// Topic URIs and control messages are small; anything larger is rejected before
/// serde_json touches it, preventing memory amplification from adversarial clients.
const MAX_MESSAGE_BYTES: usize = 64 * 1024;

type ErrorCode = u16;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum IncomeMessage {
    Pong(PongMessage),
    Subscribe { topic: ClientSubscriptionKey },
    Unsubscribe { topic: ClientSubscriptionKey },
}

impl TryFrom<ws::Message> for IncomeMessage {
    type Error = Error;

    fn try_from(msg: ws::Message) -> Result<Self, Self::Error> {
        match msg {
            ws::Message::Text(t) => {
                if t.len() > MAX_MESSAGE_BYTES {
                    return Err(Error::UnknownIncomeMessage(format!(
                        "message too large: {} bytes (max {MAX_MESSAGE_BYTES})",
                        t.len()
                    )));
                }
                serde_json::from_str(t.as_str()).map_err(|e| match e.classify() {
                    serde_json::error::Category::Data => Error::UnknownIncomeMessage(e.to_string()),
                    _ => Error::SerdeJson(e),
                })
            }
            ws::Message::Binary(b) => {
                if b.len() > MAX_MESSAGE_BYTES {
                    return Err(Error::UnknownIncomeMessage(format!(
                        "binary message too large: {} bytes (max {MAX_MESSAGE_BYTES})",
                        b.len()
                    )));
                }
                serde_json::from_slice(&b).map_err(|e| match e.classify() {
                    serde_json::error::Category::Data => Error::UnknownIncomeMessage(e.to_string()),
                    _ => Error::SerdeJson(e),
                })
            }
            _ => Err(Error::UnknownIncomeMessage("non-text message".to_owned())),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PongMessage {
    pub message_number: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum OutcomeMessage {
    Ping {
        message_number: i64,
    },
    Update {
        message_number: i64,
        topic: ClientSubscriptionKey,
        value: String,
    },
    Subscribed {
        message_number: i64,
        topic: ClientSubscriptionKey,
        value: String,
    },
    Unsubscribed {
        message_number: i64,
        topic: ClientSubscriptionKey,
    },
    Error {
        message_number: i64,
        code: ErrorCode,
        message: String,
        details: Option<HashMap<String, String>>,
    },
}

impl From<OutcomeMessage> for Message {
    fn from(om: OutcomeMessage) -> Self {
        // OutcomeMessage contains only i64, u16, String, and Option<HashMap<String, String>>.
        // None of these can produce a serde_json error; the expect is statically sound.
        let json = serde_json::to_string(&om).expect("OutcomeMessage serialization cannot fail");
        Message::Text(json.into())
    }
}
