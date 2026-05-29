use crate::schema::dcc_data;
use bigdecimal::BigDecimal;
use diesel::Insertable;

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = dcc_data)]
pub struct DccData {
    pub height: i32,
    pub quantity: BigDecimal,
}
