pub mod models;
pub mod repo;
pub mod updates;

use crate::proto::dcc::{
    SignedTransaction, Transaction as DccTx,
    data_entry::Value,
    events::{StateUpdate, TransactionMetadata, transaction_metadata::Metadata},
    signed_transaction::Transaction,
    transaction::Data,
};
use crate::publisher::{DataEntryEvent, TxEvent, value_to_json};
use anyhow::{Error, Result};
use bigdecimal::BigDecimal;
use chrono::{DateTime, Duration, NaiveDateTime, Utc};
use itertools::Itertools;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;
use tokio::sync::mpsc::Receiver;
use tracing::{debug, info, warn};

use self::models::{asset_tickers::InsertableAssetTicker, block_microblock::BlockMicroblock};
use self::models::{
    asset_tickers::{AssetTickerOverride, DeletedAssetTicker},
    assets::{AssetOrigin, AssetOverride, AssetUpdate, DeletedAsset},
};
use self::repo::RepoOperations;
use crate::chain::{Address, extract_asset_id};
use crate::error::Error as AppError;
use crate::models::BaseAssetInfoUpdate;
use crate::{
    chain::DCC_ID,
    consumer::models::{
        dcc_data::DccData,
        txs::convert::{Tx as ConvertedTx, TxUidGenerator},
    },
    utils::{epoch_ms_to_naivedatetime, escape_unicode_null},
};
use crate::{config::consumer::Config, utils::into_base58};
use base64::prelude::*;

static UID_GENERATOR: Mutex<TxUidGenerator> = Mutex::new(TxUidGenerator::new(100_000));

#[derive(Clone, Debug)]
pub enum BlockchainUpdate {
    Block(BlockMicroblockAppend),
    Microblock(BlockMicroblockAppend),
    Rollback(String),
}

#[derive(Clone, Debug)]
pub struct BlockMicroblockAppend {
    id: String,
    time_stamp: Option<NaiveDateTime>,
    height: i32,
    updated_dcc_amount: Option<i64>,
    txs: Vec<Tx>,
}

#[derive(Clone, Debug)]
pub struct Tx {
    pub id: String,
    pub data: SignedTransaction,
    pub meta: TransactionMetadata,
    pub state_update: StateUpdate,
}

#[derive(Debug)]
pub struct BlockchainUpdatesWithLastHeight {
    pub last_height: u32,
    pub updates: Vec<BlockchainUpdate>,
}

#[derive(Debug, Queryable, Clone, Copy)]
pub struct UidHeight {
    pub uid: i64,
    pub height: i32,
}

#[derive(Debug)]
enum UpdatesItem {
    Blocks(Vec<BlockMicroblockAppend>),
    Microblock(BlockMicroblockAppend),
    Rollback(String),
}

#[derive(Debug)]
pub struct AssetTickerUpdate {
    pub asset_id: String,
    pub ticker: String,
}

#[allow(async_fn_in_trait)]
pub trait UpdatesSource {
    async fn stream(
        self,
        from_height: u32,
        batch_max_size: usize,
        batch_max_time: Duration,
    ) -> Result<Receiver<BlockchainUpdatesWithLastHeight>, AppError>;
}

