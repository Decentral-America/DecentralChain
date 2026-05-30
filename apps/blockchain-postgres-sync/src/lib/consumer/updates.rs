use crate::proto::dcc::{
    block::Header as HeaderPB,
    events::{
        blockchain_updated::append::{
            BlockAppend as BlockAppendPB, Body as BodyPB, MicroBlockAppend as MicroBlockAppendPB,
        },
        blockchain_updated::Append as AppendPB,
        blockchain_updated::Update as UpdatePB,
        grpc::{
            blockchain_updates_api_client::BlockchainUpdatesApiClient,
            SubscribeEvent as SubscribeEventPB, SubscribeRequest as SubscribeRequestPB,
        },
        BlockchainUpdated as BlockchainUpdatedPB,
    },
    Block as BlockPB, SignedMicroBlock as SignedMicroBlockPB,
    SignedTransaction as SignedTransactionPB,
};
use anyhow::Result;
use bs58;
use chrono::Duration;
use std::str;
use std::time::{Duration as StdDuration, Instant};
use tokio::sync::mpsc::{channel, Receiver, Sender};
use tokio::time;
use tonic;
use tracing::{debug, error};

use super::{
    epoch_ms_to_naivedatetime, BlockMicroblockAppend, BlockchainUpdate,
    BlockchainUpdatesWithLastHeight, Tx, UpdatesSource,
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
            BlockchainUpdatesApiClient::connect(blockchain_updates_url.to_owned())
                .await?
                .max_decoding_message_size(MAX_MSG_SIZE)
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

        // 60-second idle timeout: if the gRPC server stops sending messages
        // without closing the stream (hung connection), treat it as a fatal
        // error so the spawned task exits and the process can be restarted.
        const STREAM_IDLE_TIMEOUT: StdDuration = StdDuration::from_secs(60);

        loop {
            let msg = time::timeout(STREAM_IDLE_TIMEOUT, stream.message())
                .await
                .map_err(|_| {
                    AppError::StreamError(
                        "gRPC stream idle for 60 s; server may be hung".to_string(),
                    )
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
                    Some(BodyPB::MicroBlock(MicroBlockAppendPB {
                        micro_block,
                        ..
                    })) => Ok(micro_block.as_mut().and_then(|it| {
                        it.micro_block
                            .as_mut()
                            .map(|it| (it.transactions.drain(..).collect(), None))
                    })),
                    _ => Err(AppError::InvalidMessage(
                        "Append body is empty.".to_string(),
                    )),
                }?;

                let txs = match txs {
                    Some((txs, ..)) => txs
                        .into_iter()
                        .enumerate()
                        .map(|(idx, tx)| {
                            let id = transaction_ids
                                .get(idx)
                                .ok_or_else(|| {
                                    AppError::InvalidMessage(format!(
                                        "transaction_ids missing index {idx}"
                                    ))
                                })?
                                .clone();
                            Ok(Tx {
                                id: bs58::encode(id).into_string(),
                                data: tx,
                                meta: transactions_metadata
                                    .get(idx)
                                    .ok_or_else(|| {
                                        AppError::InvalidMessage(format!(
                                            "transactions_metadata missing index {idx}"
                                        ))
                                    })?
                                    .clone(),
                                state_update: transaction_state_updates
                                    .get(idx)
                                    .ok_or_else(|| {
                                        AppError::InvalidMessage(format!(
                                            "transaction_state_updates missing index {idx}"
                                        ))
                                    })?
                                    .clone(),
                            })
                        })
                        .collect::<Result<Vec<_>, AppError>>()?,
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
