use super::{
    Tx1, Tx2, Tx3, Tx4, Tx5, Tx6, Tx7, Tx8, Tx9Partial, Tx10, Tx11, Tx11Combined, Tx11Transfers,
    Tx12, Tx12Combined, Tx12Data, Tx13, Tx14, Tx15, Tx16, Tx16Args, Tx16Combined, Tx16Payment,
    Tx17, Tx18, Tx18Args, Tx18Combined, Tx18Payment, Tx19, TxBlockUid, TxHeight, TxId, TxUid,
};
use crate::chain::{Address, ChainId, DCC_ID, PublicKeyHash, extract_asset_id};
use crate::error::Error;
use crate::models::{DataEntryTypeValue, Order, OrderMeta};
use crate::proto::dcc::{
    Amount, Recipient, SignedTransaction,
    data_entry::Value as DataValue,
    events::{
        TransactionMetadata,
        transaction_metadata::{
            EthereumMetadata, Metadata, ethereum_metadata::Action as EthAction,
        },
    },
    invoke_script_result::call::argument::Value as InvokeScriptArgValue,
    recipient::Recipient as InnerRecipient,
    signed_transaction::Transaction,
    transaction::Data,
};
use crate::utils::{
    epoch_ms_to_naivedatetime, escape_unicode_null, into_base58, into_prefixed_base64,
};
use serde_json::json;

const WRONG_META_VAR: &str = "wrong meta variant";

pub enum Tx {
    CommitToGeneration(Tx19),
    Genesis(Tx1),
    Payment(Tx2),
    Issue(Tx3),
    Transfer(Tx4),
    Reissue(Tx5),
    Burn(Tx6),
    Exchange(Tx7),
    Lease(Tx8),
    LeaseCancel(Tx9Partial),
    CreateAlias(Tx10),
    MassTransfer(Tx11Combined),
    DataTransaction(Tx12Combined),
    SetScript(Tx13),
    SponsorFee(Tx14),
    SetAssetScript(Tx15),
    InvokeScript(Tx16Combined),
    UpdateAssetInfo(Tx17),
    Ethereum(Tx18Combined),
}

pub struct TxUidGenerator {
    multiplier: i64,
    last_height: TxHeight,
    last_id: TxUid,
}

impl TxUidGenerator {
    #[must_use]
    pub const fn new(multiplier: i64) -> Self {
        Self {
            multiplier,
            last_height: 0,
            last_id: 0,
        }
    }

    pub const fn maybe_update_height(&mut self, height: TxHeight) {
        if self.last_height < height {
            self.last_height = height;
            self.last_id = 0;
        }
    }

    pub fn next_uid(&mut self) -> TxUid {
        let result = i64::from(self.last_height) * self.multiplier + self.last_id;
        self.last_id += 1;
        result
    }
}