// Graceful shutdown: the loop waits for both stream data and termination signals.
// On SIGTERM/SIGINT, the current batch completes its transaction before exiting.
/// # Errors
///
/// Returns an error if the updates source, database, or block-processing logic fails.
///
/// # Panics
///
/// Panics if `height.height` is negative (violates the blockchain protocol invariant).
pub async fn start<T, R>(
    updates_src: T,
    repo: R,
    config: Config,
    publisher: Option<crate::publisher::Publisher>,
) -> Result<()>
where
    T: UpdatesSource + Send + 'static,
    R: repo::Repo + Clone + Send + 'static,
{
    let Config {
        assets_only,
        chain_id,
        max_wait_time,
        starting_height,
        updates_per_request,
        asset_storage_address,
        start_rollback_depth,
        rollback_step,
        ..
    } = config;

    // SAFETY: Box::leak is intentional here. The address is read-only daemon configuration
    // that is initialised once at startup and referenced from `'static` closures throughout
    // the process lifetime. This is a single, bounded allocation (one short address string)
    // that never grows and is never freed — acceptable for a long-running daemon process.
    let asset_storage_address: Option<&'static str> =
        asset_storage_address.map(|a| &*Box::leak(a.into_boxed_str()));
    let starting_from_height = {
        repo.transaction(move |ops| {
            match ops.get_blocks_rollback_to(start_rollback_depth, rollback_step) {
                Ok(Some(rollback_blocks)) => {
                    rollback(ops, &rollback_blocks, assets_only)?;
                    Ok(rollback_blocks.last().map_or(starting_height, |height| {
                        u32::try_from(height.height).expect("blockchain height is non-negative") + 1
                    }))
                }
                Ok(None) => Ok(starting_height),
                Err(e) => Err(e),
            }
        })
        .await?
    };

    info!(
        "Start fetching updates from height {} (by {} block(s) back)",
        starting_from_height, start_rollback_depth
    );

    let mut rx = updates_src
        .stream(starting_from_height, updates_per_request, max_wait_time)
        .await?;

    let mut shutdown = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())?;

    loop {
        let mut start = Instant::now();

        let updates_with_height = tokio::select! {
            biased;
            _ = shutdown.recv() => {
                warn!("Received SIGTERM, shutting down gracefully");
                break Ok(());
            }
            _ = tokio::signal::ctrl_c() => {
                warn!("Received SIGINT, shutting down gracefully");
                break Ok(());
            }
            msg = rx.recv() => {
                msg.ok_or_else(|| {
                    Error::new(AppError::StreamClosed(
                        "GRPC Stream was closed by the server".to_string(),
                    ))
                })?
            }
        };

        let updates_count = updates_with_height.updates.len();
        info!(
            "{} updates were received in {:?}",
            updates_count,
            start.elapsed()
        );

        let last_height = updates_with_height.last_height;

        start = Instant::now();

        let (de_events, tx_events) = repo
            .transaction(move |ops| {
                let result = handle_updates(
                    updates_with_height,
                    ops,
                    chain_id,
                    assets_only,
                    asset_storage_address,
                )?;

                info!(
                    "{} updates were saved to database in {:?}. Last height is {}.",
                    updates_count,
                    start.elapsed(),
                    last_height,
                );

                Ok(result)
            })
            .await?;

        // Publish after the transaction commits — Redis failures are fire-and-forget.
        if let Some(ref pub_) = publisher {
            tracing::debug!(de = de_events.len(), tx = tx_events.len(), "publishing events to Redis");
            pub_.publish_batch(&de_events).await;
            pub_.publish_tx_batch(&tx_events).await;
        }
    }
}

fn handle_updates<R: RepoOperations>(
    updates_with_height: BlockchainUpdatesWithLastHeight,
    repo: &mut R,
    chain_id: u8,
    assets_only: bool,
    asset_storage_address: Option<&str>,
) -> Result<(Vec<DataEntryEvent>, Vec<TxEvent>)> {
    let mut items: Vec<UpdatesItem> = updates_with_height
        .updates
        .into_iter()
        .fold(Vec::new(), |mut acc, cur| {
            match cur {
                BlockchainUpdate::Block(b) => {
                    info!("Handle block {}, height = {}", b.id, b.height);
                    let len = acc.len();
                    if len > 0 {
                        match acc
                            .last_mut()
                            .expect("len > 0 but last_mut is None — invariant violated")
                        {
                            UpdatesItem::Blocks(v) => {
                                v.push(b);
                            }
                            UpdatesItem::Microblock(_) | UpdatesItem::Rollback(_) => {
                                acc.push(UpdatesItem::Blocks(vec![b]));
                            }
                        }
                    } else {
                        acc.push(UpdatesItem::Blocks(vec![b]));
                    }
                    acc
                }
                BlockchainUpdate::Microblock(mba) => {
                    info!("Handle microblock {}, height = {}", mba.id, mba.height);
                    acc.push(UpdatesItem::Microblock(mba));
                    acc
                }
                BlockchainUpdate::Rollback(sig) => {
                    info!("Handle rollback to {}", sig);
                    acc.push(UpdatesItem::Rollback(sig));
                    acc
                }
            }
        });

    items
        .iter_mut()
        .try_fold(
            (Vec::<DataEntryEvent>::new(), Vec::<TxEvent>::new()),
            |mut acc, update_item| {
                let (de_batch, tx_batch) = match update_item {
                    UpdatesItem::Blocks(ba) => {
                        squash_microblocks(repo, assets_only)?;
                        handle_appends(repo, chain_id, ba, assets_only, asset_storage_address)?
                    }
                    UpdatesItem::Microblock(mba) => handle_appends(
                        repo,
                        chain_id,
                        std::slice::from_ref(mba),
                        assets_only,
                        asset_storage_address,
                    )?,
                    UpdatesItem::Rollback(sig) => {
                        let block = repo.get_block_uid_height(sig)?;
                        rollback(repo, &[block], assets_only)?;
                        (vec![], vec![]) // rollbacks publish nothing
                    }
                };
                acc.0.extend(de_batch);
                acc.1.extend(tx_batch);
                Ok(acc)
            },
        )
}

