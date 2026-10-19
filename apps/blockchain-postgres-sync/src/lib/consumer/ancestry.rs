//! Resume safety: before streaming, compare the stored chain with the node.
//!
//! BPS resumes from the height recorded in Postgres. After a re-genesis that
//! height belongs to a dead chain, and resuming silently mixes two chains (the
//! 2026-09-04 relaunch left heights 1-1741 from the old chain in the index).
//! [`verify`] compares the stored genesis block and the last solid block with the
//! node and refuses to start on a mismatch.

use anyhow::Result;
use tracing::info;

use super::repo::{Repo, RepoOperations};
use crate::error::Error as AppError;

/// Source of canonical block ids (the node).
#[allow(async_fn_in_trait)]
pub trait BlockIdSource {
    /// Id of the node's block at `height`.
    ///
    /// # Errors
    ///
    /// [`AppError::StreamError`] if the node cannot answer (unreachable, or not at
    /// that height yet). Callers retry those.
    async fn block_id_at(&self, height: u32) -> Result<String, AppError>;
}

/// Heights whose stored key-block id must equal the node's before resuming:
/// genesis, and the last solid block (`current - 1`). The tip block itself may
/// still be liquid, so its stored id can legitimately differ.
#[must_use]
pub fn heights_to_check(current_height: u32) -> Vec<u32> {
    match current_height {
        0 => vec![],
        1 | 2 => vec![1],
        h => vec![1, h - 1],
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct StoredBlock {
    height: u32,
    id: String,
}

/// Compares the stored chain with the node.
///
/// # Errors
///
/// - [`AppError::InconsistentDataError`] when a stored block id differs from the
///   node's. This is fatal: the index describes another chain or fork and must be
///   reset (`infra/runbooks/reset-bps-testnet.md`).
/// - [`AppError::StreamError`] when the node cannot answer yet (retryable).
/// - Database errors.
pub async fn verify<S: BlockIdSource, R: Repo>(source: &S, repo: &R) -> Result<()> {
    let stored: Vec<StoredBlock> = repo
        .transaction(|ops| {
            let current = u32::try_from(ops.get_current_height()?)?;
            let mut out = Vec::new();
            for height in heights_to_check(current) {
                if let Some(id) = ops.get_key_block_id_at_height(i32::try_from(height)?)? {
                    out.push(StoredBlock { height, id });
                }
            }
            Ok(out)
        })
        .await?;

    for block in &stored {
        let node_id = source.block_id_at(block.height).await?;
        if node_id != block.id {
            return Err(AppError::InconsistentDataError(format!(
                "stored block at height {} is {} but the node has {}: the index belongs to \
                 another chain or fork. Refusing to resume; reset the BPS database \
                 (infra/runbooks/reset-bps-testnet.md)",
                block.height, block.id, node_id
            ))
            .into());
        }
    }

    info!(checked = stored.len(), "chain ancestry check passed");
    Ok(())
}