impl
    TryFrom<(
        &SignedTransaction,
        &TxId,
        TxHeight,
        &TransactionMetadata,
        TxUid,
        TxBlockUid,
        ChainId,
    )> for Tx
{
    type Error = Error;

    #[allow(clippy::too_many_lines)]
    fn try_from(
        (tx, id, height, meta, tx_uid, block_uid, chain_id): (
            &SignedTransaction,
            &TxId,
            TxHeight,
            &TransactionMetadata,
            TxUid,
            TxBlockUid,
            ChainId,
        ),
    ) -> Result<Self, Self::Error> {
        let SignedTransaction {
            transaction: Some(tx),
            proofs,
        } = tx
        else {
            return Err(Error::InconsistentDataError(format!(
                "No transaction data in id={id}, height={height}",
            )));
        };
        let uid = tx_uid;
        let id = id.to_owned();
        let proofs = proofs.iter().map(into_base58).collect::<Vec<_>>();
        let signature = proofs
            .first()
            .and_then(|p| (!p.is_empty()).then_some(p.to_owned()));
        let proofs = Some(proofs);
        let mut status = String::from("succeeded");

        if let Some(
            Metadata::Ethereum(EthereumMetadata {
                action: Some(EthAction::Invoke(ref m)),
                ..
            })
            | Metadata::InvokeScript(ref m),
        ) = meta.metadata
            && let Some(ref result) = m.result
            && result.error_message.is_some()
        {
            status = String::from("script_execution_failed");
        }

        let sender = into_base58(&meta.sender_address);

        let tx = match tx {
            Transaction::DccTransaction(tx) => tx,
            Transaction::EthereumTransaction(tx) => {
                let Some(Metadata::Ethereum(meta)) = &meta.metadata else {
                    return Err(Error::InconsistentDataError(WRONG_META_VAR.into()));
                };
                let mut eth_tx = Tx18 {
                    uid,
                    height,
                    tx_type: 18,
                    id,
                    time_stamp: epoch_ms_to_naivedatetime(meta.timestamp),
                    signature,
                    fee: meta.fee,
                    proofs,
                    tx_version: Some(1),
                    sender,
                    sender_public_key: into_base58(&meta.sender_public_key),
                    status,
                    bytes: tx.clone(),
                    block_uid,
                    function_name: None,
                };
                let result_tx = match meta.action.as_ref().ok_or_else(|| {
                    Error::InconsistentDataError("Ethereum metadata has no action".into())
                })? {
                    EthAction::Transfer(_) => Tx18Combined {
                        tx: eth_tx,
                        args: vec![],
                        payments: vec![],
                    },
                    EthAction::Invoke(imeta) => {
                        eth_tx.function_name = Some(imeta.function_name.clone());
                        Tx18Combined {
                            tx: eth_tx,
                            args: imeta
                                .arguments
                                .iter()
                                .filter_map(|arg| arg.value.as_ref())
                                .enumerate()
                                .map(|(i, arg)| {
                                    let (v_type, v_int, v_bool, v_bin, v_str, v_list) = match &arg {
                                        InvokeScriptArgValue::IntegerValue(v) => {
                                            ("integer", Some(v.to_owned()), None, None, None, None)
                                        }
                                        InvokeScriptArgValue::BooleanValue(v) => {
                                            ("boolean", None, Some(v.to_owned()), None, None, None)
                                        }
                                        InvokeScriptArgValue::BinaryValue(v) => {
                                            ("binary", None, None, Some(v.to_owned()), None, None)
                                        }
                                        InvokeScriptArgValue::StringValue(v) => {
                                            ("string", None, None, None, Some(v.to_owned()), None)
                                        }
                                        InvokeScriptArgValue::List(_) => (
                                            "list",
                                            None,
                                            None,
                                            None,
                                            None,
                                            Some(
                                                json!(DataEntryTypeValue::from(arg))["value"]
                                                    .clone(),
                                            ),
                                        ),
                                        InvokeScriptArgValue::CaseObj(_) => {
                                            ("case", None, None, None, None, None)
                                        }
                                    };
                                    Tx18Args {
                                        tx_uid,
                                        arg_type: v_type.to_string(),
                                        arg_value_integer: v_int,
                                        arg_value_boolean: v_bool,
                                        arg_value_binary: v_bin.map(into_prefixed_base64),
                                        arg_value_string: v_str.map(escape_unicode_null),
                                        arg_value_list: v_list,
                                        position_in_args: i16::try_from(i)
                                            .expect("Ethereum InvokeScript arg index is protocol-bounded (<=22) << i16::MAX"),
                                        height,
                                    }
                                })
                                .collect(),
                            payments: imeta
                                .payments
                                .iter()
                                .enumerate()
                                .map(|(i, p)| Tx18Payment {
                                    tx_uid,
                                    amount: p.amount,
                                    position_in_payment: i16::try_from(i)
                                        .expect("Ethereum InvokeScript payment index is protocol-bounded (<=10) << i16::MAX"),
                                    height,
                                    asset_id: extract_asset_id(&p.asset_id),
                                })
                                .collect(),
                        }
                    }
                };
                return Ok(Self::Ethereum(result_tx));
            }
        };
        let tx_data = tx.data.as_ref().ok_or_else(|| {
            Error::InconsistentDataError(format!(
                "No inner transaction data in id={id}, height={height}",
            ))
        })?;
        let time_stamp = epoch_ms_to_naivedatetime(tx.timestamp);
        let (fee, fee_asset_id) = tx.fee.as_ref().map_or_else(
            || (0, DCC_ID.to_string()),
            |f| (f.amount, extract_asset_id(&f.asset_id)),
        );
        let tx_version = Some(
            i16::try_from(tx.version).expect("transaction version bounded to 1-4 << i16::MAX"),
        );
        let sender_public_key = into_base58(&tx.sender_public_key);

        Ok(match tx_data {
            Data::Genesis(t) => Self::Genesis(Tx1 {
                uid,
                height,
                tx_type: 1,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version: None,
                sender: (!sender.is_empty()).then_some(sender),
                sender_public_key: (!sender_public_key.is_empty()).then_some(sender_public_key),
                status,
                recipient_address: Address::from((
                    PublicKeyHash(t.recipient_address.as_ref()),
                    chain_id,
                ))
                .into(),
                recipient_alias: None,
                amount: t.amount,
                block_uid,
            }),
            Data::Payment(t) => Self::Payment(Tx2 {
                uid,
                height,
                tx_type: 2,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version: tx_version.and_then(|v| (v != 1).then_some(v)),
                sender,
                sender_public_key,
                status,
                recipient_address: Address::from((
                    PublicKeyHash(t.recipient_address.as_ref()),
                    chain_id,
                ))
                .into(),
                recipient_alias: None,
                amount: t.amount,
                block_uid,
            }),
            Data::Issue(t) => Self::Issue(Tx3 {
                uid,
                height,
                tx_type: 3,
                id: id.clone(),
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version,
                sender,
                sender_public_key,
                status,
                asset_id: if id.is_empty() {
                    DCC_ID.to_string()
                } else {
                    id
                },
                asset_name: escape_unicode_null(&t.name),
                description: escape_unicode_null(&t.description),
                quantity: t.amount,
                decimals: i16::try_from(t.decimals)
                    .expect("token decimals bounded to 0-8 << i16::MAX"),
                reissuable: t.reissuable,
                script: extract_script(&t.script),
                block_uid,
            }),
            Data::Transfer(t) => {
                let Some(Metadata::Transfer(meta)) = &meta.metadata else {
                    return Err(Error::InconsistentDataError(WRONG_META_VAR.into()));
                };
                let Amount { asset_id, amount } = t.amount.as_ref().ok_or_else(|| {
                    Error::InconsistentDataError("Transfer tx missing amount".into())
                })?;
                Self::Transfer(Tx4 {
                    uid,
                    height,
                    tx_type: 4,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    asset_id: extract_asset_id(asset_id),
                    fee_asset_id,
                    amount: *amount,
                    attachment: into_base58(&t.attachment),
                    recipient_address: into_base58(&meta.recipient_address),
                    recipient_alias: extract_recipient_alias(t.recipient.as_ref()),
                    block_uid,
                })
            }
            Data::Reissue(t) => {
                let Amount { asset_id, amount } = t.asset_amount.as_ref().ok_or_else(|| {
                    Error::InconsistentDataError("Reissue tx missing asset_amount".into())
                })?;
                Self::Reissue(Tx5 {
                    uid,
                    height,
                    tx_type: 5,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    asset_id: extract_asset_id(asset_id),
                    quantity: *amount,
                    reissuable: t.reissuable,
                    block_uid,
                })
            }
            Data::Burn(t) => {
                let Amount { asset_id, amount } = t.asset_amount.as_ref().ok_or_else(|| {
                    Error::InconsistentDataError("Burn tx missing asset_amount".into())
                })?;
                Self::Burn(Tx6 {
                    uid,
                    height,
                    tx_type: 6,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    asset_id: extract_asset_id(asset_id),
                    amount: *amount,
                    block_uid,
                })
            }
            Data::Exchange(t) => {
                let order_to_val = |o| {
                    serde_json::to_value(Order::from(o))
                        .expect("Order serialization is infallible")
                };
                let Some(Metadata::Exchange(meta)) = &meta.metadata else {
                    return Err(Error::InconsistentDataError(WRONG_META_VAR.into()));
                };
                if t.orders.len() < 2 || meta.order_ids.len() < 2
                    || meta.order_sender_addresses.len() < 2
                    || meta.order_sender_public_keys.len() < 2
                {
                    return Err(Error::InconsistentDataError(
                        "Exchange tx has fewer than 2 orders or missing metadata".into(),
                    ));
                }
                let order_1 = OrderMeta {
                    order: &t.orders[0],
                    id: &meta.order_ids[0],
                    sender_address: &meta.order_sender_addresses[0],
                    sender_public_key: &meta.order_sender_public_keys[0],
                };
                let order_2 = OrderMeta {
                    order: &t.orders[1],
                    id: &meta.order_ids[1],
                    sender_address: &meta.order_sender_addresses[1],
                    sender_public_key: &meta.order_sender_public_keys[1],
                };
                let first_order_asset_pair = t.orders[0].asset_pair.as_ref().ok_or_else(|| {
                    Error::InconsistentDataError("Exchange order[0] missing asset_pair".into())
                })?;
                Self::Exchange(Tx7 {
                    uid,
                    height,
                    tx_type: 7,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    order1: order_to_val(order_1),
                    order2: order_to_val(order_2),
                    amount_asset_id: extract_asset_id(&first_order_asset_pair.amount_asset_id),
                    price_asset_id: extract_asset_id(&first_order_asset_pair.price_asset_id),
                    amount: t.amount,
                    price: t.price,
                    buy_matcher_fee: t.buy_matcher_fee,
                    sell_matcher_fee: t.sell_matcher_fee,
                    fee_asset_id,
                    block_uid,
                })
            }
            Data::Lease(t) => {
                let Some(Metadata::Lease(meta)) = &meta.metadata else {
                    return Err(Error::InconsistentDataError(WRONG_META_VAR.into()));
                };
                Self::Lease(Tx8 {
                    uid,
                    height,
                    tx_type: 8,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    amount: t.amount,
                    recipient_address: into_base58(&meta.recipient_address),
                    recipient_alias: extract_recipient_alias(t.recipient.as_ref()),
                    block_uid,
                })
            }
            Data::LeaseCancel(t) => Self::LeaseCancel(Tx9Partial {
                uid,
                height,
                tx_type: 9,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version,
                sender,
                sender_public_key,
                status,
                lease_id: if t.lease_id.is_empty() {
                    None
                } else {
                    Some(into_base58(&t.lease_id))
                },
                block_uid,
            }),
            Data::CreateAlias(t) => Self::CreateAlias(Tx10 {
                uid,
                height,
                tx_type: 10,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version,
                sender,
                sender_public_key,
                status,
                alias: t.alias.clone(),
                block_uid,
            }),
            Data::MassTransfer(t) => {
                let Some(Metadata::MassTransfer(meta)) = &meta.metadata else {
                    return Err(Error::InconsistentDataError(WRONG_META_VAR.into()));
                };
                Self::MassTransfer(Tx11Combined {
                    tx: Tx11 {
                        uid,
                        height,
                        tx_type: 11,
                        id,
                        time_stamp,
                        signature,
                        fee,
                        proofs,
                        tx_version,
                        sender,
                        sender_public_key,
                        status,
                        asset_id: extract_asset_id(&t.asset_id),
                        attachment: into_base58(&t.attachment),
                        block_uid,
                    },
                    transfers: t
                        .transfers
                        .iter()
                        .zip(&meta.recipients_addresses)
                        .enumerate()
                        .map(|(i, (t, rcpt_addr))| Tx11Transfers {
                            tx_uid,
                            recipient_address: into_base58(rcpt_addr),
                            recipient_alias: extract_recipient_alias(t.recipient.as_ref()),
                            amount: t.amount,
                            position_in_tx: i16::try_from(i)
                                .expect("mass transfer recipient index is protocol-bounded (<=100) << i16::MAX"),
                            height,
                        })
                        .collect(),
                })
            }
            Data::DataTransaction(t) => Self::DataTransaction(Tx12Combined {
                tx: Tx12 {
                    uid,
                    height,
                    tx_type: 12,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    block_uid,
                },
                data: t
                    .data
                    .iter()
                    .enumerate()
                    .map(|(i, d)| {
                        let (v_type, v_int, v_bool, v_bin, v_str) = match &d.value {
                            Some(DataValue::IntValue(v)) => {
                                (Some("integer"), Some(v.to_owned()), None, None, None)
                            }
                            Some(DataValue::BoolValue(v)) => {
                                (Some("boolean"), None, Some(v.to_owned()), None, None)
                            }
                            Some(DataValue::BinaryValue(v)) => {
                                (Some("binary"), None, None, Some(v.to_owned()), None)
                            }
                            Some(DataValue::StringValue(v)) => {
                                (Some("string"), None, None, None, Some(v.to_owned()))
                            }
                            _ => (None, None, None, None, None),
                        };
                        Tx12Data {
                            tx_uid,
                            data_key: escape_unicode_null(&d.key),
                            data_type: v_type.map(String::from),
                            data_value_integer: v_int,
                            data_value_boolean: v_bool,
                            data_value_binary: v_bin.map(into_prefixed_base64),
                            data_value_string: v_str.map(escape_unicode_null),
                            position_in_tx: i16::try_from(i)
                                .expect("data transaction entry index is protocol-bounded (<=100) << i16::MAX"),
                            height,
                        }
                    })
                    .collect(),
            }),
            Data::SetScript(t) => Self::SetScript(Tx13 {
                uid,
                height,
                tx_type: 13,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version,
                sender,
                sender_public_key,
                status,
                script: extract_script(&t.script),
                block_uid,
            }),
            Data::SponsorFee(t) => {
                let min_fee = t.min_fee.as_ref().ok_or_else(|| {
                    Error::InconsistentDataError("SponsorFee tx missing min_fee".into())
                })?;
                Self::SponsorFee(Tx14 {
                    uid,
                    height,
                    tx_type: 14,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    sender,
                    sender_public_key,
                    status,
                    asset_id: extract_asset_id(&min_fee.asset_id),
                    min_sponsored_asset_fee: (min_fee.amount != 0).then_some(min_fee.amount),
                    block_uid,
                })
            }
            Data::SetAssetScript(t) => Self::SetAssetScript(Tx15 {
                uid,
                height,
                tx_type: 15,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version,
                sender,
                sender_public_key,
                status,
                asset_id: extract_asset_id(&t.asset_id),
                script: extract_script(&t.script),
                block_uid,
            }),
            Data::InvokeScript(t) => {
                let Some(Metadata::InvokeScript(meta)) = &meta.metadata else {
                    return Err(Error::InconsistentDataError(WRONG_META_VAR.into()));
                };
                let invoke_fee_asset_id = tx
                    .fee
                    .as_ref()
                    .map_or_else(|| DCC_ID.to_string(), |f| extract_asset_id(&f.asset_id));
                Self::InvokeScript(Tx16Combined {
                    tx: Tx16 {
                        uid,
                        height,
                        tx_type: 16,
                        id,
                        time_stamp,
                        signature,
                        fee,
                        proofs,
                        tx_version,
                        sender,
                        sender_public_key,
                        status,
                        function_name: Some(meta.function_name.clone()),
                        fee_asset_id: invoke_fee_asset_id,
                        dapp_address: into_base58(&meta.d_app_address),
                        dapp_alias: extract_recipient_alias(t.d_app.as_ref()),
                        block_uid,
                    },
                    args: meta
                        .arguments
                        .iter()
                        .filter_map(|arg| arg.value.as_ref())
                        .enumerate()
                        .map(|(i, arg)| {
                            let (v_type, v_int, v_bool, v_bin, v_str, v_list) = match &arg {
                                InvokeScriptArgValue::IntegerValue(v) => {
                                    ("integer", Some(v.to_owned()), None, None, None, None)
                                }
                                InvokeScriptArgValue::BooleanValue(v) => {
                                    ("boolean", None, Some(v.to_owned()), None, None, None)
                                }
                                InvokeScriptArgValue::BinaryValue(v) => {
                                    ("binary", None, None, Some(v.to_owned()), None, None)
                                }
                                InvokeScriptArgValue::StringValue(v) => {
                                    ("string", None, None, None, Some(v.to_owned()), None)
                                }
                                InvokeScriptArgValue::List(_) => (
                                    "list",
                                    None,
                                    None,
                                    None,
                                    None,
                                    Some(json!(DataEntryTypeValue::from(arg))["value"].clone()),
                                ),
                                InvokeScriptArgValue::CaseObj(_) => {
                                    ("case", None, None, None, None, None)
                                }
                            };
                            Tx16Args {
                                tx_uid,
                                arg_type: v_type.to_string(),
                                arg_value_integer: v_int,
                                arg_value_boolean: v_bool,
                                arg_value_binary: v_bin.map(into_prefixed_base64),
                                arg_value_string: v_str.map(escape_unicode_null),
                                arg_value_list: v_list,
                                position_in_args: i16::try_from(i)
                                    .expect("InvokeScript arg index is protocol-bounded (<=22) << i16::MAX"),
                                height,
                            }
                        })
                        .collect(),
                    payments: t
                        .payments
                        .iter()
                        .enumerate()
                        .map(|(i, p)| Tx16Payment {
                            tx_uid,
                            amount: p.amount,
                            position_in_payment: i16::try_from(i)
                                .expect("InvokeScript payment index is protocol-bounded (<=10) << i16::MAX"),
                            height,
                            asset_id: extract_asset_id(&p.asset_id),
                        })
                        .collect(),
                })
            }
            Data::UpdateAssetInfo(t) => Self::UpdateAssetInfo(Tx17 {
                uid,
                height,
                tx_type: 17,
                id,
                time_stamp,
                signature,
                fee,
                proofs,
                tx_version,
                sender,
                sender_public_key,
                status,
                asset_id: extract_asset_id(&t.asset_id),
                asset_name: escape_unicode_null(&t.name),
                description: escape_unicode_null(&t.description),
                block_uid,
            }),
            Data::InvokeExpression(_t) => {
                return Err(Error::InconsistentDataError(
                    "InvokeExpression tx type is not yet supported".into(),
                ))
            }
            Data::CommitToGeneration(t) => {
                let endorser_pk = bs58::encode(&t.endorser_public_key).into_string();
                Self::CommitToGeneration(Tx19 {
                    uid,
                    height,
                    tx_type: 19,
                    id,
                    time_stamp,
                    signature,
                    fee,
                    proofs,
                    tx_version,
                    block_uid,
                    sender: (!sender.is_empty()).then_some(sender).unwrap_or_default(),
                    sender_public_key: (!sender_public_key.is_empty()).then_some(sender_public_key).unwrap_or_default(),
                    status,
                    endorser_public_key: endorser_pk,
                    generation_period_start: t.generation_period_start,
                })
            }
        })
    }
}

