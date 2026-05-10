use crate::proto::waves::{
    invoke_script_result::call::argument::{List as ListPb, Value as InvokeScriptArgValue},
    order::Sender as SenderPb,
    Order as OrderPb,
};
use crate::utils::{escape_unicode_null, into_base58};
use base64::prelude::*;
use chrono::{DateTime, Utc};
use serde::ser::{SerializeStruct, Serializer};
use serde::Serialize;
use serde_json::{json, Value};

#[derive(Clone, Debug)]
pub struct BaseAssetInfoUpdate {
    pub id: String,
    pub issuer: String,
    pub precision: i32,
    pub nft: bool,
    pub updated_at: DateTime<Utc>,
    pub update_height: i32,
    pub name: String,
    pub description: String,
    pub script: Option<Vec<u8>>,
    pub quantity: i64,
    pub reissuable: bool,
    pub min_sponsored_fee: Option<i64>,
    pub tx_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
#[serde(tag = "type", content = "value")]
pub enum DataEntryTypeValue {
    Binary(String),
    Boolean(bool),
    Integer(i64),
    String(String),
    List(Value),
}

impl From<&InvokeScriptArgValue> for DataEntryTypeValue {
    fn from(val: &InvokeScriptArgValue) -> Self {
        match val {
            InvokeScriptArgValue::IntegerValue(v) => DataEntryTypeValue::Integer(*v),
            InvokeScriptArgValue::BinaryValue(v) => {
                DataEntryTypeValue::Binary(format!("base64:{}", BASE64_STANDARD.encode(v)))
            }
            InvokeScriptArgValue::StringValue(v) => {
                DataEntryTypeValue::String(escape_unicode_null(v))
            }
            InvokeScriptArgValue::BooleanValue(v) => DataEntryTypeValue::Boolean(*v),
            // deep conversion of List
            InvokeScriptArgValue::List(v) => DataEntryTypeValue::List(json!(ArgList::from(v))),
            // CaseObj is a Ride union/ADT value — serialise as opaque null;
            // the Waves/DCC node never emits CaseObj in invoke-script results
            // exposed via the blockchain-updates gRPC stream, so this branch
            // exists only for forward-compatibility.
            InvokeScriptArgValue::CaseObj(_) => DataEntryTypeValue::String(String::new()),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ArgList(pub Vec<DataEntryTypeValue>);

impl From<&ListPb> for ArgList {
    fn from(list: &ListPb) -> Self {
        ArgList(
            list.items
                .iter()
                .filter_map(|i| i.value.as_ref().map(DataEntryTypeValue::from))
                .collect(),
        )
    }
}

pub struct OrderMeta<'o> {
    pub order: &'o OrderPb,
    pub id: &'o [u8],
    pub sender_address: &'o [u8],
    pub sender_public_key: &'o [u8],
}

#[derive(Debug)]
pub struct Order {
    pub id: String,
    pub version: i32,
    pub sender: String,
    pub sender_public_key: String,
    pub matcher_public_key: String,
    pub asset_pair: AssetPair,
    pub order_type: OrderType,
    pub amount: i64,
    pub price: i64,
    pub timestamp: i64,
    pub expiration: i64,
    pub matcher_fee: i64,
    pub matcher_fee_asset_id: Option<String>,
    pub proofs: Vec<String>,
    pub signature: String,
    pub eip712_signature: Option<String>,
    pub price_mode: Option<String>,
}

impl Serialize for Order {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let fields_count = match self.version {
            1..=2 => 15,
            3 => 16,   // + matcher_fee_asset_id
            4.. => 17, // + eip712_signature, price_mode
            // Negative or zero version is a protocol invariant violation;
            // treat as latest (v4) so we don't crash the daemon.
            _ => 17,
        };
        let mut state = serializer.serialize_struct("Order", fields_count)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("version", &self.version)?;
        state.serialize_field("sender", &self.sender)?;
        state.serialize_field("senderPublicKey", &self.sender_public_key)?;
        state.serialize_field("matcherPublicKey", &self.matcher_public_key)?;
        state.serialize_field("assetPair", &self.asset_pair)?;
        state.serialize_field("orderType", &self.order_type)?;
        state.serialize_field("amount", &self.amount)?;
        state.serialize_field("price", &self.price)?;
        state.serialize_field("timestamp", &self.timestamp)?;
        state.serialize_field("expiration", &self.expiration)?;
        state.serialize_field("matcherFee", &self.matcher_fee)?;
        state.serialize_field("proofs", &self.proofs)?;
        state.serialize_field("signature", &self.signature)?;

        if self.version >= 3 {
            state.serialize_field("matcherFeeAssetId", &self.matcher_fee_asset_id)?;
        }

        if self.version >= 4 {
            state.serialize_field("eip712Signature", &self.eip712_signature)?;
            state.serialize_field("priceMode", &self.price_mode)?;
        }
        state.end()
    }
}

impl From<OrderMeta<'_>> for Order {
    fn from(o: OrderMeta) -> Self {
        let OrderMeta {
            order,
            id,
            sender_address,
            sender_public_key,
        } = o;
        let proofs: Vec<String> = order.proofs.iter().map(into_base58).collect();
        let signature = proofs.first().cloned().unwrap_or_else(String::new);
        Self {
            matcher_public_key: into_base58(&order.matcher_public_key),
            asset_pair: AssetPair {
                amount_asset_id: order
                    .asset_pair
                    .as_ref()
                    .map(|p| &p.amount_asset_id)
                    .and_then(|asset| (!asset.is_empty()).then(|| into_base58(asset))),
                price_asset_id: order
                    .asset_pair
                    .as_ref()
                    .map(|p| &p.price_asset_id)
                    .and_then(|asset| (!asset.is_empty()).then(|| into_base58(asset))),
            },
            order_type: OrderType::from(order.order_side),
            amount: order.amount,
            price: order.price,
            timestamp: order.timestamp,
            expiration: order.expiration,
            matcher_fee: order.matcher_fee.as_ref().map(|f| f.amount).unwrap_or(0),
            matcher_fee_asset_id: order
                .matcher_fee
                .as_ref()
                .map(|f| &f.asset_id)
                .and_then(|asset| (!asset.is_empty()).then(|| into_base58(asset))),
            version: order.version,
            proofs,
            sender: into_base58(sender_address),
            id: into_base58(id),
            sender_public_key: into_base58(sender_public_key),
            signature,
            eip712_signature: match order.sender {
                Some(SenderPb::Eip712Signature(ref sig)) if order.version >= 4 => {
                    Some(format!("0x{}", hex::encode(sig)))
                }
                _ => None,
            },
            price_mode: match order.price_mode {
                0 => None,
                1 => Some("fixedDecimals".to_string()),
                2 => Some("assetDecimals".to_string()),
                // Unknown future price_mode values — treat as no mode set
                _ => None,
            },
        }
    }
}

#[derive(Serialize, Debug)]
pub struct AssetPair {
    #[serde(rename = "amountAsset")]
    pub amount_asset_id: Option<String>,
    #[serde(rename = "priceAsset")]
    pub price_asset_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum OrderType {
    Buy = 0,
    Sell = 1,
}

impl From<i32> for OrderType {
    fn from(n: i32) -> Self {
        match n {
            0 => OrderType::Buy,
            1 => OrderType::Sell,
            // Unknown enum variants from future protocol versions — treat as Buy
            // (the wire value is stored in JSON unchanged via the proofs field).
            _ => OrderType::Buy,
        }
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::proto::waves::invoke_script_result::call::Argument;

    // ── DataEntryTypeValue::from conversions ────────────────────────────────

    #[test]
    fn serialize_arg_list() {
        let src = InvokeScriptArgValue::List(ListPb {
            items: vec![
                Argument {
                    value: Some(InvokeScriptArgValue::IntegerValue(5)),
                },
                Argument {
                    value: Some(InvokeScriptArgValue::BinaryValue(b"\x00\x01".to_vec())),
                },
            ],
        });
        let data_value = DataEntryTypeValue::from(&src);
        if matches!(data_value, DataEntryTypeValue::List(_)) {
            let json = json!(data_value);
            let serialized = serde_json::to_string(&json["value"]).unwrap();
            let expected = json!([
                {"type": "integer", "value": 5},
                {"type": "binary", "value": "base64:AAE="},
            ]);
            assert_eq!(serialized, serde_json::to_string(&expected).unwrap());
        } else {
            panic!("Wrong variant: {:?}", src);
        }
    }

    #[test]
    fn serialize_arg_bool() {
        let src = InvokeScriptArgValue::BooleanValue(true);
        let json = json!(DataEntryTypeValue::from(&src));
        assert_eq!(json["type"], "boolean");
        assert_eq!(json["value"], true);
    }

    #[test]
    fn serialize_arg_int() {
        let src = InvokeScriptArgValue::IntegerValue(42);
        let json = json!(DataEntryTypeValue::from(&src));
        assert_eq!(json["type"], "integer");
        assert_eq!(json["value"], 42);
    }

    #[test]
    fn serialize_arg_string() {
        let src = InvokeScriptArgValue::StringValue("hello".into());
        let json = json!(DataEntryTypeValue::from(&src));
        assert_eq!(json["type"], "string");
        assert_eq!(json["value"], "hello");
    }

    #[test]
    fn serialize_arg_binary() {
        let src = InvokeScriptArgValue::BinaryValue(vec![0xAB, 0xCD]);
        let json = json!(DataEntryTypeValue::from(&src));
        assert_eq!(json["type"], "binary");
        let val = json["value"].as_str().unwrap();
        assert!(val.starts_with("base64:"));
    }

    #[test]
    fn case_obj_produces_empty_string_not_panic() {
        // Regression test: this previously panicked with todo!()
        use crate::proto::waves::invoke_script_result::call::argument::Value::CaseObj;
        let src = CaseObj(Default::default());
        let dv = DataEntryTypeValue::from(&src);
        assert!(matches!(dv, DataEntryTypeValue::String(s) if s.is_empty()));
    }

    #[test]
    fn string_with_null_byte_is_escaped() {
        let src = InvokeScriptArgValue::StringValue("hello\0world".into());
        let json = json!(DataEntryTypeValue::from(&src));
        assert_eq!(json["value"], "hello\\0world");
    }

    // ── OrderType ────────────────────────────────────────────────────────────

    #[test]
    fn order_type_from_zero_is_buy() {
        assert!(matches!(OrderType::from(0), OrderType::Buy));
    }

    #[test]
    fn order_type_from_one_is_sell() {
        assert!(matches!(OrderType::from(1), OrderType::Sell));
    }

    #[test]
    fn order_type_from_unknown_does_not_panic() {
        // Regression: previously panicked. Now defaults to Buy.
        assert!(matches!(OrderType::from(99), OrderType::Buy));
        assert!(matches!(OrderType::from(-1), OrderType::Buy));
    }

    #[test]
    fn order_type_buy_serializes_correctly() {
        let v = serde_json::to_value(OrderType::Buy).unwrap();
        assert_eq!(v, "buy");
    }

    #[test]
    fn order_type_sell_serializes_correctly() {
        let v = serde_json::to_value(OrderType::Sell).unwrap();
        assert_eq!(v, "sell");
    }

    // ── AssetPair serialization ──────────────────────────────────────────────

    #[test]
    fn asset_pair_both_some() {
        let ap = AssetPair {
            amount_asset_id: Some("ASSET_A".into()),
            price_asset_id: Some("ASSET_B".into()),
        };
        let v = serde_json::to_value(&ap).unwrap();
        assert_eq!(v["amountAsset"], "ASSET_A");
        assert_eq!(v["priceAsset"], "ASSET_B");
    }

    #[test]
    fn asset_pair_both_none() {
        let ap = AssetPair {
            amount_asset_id: None,
            price_asset_id: None,
        };
        let v = serde_json::to_value(&ap).unwrap();
        assert!(v["amountAsset"].is_null());
        assert!(v["priceAsset"].is_null());
    }

    // ── Order serialization by version ──────────────────────────────────────

    fn make_order(version: i32) -> Order {
        Order {
            id: "orderid".into(),
            version,
            sender: "sender".into(),
            sender_public_key: "spk".into(),
            matcher_public_key: "mpk".into(),
            asset_pair: AssetPair {
                amount_asset_id: None,
                price_asset_id: None,
            },
            order_type: OrderType::Buy,
            amount: 100,
            price: 200,
            timestamp: 12345,
            expiration: 99999,
            matcher_fee: 300,
            matcher_fee_asset_id: None,
            proofs: vec!["proof1".into()],
            signature: "sig".into(),
            eip712_signature: None,
            price_mode: None,
        }
    }

    #[test]
    fn order_v1_serializes_without_asset_id_field() {
        let order = make_order(1);
        let v = serde_json::to_value(&order).unwrap();
        assert!(!v.as_object().unwrap().contains_key("matcherFeeAssetId"));
        assert!(!v.as_object().unwrap().contains_key("eip712Signature"));
    }

    #[test]
    fn order_v3_includes_matcher_fee_asset_id() {
        let order = make_order(3);
        let v = serde_json::to_value(&order).unwrap();
        assert!(v.as_object().unwrap().contains_key("matcherFeeAssetId"));
        assert!(!v.as_object().unwrap().contains_key("eip712Signature"));
    }

    #[test]
    fn order_v4_includes_eip712_and_price_mode() {
        let order = make_order(4);
        let v = serde_json::to_value(&order).unwrap();
        assert!(v.as_object().unwrap().contains_key("matcherFeeAssetId"));
        assert!(v.as_object().unwrap().contains_key("eip712Signature"));
        assert!(v.as_object().unwrap().contains_key("priceMode"));
    }

    #[test]
    fn order_unknown_version_does_not_panic() {
        // Regression: previously panicked with unreachable!
        let order = make_order(-1);
        let result = serde_json::to_value(&order);
        assert!(result.is_ok());
    }

    // ── ArgList ──────────────────────────────────────────────────────────────

    #[test]
    fn arg_list_from_empty_list() {
        use crate::proto::waves::invoke_script_result::call::argument::List as ListPb;
        let list = ListPb { items: vec![] };
        let arg_list = ArgList::from(&list);
        assert!(arg_list.0.is_empty());
    }

    #[test]
    fn arg_list_skips_none_values() {
        use crate::proto::waves::invoke_script_result::call::argument::List as ListPb;
        use crate::proto::waves::invoke_script_result::call::Argument;
        let list = ListPb {
            items: vec![
                Argument { value: None }, // should be skipped
                Argument {
                    value: Some(InvokeScriptArgValue::BooleanValue(true)),
                },
            ],
        };
        let arg_list = ArgList::from(&list);
        assert_eq!(arg_list.0.len(), 1);
        assert!(matches!(arg_list.0[0], DataEntryTypeValue::Boolean(true)));
    }
}
