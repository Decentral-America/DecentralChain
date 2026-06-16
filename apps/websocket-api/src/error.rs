use crate::topic::{Topic, TopicParseError};
use axum::extract::ws::Message;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("config load error: {0}")]
    ConfigLoad(#[from] envy::Error),

    #[error("config validation error: {0}")]
    ConfigValidation(String),

    #[error("tokio join error: {0}")]
    Join(#[from] tokio::task::JoinError),

    #[error("serde_json error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("redis error: {0}")]
    Redis(#[from] fred::error::Error),

    #[error("send update error: {0}")]
    SendUpdate(#[from] tokio::sync::mpsc::error::SendError<Topic>),

    #[error("send message error: {0}")]
    SendMessage(#[from] tokio::sync::mpsc::error::SendError<Message>),

    #[error("invalid pong message")]
    InvalidPongMessage,

    #[error("unknown income message: {0}")]
    UnknownIncomeMessage(String),

    #[error("invalid topic from client: {0}")]
    InvalidTopicFromClient(String),

    #[error("invalid topic in redis: {0}")]
    InvalidTopicInRedis(TopicParseError),
}