fn handle_appends<R>(
    repo: &mut R,
    chain_id: u8,
    appends: &[BlockMicroblockAppend],
    assets_only: bool,
    asset_storage_address: Option<&str>,
) -> Result<(Vec<DataEntryEvent>, Vec<TxEvent>)>
where
    R: RepoOperations,
{
    let block_uids = repo.insert_blocks_or_microblocks(
        &appends
            .iter()
            .map(|append| BlockMicroblock {
                id: append.id.clone(),
                height: append.height,
                time_stamp: append.time_stamp,
            })
            .collect_vec(),
    )?;

    let block_uids_with_appends = block_uids.into_iter().zip(appends).collect_vec();

    let _span_handling = tracing::debug_span!("blockchain updates handling").entered();

    let base_asset_info_updates_with_block_uids: Vec<(i64, BaseAssetInfoUpdate)> =
        block_uids_with_appends
            .iter()
            .flat_map(|(block_uid, append)| {
                extract_base_asset_info_updates(chain_id, append)
                    .into_iter()
                    .map(|au| (*block_uid, au))
                    .collect_vec()
            })
            .collect();

    let inserted_uids =
        handle_base_asset_info_updates(repo, &base_asset_info_updates_with_block_uids)?;

    let updates_amount = base_asset_info_updates_with_block_uids.len();

    if let Some(uids) = inserted_uids {
        assert_eq!(uids.len(), base_asset_info_updates_with_block_uids.len());
        let asset_origins = uids
            .into_iter()
            .zip(base_asset_info_updates_with_block_uids)
            .map(|(uid, (_, au))| AssetOrigin {
                asset_id: au.id,
                first_asset_update_uid: uid,
                origin_transaction_id: au.tx_id,
                issuer: au.issuer,
                issue_height: au.update_height,
                issue_time_stamp: au.updated_at.naive_utc(),
            })
            .collect_vec();

        assert_eq!(asset_origins.len(), updates_amount);
        repo.insert_asset_origins(&asset_origins)?;
    }

    info!("handled {} assets updates", updates_amount);

    if !assets_only {
        handle_txs(repo, &block_uids_with_appends, chain_id)?;

        let dcc_data = appends
            .iter()
            .filter_map(|append| {
                append.updated_dcc_amount.map(|reward| DccData {
                    height: append.height,
                    quantity: BigDecimal::from(reward),
                })
            })
            .collect_vec();

        if !dcc_data.is_empty() {
            repo.insert_dcc_data(&dcc_data)?;
        }
    }

    if let Some(storage_addr) = asset_storage_address {
        let _span = tracing::debug_span!("handling asset tickers updates").entered();
        let asset_tickers_updates_with_block_uids: Vec<(&i64, AssetTickerUpdate)> =
            block_uids_with_appends
                .iter()
                .flat_map(|(block_uid, append)| {
                    append
                        .txs
                        .iter()
                        .flat_map(|tx| extract_asset_tickers_updates(tx, storage_addr))
                        .map(|u| (block_uid, u))
                        .collect_vec()
                })
                .collect();

        handle_asset_tickers_updates(repo, &asset_tickers_updates_with_block_uids)?;

        info!(
            "handled {} asset tickers updates",
            asset_tickers_updates_with_block_uids.len()
        );
    }

    // Collect all data-entry changes across every transaction in every append.
    // These are returned to the caller and published to Redis after the PG
    // transaction commits — ensuring Redis only reflects committed state.
    let data_entry_events: Vec<DataEntryEvent> = appends
        .iter()
        .filter(|_| !assets_only)
        .flat_map(|append| {
            append.txs.iter().flat_map(|tx| {
                tx.state_update.data_entries.iter().filter_map(|update| {
                    update.data_entry.as_ref().map(|de| {
                        let address = bs58::encode(&update.address).into_string();
                        let channel = format!("topic://state/{address}/{}", de.key);
                        let value = value_to_json(de.value.as_ref());
                        DataEntryEvent { channel, value }
                    })
                })
            })
        })
        .collect();

    // Collect transaction events for `topic://transactions?type=…&address=…`.
    // Published after commit alongside data-entry events.
    let tx_events: Vec<TxEvent> = if assets_only {
        vec![]
    } else {
        appends
            .iter()
            .flat_map(|append| {
                append.txs.iter().filter_map(|tx| {
                    tx_event_for_tx(tx, append.height)
                })
            })
            .collect()
    };

    Ok((data_entry_events, tx_events))
}

