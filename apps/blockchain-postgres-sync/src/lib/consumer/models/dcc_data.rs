use crate::schema::dcc_data;
use bigdecimal::BigDecimal;
use diesel::Insertable;

/// Total DCC quantity after the key block at `height` (one row per height).
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = dcc_data)]
pub struct DccData {
    pub height: i32,
    pub quantity: BigDecimal,
    /// Key block this row belongs to; deleting the block (rollback) deletes the row.
    pub block_uid: Option<i64>,
}
