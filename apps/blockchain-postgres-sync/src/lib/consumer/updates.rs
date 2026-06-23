use crate::proto::dcc::{
    Block as BlockPB, SignedMicroBlock as SignedMicroBlockPB,
    SignedTransaction as SignedTransactionPB,
    block::Header as HeaderPB,
    events::{
        BlockchainUpdated as BlockchainUpdatedPB,
        blockchain_updated::Append as AppendPB,
        blockchain_updated::Update as UpdatePB,
        blockchain_updated::append::{
            BlockAppend as BlockAppendPB, Body as BodyPB, MicroBlockAppend as MicroBlockAppendPB,
        },
        grpc::{
            SubscribeEvent as SubscribeEventPB, SubscribeRequest as SubscribeRequestPB,
            blockchain_updates_api_client::BlockchainUpdatesApiClient,
        },
    },
};
use anyhow::Result;
use bs58;
use chrono::Duration;
use std::str;
use std::time::{Duration as StdDuration, Instant};
use tokio::sync::mpsc::{Receiver, Sender, channel};
use tokio::time;
use tonic;
use tracing::{debug, error, warn};

use super::{
    BlockMicroblockAppend, BlockchainUpdate, BlockchainUpdatesWithLastHeight, Tx, UpdatesSource,
    epoch_ms_to_naivedatetime,
};
use crate::error::Error as AppError;

#[derive(Clone)]
pub struct UpdatesSourceImpl {
    grpc_client: BlockchainUpdatesApiClient<tonic::transport::Channel>,
}

/// # Errors
///
/// Returns an error if the gRPC channel cannot connect to `blockchain_updates_url`.
pub async fn new(blockchain_updates_url: &str) -> Result<UpdatesSourceImpl> {
    Ok(UpdatesSourceImpl {
        grpc_client: {
            const MAX_MSG_SIZE: usize = 8 * 1024 * 1024; // 8 MB instead of the default 4 MB

            // HTTP/2 keepalive: send PING frames every 30 s so the connection
            // stays alive during chain quiet periods (e.g. quorum lost, no blocks).
            // Without this the stream silently dies after ~180 s of no messages,
            // causing BPS to crash and restart unnecessarily.
            let channel =
                tonic::transport::Endpoint::from_shared(blockchain_updates_url.to_owned())?
                    .http2_keep_alive_interval(StdDuration::from_secs(30))
                    .keep_alive_timeout(StdDuration::from_secs(10))
                    // Send pings even when there are no active RPCs (idle connection).
                    // Required because the BlockchainUpdates subscription is long-lived
                    // and may have no message traffic during chain quiet periods.
                    .keep_alive_while_idle(true)
                    .connect()
                    .await?;

            BlockchainUpdatesApiClient::new(channel).max_decoding_message_size(MAX_MSG_SIZE)
        },
    })
}

impl UpdatesSource for UpdatesSourceImpl {
    async fn stream(
        self,
        from_height: u32,
        batch_max_size: usize,
        batch_max_wait_time: Duration,
    ) -> Result<Receiver<BlockchainUpdatesWithLastHeight>, AppError> {
        let request = tonic::Request::new(SubscribeRequestPB {
            from_height: i32::try_from(from_height)
                .expect("starting height fits in i32, blockchain height << i32::MAX"),
            to_height: 0,
        });

        let stream: tonic::Streaming<SubscribeEventPB> = self
            .grpc_client
            .clone()
            .subscribe(request)
            .await
            .map_err(|e| AppError::StreamError(format!("Subscribe Stream error: {e}")))?
            .into_inner();

        let (tx, rx) = channel::<BlockchainUpdatesWithLastHeight>(1);

        tokio::spawn(async move {
            let r = self
                .run(stream, tx, batch_max_size, batch_max_wait_time)
                .await;
            if let Err(e) = r {
                error!("updates source stopped with error: {:?}", e);
            } else {
                error!("updates source stopped without an error");
            }
        });

        Ok(rx)
    }
}