/// Build a [`TxEvent`] from a single blockchain transaction.
///
/// Returns `None` if the sender address is empty (genesis/system txs).
fn tx_event_for_tx(tx: &Tx, height: i32) -> Option<TxEvent> {
    let sender = bs58::encode(&tx.meta.sender_address).into_string();
    if sender.is_empty() {
        return None;
    }

    // Determine transaction type number and recipient address(es).
    let (tx_type, timestamp, recipients, amount, asset_id) = match &tx.data.transaction {
        Some(Transaction::DccTransaction(inner)) => {
            let ts = inner.timestamp;
            match &inner.data {
                Some(Data::Transfer(t)) => {
                    let recipient = if let Some(Metadata::Transfer(m)) = &tx.meta.metadata {
                        let addr = bs58::encode(&m.recipient_address).into_string();
                        if addr.is_empty() { vec![] } else { vec![addr] }
                    } else {
                        vec![]
                    };
                    let (amt, aid) = t.amount.as_ref().map_or((None, None), |a| {
                        let aid = if a.asset_id.is_empty() { None } else { Some(bs58::encode(&a.asset_id).into_string()) };
                        (Some(a.amount), aid)
                    });
                    (4i32, ts, recipient, amt, aid)
                }
                Some(Data::MassTransfer(t)) => {
                    // Recipient addresses are the resolved base58 addrs from metadata.
                    let recipients = if let Some(Metadata::MassTransfer(m)) = &tx.meta.metadata {
                        m.recipients_addresses
                            .iter()
                            .map(|b| bs58::encode(b).into_string())
                            .filter(|s| !s.is_empty())
                            .collect()
                    } else {
                        vec![]
                    };
                    let aid = if t.asset_id.is_empty() { None } else { Some(bs58::encode(&t.asset_id).into_string()) };
                    (11i32, ts, recipients, None, aid)
                }
                Some(Data::Exchange(_))         => (7i32,  ts, vec![], None, None),
                Some(Data::Lease(_))            => (8i32,  ts, vec![], None, None),
                Some(Data::LeaseCancel(_))      => (9i32,  ts, vec![], None, None),
                Some(Data::Issue(_))            => (3i32,  ts, vec![], None, None),
                Some(Data::Reissue(_))          => (5i32,  ts, vec![], None, None),
                Some(Data::Burn(_))             => (6i32,  ts, vec![], None, None),
                Some(Data::CreateAlias(_))      => (10i32, ts, vec![], None, None),
                Some(Data::DataTransaction(_))  => (12i32, ts, vec![], None, None),
                Some(Data::SetScript(_))        => (13i32, ts, vec![], None, None),
                Some(Data::SponsorFee(_))       => (14i32, ts, vec![], None, None),
                Some(Data::SetAssetScript(_))   => (15i32, ts, vec![], None, None),
                Some(Data::InvokeScript(_))     => (16i32, ts, vec![], None, None),
                Some(Data::UpdateAssetInfo(_))  => (17i32, ts, vec![], None, None),
                Some(Data::InvokeExpression(_)) => (16i32, ts, vec![], None, None),
                Some(Data::CommitToGeneration(_)) => (1i32, ts, vec![], None, None),
                Some(Data::Genesis(_))          => (1i32,  ts, vec![], None, None),
                Some(Data::Payment(_))          => (2i32,  ts, vec![], None, None),
                None => return None,
            }
        }
        Some(Transaction::EthereumTransaction(_)) => (18i32, 0, vec![], None, None),
        None => return None,
    };

    let type_name = tx_type_name(tx_type);

    // Channels: `type=all` and `type=<specific>` for each involved address.
    let all_addresses: Vec<String> = std::iter::once(sender.clone())
        .chain(recipients.iter().cloned())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    let channels: Vec<String> = all_addresses
        .iter()
        .flat_map(|addr| {
            [
                format!("topic://transactions?type=all&address={addr}"),
                format!("topic://transactions?type={type_name}&address={addr}"),
            ]
        })
        .collect();

    // Build JSON matching the DCC node REST API shape the exchange expects.
    let mut json = serde_json::json!({
        "id":        tx.id,
        "type":      tx_type,
        "sender":    sender,
        "timestamp": timestamp,
        "height":    height,
        "applicationStatus": "succeeded",
    });

    if let Some(first_recipient) = recipients.first() {
        json["recipient"] = serde_json::Value::String(first_recipient.clone());
    }
    if let Some(a) = amount {
        json["amount"] = serde_json::Value::Number(a.into());
    }
    if let Some(aid) = asset_id {
        json["assetId"] = serde_json::Value::String(aid);
    }

    Some(TxEvent {
        channels,
        value: json.to_string(),
    })
}

