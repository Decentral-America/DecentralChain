pub mod pg;

use std::num::NonZeroU32;

use anyhow::Result;
use chrono::NaiveDateTime;

use super::UidHeight;
use super::models::{
    asset_tickers::{AssetTickerOverride, DeletedAssetTicker, InsertableAssetTicker},
    assets::{AssetOrigin, AssetOverride, AssetUpdate, DeletedAsset},
    block_microblock::BlockMicroblock,
    dcc_data::DccData,
    txs::{
        Tx1, Tx2, Tx3, Tx4, Tx5, Tx6, Tx7, Tx8, Tx9Partial, Tx10, Tx11Combined, Tx12Combined, Tx13,
        Tx14, Tx15, Tx16Combined, Tx17, Tx18Combined, Tx19,
    },
};

#[allow(async_fn_in_trait)]
pub trait Repo {
    type Operations<'c>: RepoOperations + 'c;

    async fn transaction<F, R>(&self, f: F) -> Result<R>
    where
        F: for<'conn> FnOnce(&mut Self::Operations<'conn>) -> Result<R> + Send + 'static,
        R: Send + 'static;
}

/// All methods return [`anyhow::Error`] on database failure.
#[allow(clippy::missing_errors_doc)]
pub trait RepoOperations {
    //
    // COMMON
    //

    fn get_current_height(&mut self) -> Result<i32>;

    fn get_blocks_rollback_to(
        &mut self,
        depth: NonZeroU32,
        rollback_step: NonZeroU32,
    ) -> Result<Option<Vec<UidHeight>>>;

    fn get_block_uid_height(&mut self, block_id: &str) -> Result<UidHeight>;

    fn get_key_block_uid(&mut self) -> Result<i64>;

    fn get_total_block_id(&mut self) -> Result<Option<String>>;

    fn insert_blocks_or_microblocks(&mut self, blocks: &[BlockMicroblock]) -> Result<Vec<i64>>;

    fn change_block_id(&mut self, block_uid: i64, new_block_id: &str) -> Result<()>;

    fn delete_microblocks(&mut self) -> Result<()>;

    fn rollback_blocks_microblocks(&mut self, block_uid: i64) -> Result<()>;

    fn insert_dcc_data(&mut self, dcc_data: &[DccData]) -> Result<()>;

    //
    // ASSETS
    //

    fn get_next_assets_uid(&mut self) -> Result<i64>;

    fn insert_asset_updates(&mut self, updates: &[AssetUpdate]) -> Result<()>;

    fn insert_asset_origins(&mut self, origins: &[AssetOrigin]) -> Result<()>;

    fn update_assets_block_references(&mut self, block_uid: i64) -> Result<()>;

    fn close_assets_superseded_by(&mut self, updates: &[AssetOverride]) -> Result<()>;

    fn reopen_assets_superseded_by(&mut self, current_superseded_by: &[i64]) -> Result<()>;

    fn set_assets_next_update_uid(&mut self, new_uid: i64) -> Result<()>;

    fn rollback_assets(&mut self, block_uid: i64) -> Result<Vec<DeletedAsset>>;

    fn assets_gt_block_uid(&mut self, block_uid: i64) -> Result<Vec<i64>>;

    fn insert_asset_tickers(&mut self, tickers: &[InsertableAssetTicker]) -> Result<()>;

    fn rollback_asset_tickers(&mut self, block_uid: &i64) -> Result<Vec<DeletedAssetTicker>>;

    fn update_asset_tickers_block_references(&mut self, block_uid: i64) -> Result<()>;

    fn reopen_asset_tickers_superseded_by(&mut self, current_superseded_by: &[i64]) -> Result<()>;

    fn close_asset_tickers_superseded_by(&mut self, updates: &[AssetTickerOverride]) -> Result<()>;

    fn set_asset_tickers_next_update_uid(&mut self, new_uid: i64) -> Result<()>;

    fn get_next_asset_tickers_uid(&mut self) -> Result<i64>;

    //
    // TRANSACTIONS
    //

    fn update_transactions_references(&mut self, block_uid: i64) -> Result<()>;

    fn rollback_transactions(&mut self, block_uid: i64) -> Result<()>;

    fn insert_txs_1(&mut self, txs: Vec<Tx1>) -> Result<()>;

    fn insert_txs_2(&mut self, txs: Vec<Tx2>) -> Result<()>;

    fn insert_txs_3(&mut self, txs: Vec<Tx3>) -> Result<()>;

    fn insert_txs_4(&mut self, txs: Vec<Tx4>) -> Result<()>;

    fn insert_txs_5(&mut self, txs: Vec<Tx5>) -> Result<()>;

    fn insert_txs_6(&mut self, txs: Vec<Tx6>) -> Result<()>;

    fn insert_txs_7(&mut self, txs: Vec<Tx7>) -> Result<()>;

    fn insert_txs_8(&mut self, txs: Vec<Tx8>) -> Result<()>;

    fn insert_txs_9(&mut self, txs: Vec<Tx9Partial>) -> Result<()>;

    fn insert_txs_10(&mut self, txs: Vec<Tx10>) -> Result<()>;

    fn insert_txs_11(&mut self, txs: Vec<Tx11Combined>) -> Result<()>;

    fn insert_txs_12(&mut self, txs: Vec<Tx12Combined>) -> Result<()>;

    fn insert_txs_13(&mut self, txs: Vec<Tx13>) -> Result<()>;

    fn insert_txs_14(&mut self, txs: Vec<Tx14>) -> Result<()>;

    fn insert_txs_15(&mut self, txs: Vec<Tx15>) -> Result<()>;

    fn insert_txs_16(&mut self, txs: Vec<Tx16Combined>) -> Result<()>;

    fn insert_txs_17(&mut self, txs: Vec<Tx17>) -> Result<()>;

    fn insert_txs_18(&mut self, txs: Vec<Tx18Combined>) -> Result<()>;

    fn insert_txs_19(&mut self, txs: Vec<Tx19>) -> Result<()>;

    //
    // CANDLES
    //

    fn calculate_candles_since_block_uid(&mut self, block_uid: i64) -> Result<()>;

    fn calculate_minute_candles(&mut self, ts: NaiveDateTime) -> Result<()>;

    fn calculate_non_minute_candles(&mut self, ts: NaiveDateTime) -> Result<()>;

    fn rollback_candles(&mut self, block_uid: i64) -> Result<()>;
}
