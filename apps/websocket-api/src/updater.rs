use crate::error::Error;
use crate::metrics::REDIS_QUEUE_DEPTH;
use crate::topic::Topic;
use fred::interfaces::ClientLike;
use fred::prelude::*;
use std::ops::Deref;
use tokio::sync::broadcast::error::RecvError;
use tokio::sync::mpsc::Sender;

/// Async Redis pub/sub listener using fred's native `SubscriberClient`.
///
/// Subscribes to `topic://*` and forwards `(Topic, value)` pairs to the
/// `updates_sender` channel. Fred's `SubscriberClient` automatically re-subscribes
/// after reconnection — no manual reconnect logic is required.
///
/// The `ConnectHandle` returned by `init()` drives the background connection task.
/// We monitor it in the main select so any fatal connection failure propagates up
/// rather than silently disappearing.
pub async fn run(config: Config, updates_sender: Sender<(Topic, String)>) -> Result<(), Error> {
    tracing::info!("updater started");

    let subscriber = Builder::from_config(config)
        .build_subscriber_client()
        .map_err(Error::Redis)?;

    let mut connect_handle = subscriber.init().await?;
    subscriber.psubscribe("topic://*").await?;

    let mut rx = subscriber.message_rx();

    loop {
        tokio::select! {
            result = rx.recv() => {
                match result {
                    Ok(msg) => {
                        let channel: &str = msg.channel.deref();
                        match Topic::parse_str(channel) {
                            Ok(topic) => {
                                if let Some(value) = msg.value.as_string() {
                                    REDIS_QUEUE_DEPTH.inc();
                                    if updates_sender.send((topic, value)).await.is_err() {
                                        tracing::error!("updates channel closed; updates handler has exited");
                                        break;
                                    }
                                }
                            }
                            Err(e) => {
                                tracing::warn!(channel, error = %e, "ignoring unrecognized topic from Redis");
                            }
                        }
                    }
                    Err(RecvError::Lagged(n)) => {
                        tracing::warn!(skipped = n, "subscriber message buffer lagged; some updates dropped");
                    }
                    Err(RecvError::Closed) => {
                        tracing::error!("subscriber message channel closed");
                        break;
                    }
                }
            }
            result = &mut connect_handle => {
                match result {
                    Ok(Ok(())) => tracing::warn!("Redis subscriber connection closed cleanly"),
                    Ok(Err(e)) => tracing::error!(error = %e, "Redis subscriber connection error"),
                    Err(e) => tracing::error!(error = %e, "Redis subscriber connection task panicked"),
                }
                break;
            }
        }
    }

    Ok(())
}