fn tx_type_name(tx_type: i32) -> &'static str {
    match tx_type {
        1  => "genesis",
        2  => "payment",
        3  => "issue",
        4  => "transfer",
        5  => "reissue",
        6  => "burn",
        7  => "exchange",
        8  => "lease",
        9  => "lease_cancel",
        10 => "create_alias",
        11 => "mass_transfer",
        12 => "data",
        13 => "set_script",
        14 => "sponsorship",
        15 => "set_asset_script",
        16 => "invoke_script",
        17 => "update_asset_info",
        18 => "ethereum",
        _  => "unknown",
    }
}

#[allow(clippy::significant_drop_tightening)]
fn handle_txs<R: RepoOperations>(
    repo: &mut R,
    block_uid_data: &[(i64, &BlockMicroblockAppend)],
    chain_id: u8,
) -> Result<(), Error> {
    let mut txs_1 = vec![];
    let mut txs_2 = vec![];
    let mut txs_3 = vec![];
    let mut txs_4 = vec![];
    let mut txs_5 = vec![];
    let mut txs_6 = vec![];
    let mut txs_7 = vec![];
    let mut txs_8 = vec![];
    let mut txs_9 = vec![];
    let mut txs_10 = vec![];
    let mut txs_11 = vec![];
    let mut txs_12 = vec![];
    let mut txs_13 = vec![];
    let mut txs_14 = vec![];
    let mut txs_15 = vec![];
    let mut txs_16 = vec![];
    let mut txs_17 = vec![];
    let mut txs_18 = vec![];

    let txs_count = block_uid_data
        .iter()
        .fold(0usize, |txs, (_, block)| txs + block.txs.len());
    info!("handling {} transactions", txs_count);

    let mut first_block_with_tx7_uid = None::<i64>;

    let mut ugen = UID_GENERATOR
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    for &(block_uid, bm) in block_uid_data {
        ugen.maybe_update_height(bm.height);

        for tx in &bm.txs {
            let tx_uid = ugen.next_uid();
            let result_tx = ConvertedTx::try_from((
                &tx.data, &tx.id, bm.height, &tx.meta, tx_uid, block_uid, chain_id,
            ))?;
            match result_tx {
                ConvertedTx::Genesis(t) => txs_1.push(t),
                ConvertedTx::Payment(t) => txs_2.push(t),
                ConvertedTx::Issue(t) => txs_3.push(t),
                ConvertedTx::Transfer(t) => txs_4.push(t),
                ConvertedTx::Reissue(t) => txs_5.push(t),
                ConvertedTx::Burn(t) => txs_6.push(t),
                ConvertedTx::Exchange(t) => {
                    if first_block_with_tx7_uid.is_none() {
                        first_block_with_tx7_uid = Some(block_uid);
                    }
                    txs_7.push(t);
                }
                ConvertedTx::Lease(t) => txs_8.push(t),
                ConvertedTx::LeaseCancel(t) => txs_9.push(t),
                ConvertedTx::CreateAlias(t) => txs_10.push(t),
                ConvertedTx::MassTransfer(t) => txs_11.push(t),
                ConvertedTx::DataTransaction(t) => txs_12.push(t),
                ConvertedTx::SetScript(t) => txs_13.push(t),
                ConvertedTx::SponsorFee(t) => txs_14.push(t),
                ConvertedTx::SetAssetScript(t) => txs_15.push(t),
                ConvertedTx::InvokeScript(t) => txs_16.push(t),
                ConvertedTx::UpdateAssetInfo(t) => txs_17.push(t),
                ConvertedTx::Ethereum(t) => txs_18.push(t),
            }
        }
    }

    #[allow(clippy::items_after_statements)]
    #[inline]
    fn insert_txs<T, F>(txs: Vec<T>, mut inserter: F) -> Result<()>
    where
        T: 'static,
        F: FnMut(Vec<T>) -> Result<()>,
    {
        if !txs.is_empty() {
            inserter(txs)?;
        }
        Ok(())
    }

    insert_txs(txs_1, |txs| repo.insert_txs_1(txs))?;
    insert_txs(txs_2, |txs| repo.insert_txs_2(txs))?;
    insert_txs(txs_3, |txs| repo.insert_txs_3(txs))?;
    insert_txs(txs_4, |txs| repo.insert_txs_4(txs))?;
    insert_txs(txs_5, |txs| repo.insert_txs_5(txs))?;
    insert_txs(txs_6, |txs| repo.insert_txs_6(txs))?;
    insert_txs(txs_7, |txs| repo.insert_txs_7(txs))?;
    insert_txs(txs_8, |txs| repo.insert_txs_8(txs))?;
    insert_txs(txs_9, |txs| repo.insert_txs_9(txs))?;
    insert_txs(txs_10, |txs| repo.insert_txs_10(txs))?;
    insert_txs(txs_11, |txs| repo.insert_txs_11(txs))?;
    insert_txs(txs_12, |txs| repo.insert_txs_12(txs))?;
    insert_txs(txs_13, |txs| repo.insert_txs_13(txs))?;
    insert_txs(txs_14, |txs| repo.insert_txs_14(txs))?;
    insert_txs(txs_15, |txs| repo.insert_txs_15(txs))?;
    insert_txs(txs_16, |txs| repo.insert_txs_16(txs))?;
    insert_txs(txs_17, |txs| repo.insert_txs_17(txs))?;
    insert_txs(txs_18, |txs| repo.insert_txs_18(txs))?;

    info!("{} transactions handled", txs_count);

    if let Some(block_uid) = first_block_with_tx7_uid {
        let _span = tracing::debug_span!("calculating candles").entered();

        repo.calculate_candles_since_block_uid(block_uid)?;
    }

    Ok(())
}