impl UpdatesSourceImpl {
    async fn run(
        &self,
        mut stream: tonic::Streaming<SubscribeEventPB>,
        tx: Sender<BlockchainUpdatesWithLastHeight>,
        batch_max_size: usize,
        batch_max_wait_time: Duration,
    ) -> Result<(), AppError> {
        let mut result = vec![];
        // Initialized from the first received update; always set before use.
        let mut last_height: u32;

        let mut start = Instant::now();
        let mut should_receive_more = true;

        let batch_max_wait_time = batch_max_wait_time
            .to_std()
            .unwrap_or(std::time::Duration::from_secs(5));

        // Idle timeout: last-resort safety net in case the gRPC server stops
        // sending messages AND stops responding to HTTP/2 PING frames (truly hung).
        // With keepalive enabled, PINGs fire every 30 s so this only triggers if
        // both the stream AND the PING mechanism fail simultaneously.
        // Configurable via BPS_STREAM_IDLE_TIMEOUT_SECS (default 600 = 10 min).
        let idle_secs = std::env::var("BPS_STREAM_IDLE_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(600);
        let stream_idle_timeout = StdDuration::from_secs(idle_secs);

        loop {
            let msg = time::timeout(stream_idle_timeout, stream.message())
                .await
                .map_err(|_| {
                    AppError::StreamError(format!(
                        "gRPC stream idle for {idle_secs} s; server may be hung"
                    ))
                })?
                .map_err(|s| AppError::StreamError(format!("Updates stream error: {s}")))?;

            let Some(SubscribeEventPB {
                update: Some(update),
            }) = msg
            else {
                // The server closed the stream cleanly — treat as a fatal
                // error so the consumer process is restarted by its supervisor.
                return Err(AppError::StreamError(
                    "gRPC stream closed by server".to_string(),
                ));
            };

            last_height =
                u32::try_from(update.height).expect("blockchain height is always non-negative");
            match BlockchainUpdate::try_from(update) {
                Ok(upd) => {
                    let current_batch_size = result.len() + 1;
                    match &upd {
                        BlockchainUpdate::Block(_) => {
                            if current_batch_size >= batch_max_size
                                || start.elapsed().ge(&batch_max_wait_time)
                            {
                                should_receive_more = false;
                            }
                        }
                        BlockchainUpdate::Microblock(_) | BlockchainUpdate::Rollback(_) => {
                            should_receive_more = false;
                        }
                    }
                    result.push(upd);
                    Ok(())
                }
                Err(err) => Err(err),
            }?;

            if !should_receive_more {
                debug!("updating to height {}", last_height);
                tx.send(BlockchainUpdatesWithLastHeight {
                    last_height,
                    updates: std::mem::take(&mut result),
                })
                .await
                .map_err(|e| AppError::StreamError(format!("Channel error: {e}")))?;
                should_receive_more = true;
                start = Instant::now();
            }
            // No explicit sleep here — stream.message() is the natural yield
            // point; adding a sleep would introduce artificial per-message latency.
        }
    }
}

impl TryFrom<BlockchainUpdatedPB> for BlockchainUpdate {
    type Error = AppError;

    #[allow(clippy::too_many_lines)]
    fn try_from(mut value: BlockchainUpdatedPB) -> Result<Self, Self::Error> {
        use BlockchainUpdate::{Block, Microblock, Rollback};

        match &mut value.update {
            Some(UpdatePB::Append(AppendPB {
                body,
                transaction_ids,
                transactions_metadata,
                transaction_state_updates,
                ..
            })) => {
                let height = value.height;

                let txs: Option<(Vec<SignedTransactionPB>, Option<i64>)> = match body {
                    Some(BodyPB::Block(BlockAppendPB { block, .. })) => {
                        Ok(block.as_mut().map(|it| {
                            (
                                it.transactions.drain(..).collect(),
                                it.header.as_ref().map(|it| it.timestamp),
                            )
                        }))
                    }
                    Some(BodyPB::MicroBlock(MicroBlockAppendPB { micro_block, .. })) => {
                        Ok(micro_block.as_mut().and_then(|it| {
                            it.micro_block
                                .as_mut()
                                .map(|it| (it.transactions.drain(..).collect(), None))
                        }))
                    }
                    _ => Err(AppError::InvalidMessage(
                        "Append body is empty.".to_string(),
                    )),
                }?;

                let txs = match txs {
                    Some((txs, ..)) => txs
                        .into_iter()
                        .enumerate()
                        .filter_map(|(idx, tx)| {
                            let id = transaction_ids.get(idx)?;
                            let meta = transactions_metadata.get(idx);
                            let state_updates = transaction_state_updates.get(idx);

                            match (meta, state_updates) {
                                (Some(meta), Some(state_updates)) => {
                                    Some(Tx {
                                        id: bs58::encode(id).into_string(),
                                        data: tx,
                                        meta: meta.clone(),
                                        state_update: state_updates.clone(),
                                    })
                                }
                                _ => {
                                    warn!(
                                        "Skipping transaction id {} due to missing metadata or state update",
                                        bs58::encode(id).into_string()
                                    );
                                    None
                                }
                            }
                        })
                        .collect(),
                    None => vec![],
                };

                match body {
                    Some(BodyPB::Block(BlockAppendPB {
                        block:
                            Some(BlockPB {
                                header: Some(HeaderPB { timestamp, .. }),
                                ..
                            }),
                        updated_dcc_amount,
                        ..
                    })) => Ok(Block(BlockMicroblockAppend {
                        id: bs58::encode(&value.id).into_string(),
                        time_stamp: Some(epoch_ms_to_naivedatetime(*timestamp)),
                        height,
                        updated_dcc_amount: if *updated_dcc_amount > 0 {
                            Some(*updated_dcc_amount)
                        } else {
                            None
                        },
                        txs,
                    })),
                    Some(BodyPB::MicroBlock(MicroBlockAppendPB {
                        micro_block: Some(SignedMicroBlockPB { total_block_id, .. }),
                        ..
                    })) => Ok(Microblock(BlockMicroblockAppend {
                        id: bs58::encode(&total_block_id).into_string(),
                        time_stamp: None,
                        height,
                        updated_dcc_amount: None,
                        txs,
                    })),
                    _ => Err(AppError::InvalidMessage(
                        "Append body is empty.".to_string(),
                    )),
                }
            }
            Some(UpdatePB::Rollback(_)) => Ok(Rollback(bs58::encode(&value.id).into_string())),
            _ => Err(AppError::InvalidMessage(
                "Unknown blockchain update.".to_string(),
            )),
        }
    }
}