fn extract_recipient_alias(rcpt: Option<&Recipient>) -> Option<String> {
    rcpt.and_then(|r| r.recipient.as_ref())
        .and_then(|r| match r {
            InnerRecipient::Alias(alias) if !alias.is_empty() => Some(alias.clone()),
            _ => None,
        })
}

fn extract_script(script: &Vec<u8>) -> Option<String> {
    if script.is_empty() {
        None
    } else {
        Some(into_prefixed_base64(script))
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    // ── TxUidGenerator ──────────────────────────────────────────────────────

    #[test]
    fn tx_uid_generator_sequential_within_block() {
        let mut uid_gen = TxUidGenerator::new(100_000);
        uid_gen.maybe_update_height(10);
        let a = uid_gen.next_uid();
        let b = uid_gen.next_uid();
        let c = uid_gen.next_uid();
        assert_eq!(b, a + 1);
        assert_eq!(c, a + 2);
    }

    #[test]
    fn tx_uid_generator_resets_on_new_block() {
        let mut uid_gen = TxUidGenerator::new(100_000);
        uid_gen.maybe_update_height(5);
        let uid_h5 = uid_gen.next_uid();
        uid_gen.maybe_update_height(6);
        let uid_h6 = uid_gen.next_uid();
        // height 5, tx 0 → 5 * 100_000 + 0 = 500_000
        assert_eq!(uid_h5, 5 * 100_000);
        // height 6, tx 0 → 6 * 100_000 + 0 = 600_000
        assert_eq!(uid_h6, 6 * 100_000);
    }

    #[test]
    fn tx_uid_generator_does_not_regress_on_same_height() {
        let mut uid_gen = TxUidGenerator::new(100_000);
        uid_gen.maybe_update_height(10);
        let _ = uid_gen.next_uid(); // 1_000_000
        uid_gen.maybe_update_height(10); // no-op — same height
        let second = uid_gen.next_uid(); // 1_000_001
        assert_eq!(second, 10 * 100_000 + 1);
    }

    #[test]
    fn tx_uid_generator_does_not_reset_on_lower_height() {
        let mut uid_gen = TxUidGenerator::new(100_000);
        uid_gen.maybe_update_height(10);
        let _ = uid_gen.next_uid();
        let _ = uid_gen.next_uid();
        uid_gen.maybe_update_height(5); // lower — should be ignored
        let uid = uid_gen.next_uid();
        // counter should still be at 2, height 10
        assert_eq!(uid, 10 * 100_000 + 2);
    }

    #[test]
    fn tx_uid_generator_multiplier_one() {
        let mut uid_gen = TxUidGenerator::new(1);
        uid_gen.maybe_update_height(100);
        assert_eq!(uid_gen.next_uid(), 100);
        assert_eq!(uid_gen.next_uid(), 101);
        assert_eq!(uid_gen.next_uid(), 102);
    }

    #[test]
    fn tx_uid_generator_height_zero() {
        let mut uid_gen = TxUidGenerator::new(100_000);
        // Height 0 is the initial state — uids start at 0
        assert_eq!(uid_gen.next_uid(), 0);
        assert_eq!(uid_gen.next_uid(), 1);
    }

    // ── extract_recipient_alias ──────────────────────────────────────────────

    #[test]
    fn extract_recipient_alias_returns_none_for_empty() {
        assert!(extract_recipient_alias(None).is_none());
    }

    #[test]
    fn extract_recipient_alias_returns_alias_string() {
        let rcpt = Some(Recipient {
            recipient: Some(InnerRecipient::Alias("myalias".to_string())),
        });
        assert_eq!(
            extract_recipient_alias(rcpt.as_ref()),
            Some("myalias".to_string())
        );
    }

    #[test]
    fn extract_recipient_alias_empty_alias_returns_none() {
        let rcpt = Some(Recipient {
            recipient: Some(InnerRecipient::Alias(String::new())),
        });
        assert!(extract_recipient_alias(rcpt.as_ref()).is_none());
    }

    // ── extract_script ───────────────────────────────────────────────────────

    #[test]
    fn extract_script_empty_bytes_is_none() {
        assert!(extract_script(&vec![]).is_none());
    }

    #[test]
    fn extract_script_nonempty_bytes_returns_base64() {
        let result = extract_script(&vec![0x01, 0x02]);
        assert!(result.is_some());
        let s = result.unwrap();
        assert!(s.starts_with("base64:"));
    }

    // ── TryFrom guard: missing transaction data returns Err ──────────────────

    #[test]
    fn try_from_missing_transaction_data_returns_err() {
        use crate::proto::dcc::SignedTransaction;
        use crate::proto::dcc::events::TransactionMetadata;
        let stx = SignedTransaction {
            transaction: None,
            proofs: vec![],
        };
        let meta = TransactionMetadata::default();
        let result = Tx::try_from((&stx, &"txid".to_string(), 1i32, &meta, 0i64, 0i64, 87u8));
        match result {
            Err(e) => {
                let msg = e.to_string();
                assert!(msg.contains("No transaction data") || !msg.is_empty());
            }
            Ok(_) => panic!("expected Err but got Ok"),
        }
    }
}