#[allow(clippy::option_if_let_else)]
fn extract_base_asset_info_updates(
    chain_id: u8,
    append: &BlockMicroblockAppend,
) -> Vec<BaseAssetInfoUpdate> {
    let mut asset_updates = vec![];

    let mut updates_from_txs = append
        .txs
        .iter()
        .flat_map(|tx: &Tx| {
            tx.state_update
                .assets
                .iter()
                .filter_map(|asset_update| {
                    if let Some(asset_details) = &asset_update.after {
                        let asset_id = extract_asset_id(&asset_details.asset_id);

                        if asset_id == DCC_ID {
                            return None;
                        }

                        let time_stamp = match tx.data.transaction.as_ref() {
                            Some(stx) => match stx {
                                Transaction::DccTransaction(DccTx { timestamp, .. }) => {
                                    let dt = epoch_ms_to_naivedatetime(*timestamp);
                                    DateTime::from_naive_utc_and_offset(dt, Utc)
                                }
                                Transaction::EthereumTransaction(_) => {
                                    if let Some(Metadata::Ethereum(meta)) = &tx.meta.metadata {
                                        let dt = epoch_ms_to_naivedatetime(meta.timestamp);
                                        DateTime::from_naive_utc_and_offset(dt, Utc)
                                    } else {
                                        // Protocol inconsistency: Ethereum tx with non-Ethereum metadata.
                                        // Fall back to current time so the asset update is not lost.
                                        tracing::warn!(
                                            tx_id = %tx.id,
                                            "Ethereum tx has non-Ethereum metadata; using current time"
                                        );
                                        Utc::now()
                                    }
                                }
                            },
                            _ => Utc::now(),
                        };

                        let issuer =
                            Address::from((asset_details.issuer.as_slice(), chain_id)).into();
                        Some(BaseAssetInfoUpdate {
                            update_height: append.height,
                            updated_at: time_stamp,
                            id: asset_id,
                            name: escape_unicode_null(&asset_details.name),
                            description: escape_unicode_null(&asset_details.description),
                            issuer,
                            precision: asset_details.decimals,
                            script: asset_details.script_info.clone().map(|s| s.script),
                            nft: asset_details.nft,
                            reissuable: asset_details.reissuable,
                            min_sponsored_fee: if asset_details.sponsorship > 0 {
                                Some(asset_details.sponsorship)
                            } else {
                                None
                            },
                            quantity: asset_details.volume.to_owned(),
                            tx_id: tx.id.clone(),
                        })
                    } else {
                        None
                    }
                })
                .collect_vec()
        })
        .collect_vec();

    asset_updates.append(&mut updates_from_txs);
    asset_updates
}

#[allow(clippy::option_if_let_else)]
fn extract_asset_tickers_updates(tx: &Tx, asset_storage_address: &str) -> Vec<AssetTickerUpdate> {
    tx.state_update
        .data_entries
        .iter()
        .filter_map(|data_entry_update| {
            data_entry_update.data_entry.as_ref().and_then(|de| {
                if asset_storage_address == into_base58(&data_entry_update.address)
                    && de.key.starts_with("%s%s__assetId2ticker__")
                {
                    match de.value.as_ref() {
                        Some(value) => match value {
                            Value::StringValue(value) => de
                                .key
                                .strip_prefix("%s%s__assetId2ticker__")
                                .map(|asset_id| AssetTickerUpdate {
                                    asset_id: asset_id.to_owned(),
                                    ticker: value.clone(),
                                }),
                            _ => None,
                        },
                        // key was deleted -> drop asset ticker
                        None => de
                            .key
                            .strip_prefix("%s%s__assetId2ticker__")
                            .map(|asset_id| AssetTickerUpdate {
                                asset_id: asset_id.to_owned(),
                                ticker: String::new(),
                            }),
                    }
                } else {
                    None
                }
            })
        })
        .collect_vec()
}

fn handle_base_asset_info_updates<R: RepoOperations>(
    repo: &mut R,
    updates: &[(i64, BaseAssetInfoUpdate)],
) -> Result<Option<Vec<i64>>> {
    if updates.is_empty() {
        return Ok(None);
    }

    let updates_count = updates.len();
    let assets_next_uid = repo.get_next_assets_uid()?;

    let asset_updates = updates
        .iter()
        .enumerate()
        .map(|(update_idx, (block_uid, update))| AssetUpdate {
            uid: assets_next_uid
                + i64::try_from(update_idx).expect("update batch index bounded by config"),
            superseded_by: -1,
            block_uid: *block_uid,
            asset_id: update.id.clone(),
            name: update.name.clone(),
            description: update.description.clone(),
            nft: update.nft,
            reissuable: update.reissuable,
            decimals: i16::try_from(update.precision)
                .expect("asset decimals bounded to 0-8 << i16::MAX"),
            script: update.script.clone().map(|s| BASE64_STANDARD.encode(s)),
            sponsorship: update.min_sponsored_fee,
            volume: update.quantity,
        })
        .collect_vec();

    let mut assets_grouped: HashMap<AssetUpdate, Vec<AssetUpdate>> = HashMap::new();

    for update in asset_updates {
        let group = assets_grouped.entry(update.clone()).or_insert(vec![]);
        group.push(update);
    }

    let assets_grouped = assets_grouped.into_iter().collect_vec();

    let assets_grouped_with_uids_superseded_by = assets_grouped
        .into_iter()
        .map(|(group_key, group)| {
            let mut updates = group
                .into_iter()
                .sorted_by_key(|item| item.uid)
                .collect::<Vec<AssetUpdate>>();

            let mut last_uid = i64::MAX - 1;
            (
                group_key,
                updates
                    .as_mut_slice()
                    .iter_mut()
                    .rev()
                    .map(|cur| {
                        cur.superseded_by = last_uid;
                        last_uid = cur.uid;
                        cur.to_owned()
                    })
                    .sorted_by_key(|item| item.uid)
                    .collect(),
            )
        })
        .collect::<Vec<(AssetUpdate, Vec<AssetUpdate>)>>();

    let assets_first_uids: Vec<AssetOverride> = assets_grouped_with_uids_superseded_by
        .iter()
        .filter_map(|(_, group)| group.first())
        .map(|first| AssetOverride {
            superseded_by: first.uid,
            id: first.asset_id.clone(),
        })
        .collect();

    repo.close_assets_superseded_by(&assets_first_uids)?;

    let assets_with_uids_superseded_by = &assets_grouped_with_uids_superseded_by
        .into_iter()
        .flat_map(|(_, v)| v)
        .sorted_by_key(|asset| asset.uid)
        .collect_vec();

    repo.insert_asset_updates(assets_with_uids_superseded_by)?;
    repo.set_assets_next_update_uid(
        assets_next_uid
            + i64::try_from(updates_count).expect("asset update batch size bounded by config"),
    )?;

    Ok(Some(
        assets_with_uids_superseded_by
            .iter()
            .map(|a| a.uid)
            .collect_vec(),
    ))
}

fn handle_asset_tickers_updates<R: RepoOperations>(
    repo: &mut R,
    updates: &[(&i64, AssetTickerUpdate)],
) -> Result<()> {
    if updates.is_empty() {
        return Ok(());
    }

    let updates_count = updates.len();

    let asset_tickers_next_uid = repo.get_next_asset_tickers_uid()?;

    let asset_tickers_updates = updates
        .iter()
        .enumerate()
        .map(
            |(update_idx, (block_uid, tickers_update))| InsertableAssetTicker {
                uid: asset_tickers_next_uid
                    + i64::try_from(update_idx)
                        .expect("ticker update batch index bounded by config"),
                superseded_by: -1,
                block_uid: **block_uid,
                asset_id: tickers_update.asset_id.clone(),
                ticker: tickers_update.ticker.clone(),
            },
        )
        .collect_vec();

    let mut asset_tickers_grouped: HashMap<InsertableAssetTicker, Vec<InsertableAssetTicker>> =
        HashMap::new();

    for update in asset_tickers_updates {
        let group = asset_tickers_grouped
            .entry(update.clone())
            .or_insert(vec![]);
        group.push(update);
    }

    let asset_tickers_grouped = asset_tickers_grouped.into_iter().collect_vec();

    let asset_tickers_grouped_with_uids_superseded_by = asset_tickers_grouped
        .into_iter()
        .map(|(group_key, group)| {
            let mut updates = group
                .into_iter()
                .sorted_by_key(|item| item.uid)
                .collect::<Vec<InsertableAssetTicker>>();

            let mut last_uid = i64::MAX - 1;
            (
                group_key,
                updates
                    .as_mut_slice()
                    .iter_mut()
                    .rev()
                    .map(|cur| {
                        cur.superseded_by = last_uid;
                        last_uid = cur.uid;
                        cur.to_owned()
                    })
                    .sorted_by_key(|item| item.uid)
                    .collect(),
            )
        })
        .collect::<Vec<(InsertableAssetTicker, Vec<InsertableAssetTicker>)>>();

    let asset_tickers_first_uids: Vec<AssetTickerOverride> =
        asset_tickers_grouped_with_uids_superseded_by
            .iter()
            .filter_map(|(_, group)| group.first())
            .map(|first| AssetTickerOverride {
                superseded_by: first.uid,
                asset_id: first.asset_id.clone(),
            })
            .collect();

    repo.close_asset_tickers_superseded_by(&asset_tickers_first_uids)?;

    let asset_tickers_with_uids_superseded_by = asset_tickers_grouped_with_uids_superseded_by
        .into_iter()
        .flat_map(|(_, v)| v)
        .sorted_by_key(|asset_tickers| asset_tickers.uid)
        .collect_vec();

    repo.insert_asset_tickers(&asset_tickers_with_uids_superseded_by)?;

    repo.set_asset_tickers_next_update_uid(
        asset_tickers_next_uid
            + i64::try_from(updates_count).expect("ticker update batch size bounded by config"),
    )
}

fn squash_microblocks<R: RepoOperations>(repo: &mut R, assets_only: bool) -> Result<()> {
    let last_microblock_id = repo.get_total_block_id()?;

    if let Some(lmid) = last_microblock_id {
        let last_block_uid = repo.get_key_block_uid()?;

        debug!(
            "squashing into block_uid = {}, new block_id = {}",
            last_block_uid, lmid
        );

        repo.update_assets_block_references(last_block_uid)?;
        repo.update_asset_tickers_block_references(last_block_uid)?;

        if !assets_only {
            repo.update_transactions_references(last_block_uid)?;
        }

        repo.delete_microblocks()?;
        repo.change_block_id(last_block_uid, &lmid)?;
    }

    Ok(())
}

/// # Errors
///
/// Returns an error if any database operation during the rollback fails.
pub fn rollback<R: RepoOperations>(
    repo: &mut R,
    blocks: &[UidHeight],
    assets_only: bool,
) -> Result<()> {
    if let Some(b) = blocks.last() {
        debug!(
            "initiating sequenced rollback to block_uid = {}, height = {}",
            b.uid, b.height
        );
    }

    for &block in blocks {
        let UidHeight { uid, height } = block;

        debug!("rolling back to block_uid = {}, height = {}", uid, height);

        rollback_assets(repo, uid)?;
        rollback_asset_tickers(repo, uid)?;

        if !assets_only {
            repo.rollback_transactions(uid)?;
            rollback_candles(repo, uid)?;
        }

        repo.rollback_blocks_microblocks(uid)?;
    }
    Ok(())
}

fn rollback_assets<R: RepoOperations>(repo: &mut R, block_uid: i64) -> Result<()> {
    let deleted = repo.rollback_assets(block_uid)?;

    let mut grouped_deleted: HashMap<DeletedAsset, Vec<DeletedAsset>> = HashMap::new();

    for item in deleted {
        let group = grouped_deleted.entry(item.clone()).or_insert(vec![]);
        group.push(item);
    }

    let lowest_deleted_uids: Vec<i64> = grouped_deleted
        .into_values()
        .filter_map(|group| group.into_iter().min_by_key(|i| i.uid).map(|i| i.uid))
        .collect();

    repo.reopen_assets_superseded_by(&lowest_deleted_uids)
}

fn rollback_asset_tickers<R: RepoOperations>(repo: &mut R, block_uid: i64) -> Result<()> {
    let deleted = repo.rollback_asset_tickers(&block_uid)?;

    let mut grouped_deleted: HashMap<DeletedAssetTicker, Vec<DeletedAssetTicker>> = HashMap::new();

    for item in deleted {
        let group = grouped_deleted.entry(item.clone()).or_insert(vec![]);
        group.push(item);
    }

    let lowest_deleted_uids: Vec<i64> = grouped_deleted
        .into_values()
        .filter_map(|group| group.into_iter().min_by_key(|i| i.uid).map(|i| i.uid))
        .collect();

    repo.reopen_asset_tickers_superseded_by(&lowest_deleted_uids)
}

fn rollback_candles<R: RepoOperations>(repo: &mut R, block_uid: i64) -> Result<()> {
    repo.rollback_candles(block_uid)?;
    repo.calculate_candles_since_block_uid(block_uid)
}
