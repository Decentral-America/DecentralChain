package im.mak.waves.transactions.serializers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base58;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.components.Order;
import im.mak.waves.transactions.components.OrderType;
import im.mak.waves.transactions.components.Transfer;
import im.mak.waves.transactions.components.data.*;
import im.mak.waves.transactions.components.invoke.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public abstract class JsonSerializer {

    //todo use modules http://tutorials.jenkov.com/java-json/jackson-objectmapper.html#custom-serializer
    public static final ObjectMapper JSON_MAPPER = new ObjectMapper();
    
    public static Order orderFromJson(JsonNode json) throws IOException {
        int version = json.get("version").asInt();

        OrderType type;
        String jsType = json.get("orderType").asText();
        if (jsType.equals(OrderType.BUY.value()))
            type = OrderType.BUY;
        else if (jsType.equals(OrderType.SELL.value()))
            type = OrderType.SELL;
        else throw new IOException("Unknown order type \"" + jsType + "\"");

        List<Proof> proofs = new ArrayList<>();
        if (version == 1)
            proofs.add(Proof.as(json.get("signature").asText()));
        else for (JsonNode proof : json.get("proofs"))
            proofs.add(Proof.as(proof.asText()));

        return new Order(
                PublicKey.as(json.get("senderPublicKey").asText()),
                type,
                Amount.of(json.get("amount").asLong(), Asset.id(json.get("assetPair").get("amountAsset").asText())),
                Amount.of(json.get("price").asLong(), Asset.id(json.get("assetPair").get("priceAsset").asText())),
                PublicKey.as(json.get("matcherPublicKey").asText()),
                json.has("chainId") ? (byte) json.get("chainId").asInt() : Waves.chainId,
                json.get("matcherFee").asLong(),
                json.has("matcherFeeAssetId") ? Asset.id(json.get("matcherFeeAssetId").asText()) : Asset.WAVES,
                json.get("timestamp").asLong(),
                json.get("expiration").asLong(),
                version,
                proofs
        );
    }

    public static Order orderFromJson(String json) throws IOException {
        return orderFromJson(JSON_MAPPER.readTree(json));
    }

    public static Transaction fromJson(JsonNode json) throws IOException {
        int type = json.get("type").asInt();
        int version = json.get("version").asInt();
        byte chainId = json.has("chainId") ? (byte) json.get("chainId").asInt() : Waves.chainId;
        PublicKey sender = PublicKey.as(json.get("senderPublicKey").asText());
        //todo validate sender address if exists? configurable? jsonNode.get("sender").asText(sender.address())
        long fee = json.get("fee").asLong();
        Asset feeAssetId = Asset.id(json.get("feeAssetId").asText(null));
        long timestamp = json.get("timestamp").asLong();
        //todo validate id if exists? configurable?
        //todo what if some field doesn't exist? Default values, e.g. for proofs

        List<Proof> proofs = new ArrayList<>();
        if (json.has("proofs")) {
            JsonNode jProofs = json.get("proofs");
            int size = jProofs.size();
            for (int i = 0; i < size; i++)
                proofs.add(Proof.as(jProofs.get(i).asText()));
        }

        if (type == IssueTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for ReissueTransaction");
            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new IssueTransaction(sender, json.get("name").asText(), json.get("description").asText(),
                    json.get("quantity").asLong(), json.get("decimals").asInt(), json.get("reissuable").asBoolean(),
                    Base64.decode(json.get("script").asText()), chainId, fee, timestamp, version, proofs);
        } if (type == TransferTransaction.TYPE) {
            Recipient recipient = Recipient.as(json.get("recipient").asText());
            if (version < 3)
                chainId = recipient.chainId();
            Asset asset = json.has("assetId") ? Asset.id(json.get("assetId").asText()) : Asset.WAVES;
            byte[] attachment = json.has("attachment") ? Base58.decode(json.get("attachment").asText()) : Bytes.empty();

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new TransferTransaction(sender, recipient, Amount.of(json.get("amount").asLong(), asset),
                    attachment, chainId, fee, feeAssetId, timestamp, version, proofs);
        } else if (type == ReissueTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for ReissueTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new ReissueTransaction(sender, Asset.id(json.get("assetId").asText()),
                    json.get("quantity").asLong(), json.get("reissuable").asBoolean(),
                    chainId, fee, timestamp, version, proofs);
        } else if (type == BurnTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for BurnTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));

            return new BurnTransaction(sender, Asset.id(json.get("assetId").asText()),
                    json.get("quantity").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == ExchangeTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for ExchangeTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));

            return new ExchangeTransaction(sender, orderFromJson(json.get("order1")), orderFromJson(json.get("order2")),
                    json.get("amount").asLong(), json.get("price").asLong(), json.get("buyMatcherFee").asLong(),
                    json.get("sellMatcherFee").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == LeaseTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for LeaseTransaction");

            Recipient recipient = Recipient.as(json.get("recipient").asText());
            if (version < 3)
                chainId = recipient.chainId();
            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));

            return new LeaseTransaction(
                    sender, recipient, json.get("amount").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == LeaseCancelTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for LeaseCancelTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new LeaseCancelTransaction(
                    sender, TxId.id(json.get("leaseId").asText()), chainId, fee, timestamp, version, proofs);
        } else if (type == CreateAliasTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for CreateAliasTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new CreateAliasTransaction(
                    sender, json.get("alias").asText(), chainId, fee, timestamp, version, proofs);
        } if (type == MassTransferTransaction.TYPE) {
            JsonNode jsTransfers = json.get("transfer");
            List<Transfer> transfers = new ArrayList<>();
            for (JsonNode jsTransfer : jsTransfers) {
                Recipient recipient = Recipient.as(jsTransfer.get("recipient").asText());
                long amount = json.get("amount").asLong();
                transfers.add(Transfer.to(recipient, amount));
            }
            Asset asset = Asset.id(json.get("assetId").asText());
            byte[] attachment = json.has("attachment") ? Base58.decode(json.get("attachment").asText()) : Bytes.empty();
            if (version == 1 && transfers.size() > 0)
                chainId = transfers.get(0).recipient().chainId();

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new MassTransferTransaction(sender, transfers, asset, attachment, chainId, fee, timestamp, version, proofs);
        } else if (type == DataTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for DataTransaction");

            JsonNode jsData = json.get("data");
            List<DataEntry> data = new ArrayList<>();
            for (int i = 0; i < jsData.size(); i++) {
                JsonNode entry = jsData.get(i);
                String key = entry.get("key").asText();
                String entryType = entry.get("type").asText();
                if (entryType.isEmpty())
                    data.add(new DeleteEntry(key));
                else if (entryType.equals("binary"))
                    data.add(new BinaryEntry(key, Base64.decode(entry.get("value").asText())));
                else if (entryType.equals("boolean"))
                    data.add(new BooleanEntry(key, entry.get("value").asBoolean()));
                else if (entryType.equals("integer"))
                    data.add(new IntegerEntry(key, entry.get("value").asLong()));
                else if (entryType.equals("string"))
                    data.add(new StringEntry(key, entry.get("value").asText()));
            }
            return new DataTransaction(sender, data, chainId, fee, timestamp, version, proofs);
        } else if (type == SetScriptTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for DataTransaction");

            byte[] script = json.get("script").isNull() ? Bytes.empty() : Base64.decode(json.get("script").asText());
            return new SetScriptTransaction(sender, script, chainId, fee, timestamp, version, proofs);
        } else if (type == SponsorFeeTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for SponsorFeeTransaction");

            return new SponsorFeeTransaction(sender, Asset.id(json.get("assetId").asText()),
                    json.get("minSponsoredAssetFee").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == SetAssetScriptTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for SetAssetScriptTransaction");

            Asset asset = Asset.id(json.get("assetId").asText());
            byte[] script = json.get("script").isNull() ? Bytes.empty() : Base64.decode(json.get("script").asText());
            return new SetAssetScriptTransaction(sender, asset, script, chainId, fee, timestamp, version, proofs);
        } else if (type == UpdateAssetInfoTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for UpdateAssetInfoTransaction");

            Asset asset = Asset.id(json.get("assetId").asText());
            String name = json.get("name").asText();
            String description = json.get("description").asText();
            return new UpdateAssetInfoTransaction(sender, asset, name, description, chainId, fee, timestamp, version, proofs);
        } else if (type == InvokeScriptTransaction.TYPE) {
            Recipient dApp = Recipient.as(json.get("dApp").asText());
            Function function = Function.asDefault();
            if (json.has("call") && !json.get("call").isNull()) {
                JsonNode call = json.get("call");
                List<Arg> args = new ArrayList<>();
                if (call.has("args")) {
                    JsonNode jsArgs = call.get("args");
                    for (int i = 0; i < jsArgs.size(); i++) {
                        JsonNode arg = jsArgs.get(i);
                        String argType = arg.get("type").asText();
                        if (argType.equals("binary"))
                            args.add(BinaryArg.as(arg.get("value").asText()));
                        else if (argType.equals("boolean"))
                            args.add(BooleanArg.as(arg.get("value").asBoolean()));
                        else if (argType.equals("integer"))
                            args.add(IntegerArg.as(arg.get("value").asLong()));
                        else if (argType.equals("string"))
                            args.add(StringArg.as(arg.get("value").asText()));
                        else throw new IOException("Unknown arg type " + argType);
                    }
                }
                function = Function.as(call.get("name").asText(), args);
            }
            List<Amount> payments = new ArrayList<>();
            if (json.has("payments"))
                json.get("payments").forEach(p ->
                        payments.add(Amount.of(p.get("amount").asLong(), Asset.id(p.get("assetId").asText()))));
            return new InvokeScriptTransaction(sender, dApp, function, payments, chainId, fee, feeAssetId, timestamp, version, proofs);
        }

        throw new IOException("Can't parse json of transaction with type " + type);
    }
    
    public static Transaction fromJson(String json) throws IOException {
        return fromJson(JSON_MAPPER.readTree(json));
    }

    public static JsonNode toJsonObject(TransactionOrOrder txOrOrder) { //todo configurable long->string
        ObjectNode jsObject = JSON_MAPPER.createObjectNode();

        if (txOrOrder instanceof Order) {
            Order order = (Order) txOrOrder;
            jsObject.put("orderType", order.type().value())
                    .put("version", order.version())
                    .put("chainId", order.chainId())
                    .put("senderPublicKey", order.sender().toString())
                    .put("sender", order.sender().address(Waves.chainId).toString());
            jsObject.putObject("assetPair")
                    .put("amountAsset", assetToJson(order.amount().asset()))
                    .put("priceAsset", assetToJson(order.price().asset()));
            jsObject.put("amount", order.amount().value())
                    .put("price", order.price().value())
                    .put("matcherPublicKey", order.matcher().toString())
                    .put("matcherFee", order.fee())
                    .put("matcherFeeAssetId", assetToJson(order.feeAsset()))
                    .put("timestamp", order.timestamp())
                    .put("expiration", order.expiration());

            if (order.version() == 1)
                jsObject.put("signature", order.proofs().get(0).toString());
            ArrayNode proofs = JSON_MAPPER.createArrayNode();
            order.proofs().forEach(p -> proofs.add(p.toString()));
            jsObject.set("proofs", proofs); //todo configurable for v1, true by default
        } else {
            Transaction tx = (Transaction) txOrOrder;
            jsObject.put("id", tx.id().toString()) //todo serialize id? configurable and true by default?
                    .put("type", tx.type())
                    .put("version", tx.version())
                    .put("chainId", tx.chainId())
                    .put("senderPublicKey", tx.sender().toString())
                    .put("sender", tx.sender().address(tx.chainId()).toString());

            ArrayNode proofs = JSON_MAPPER.createArrayNode();
            tx.proofs().forEach(p -> proofs.add(p.toString()));

            String signature = null;
            if (tx instanceof IssueTransaction) {
                IssueTransaction itx = (IssueTransaction) tx;
                jsObject.put("name", itx.name())
                        .put("description", itx.description())
                        .put("quantity", itx.quantity())
                        .put("decimals", itx.decimals())
                        .put("reissuable", itx.isReissuable())
                        .put("script",
                                itx.compiledScript().length > 0 ? Base64.encode(itx.compiledScript()) : null);
                if (itx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = itx.proofs().get(0).toString();
                }
            } else if (tx instanceof TransferTransaction) {
                TransferTransaction ttx = (TransferTransaction) tx;
                jsObject.put("recipient", ttx.recipient().toString())
                        .put("amount", ttx.amount().value())
                        .put("assetId", assetToJson(ttx.amount().asset()))
                        .put("attachment", ttx.attachment().length() > 0 ? Base58.encode(ttx.attachmentBytes()) : null);
            } else if (tx instanceof ReissueTransaction) {
                ReissueTransaction rtx = (ReissueTransaction) tx;
                jsObject.put("assetId", assetToJson(rtx.asset()))
                        .put("quantity", rtx.amount())
                        .put("reissuable", rtx.isReissuable());
                if (rtx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = rtx.proofs().get(0).toString();
                }
            } else if (tx instanceof BurnTransaction) {
                BurnTransaction btx = (BurnTransaction) tx;
                jsObject.put("assetId", assetToJson(btx.asset()))
                        .put("quantity", btx.amount());
                if (btx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = btx.proofs().get(0).toString();
                }
            } else if (tx instanceof ExchangeTransaction) {
                ExchangeTransaction etx = (ExchangeTransaction) tx;
                jsObject.set("order1", toJsonObject(etx.isDirectionBuySell() ? etx.buyOrder() : etx.sellOrder()));
                jsObject.set("order2", toJsonObject(etx.isDirectionBuySell() ? etx.sellOrder() : etx.buyOrder()));
                jsObject.put("amount", etx.amount())
                        .put("price", etx.price())
                        .put("buyMatcherFee", etx.buyMatcherFee())
                        .put("sellMatcherFee", etx.sellMatcherFee());
                if (etx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = etx.proofs().get(0).toString();
                }
            } else if (tx instanceof LeaseTransaction) {
                LeaseTransaction ltx = (LeaseTransaction) tx;
                jsObject.put("recipient", ltx.recipient().toString())
                        .put("amount", ltx.amount());
                if (ltx.version() == 1)
                    signature = ltx.proofs().get(0).toString();
                if (ltx.version() < 3)
                    jsObject.remove("chainId");
            } else if (tx instanceof LeaseCancelTransaction) {
                LeaseCancelTransaction lctx = (LeaseCancelTransaction) tx;
                jsObject.put("leaseId", lctx.leaseId().toString());
                if (lctx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = lctx.proofs().get(0).toString();
                }
            } else if (tx instanceof CreateAliasTransaction) {
                CreateAliasTransaction catx = (CreateAliasTransaction) tx;
                jsObject.put("alias", catx.alias());
                if (catx.version() == 1)
                    signature = catx.proofs().get(0).toString();
                if (catx.version() < 3)
                    jsObject.remove("chainId");
            } else if (tx instanceof MassTransferTransaction) {
                MassTransferTransaction mtTx = (MassTransferTransaction) tx;
                jsObject.put("assetId", assetToJson(mtTx.asset()))
                        .put("attachment", mtTx.attachment().length() > 0 ? Base58.encode(mtTx.attachmentBytes()) : null);
                ArrayNode jsTransfers = jsObject.putArray("transfers");
                for (Transfer transfer : mtTx.transfers()) {
                    jsTransfers.addObject()
                            .put("recipient", transfer.recipient().toString())
                            .put("amount", transfer.amount());
                }
            } else if (tx instanceof DataTransaction) {
                DataTransaction dtx = (DataTransaction) tx;
                ArrayNode data = jsObject.putArray("data");
                dtx.data().forEach(e -> {
                    ObjectNode entry = JSON_MAPPER.createObjectNode().put("key", e.key());
                    if (e.type() == EntryType.BINARY)
                        entry.put("type", "binary").put("value", Base64.encode(((BinaryEntry) e).value()));
                    else if (e.type() == EntryType.BOOLEAN)
                        entry.put("type", "boolean").put("value", ((BooleanEntry) e).value());
                    else if (e.type() == EntryType.INTEGER)
                        entry.put("type", "integer").put("value", ((IntegerEntry) e).value());
                    else if (e.type() == EntryType.STRING)
                        entry.put("type", "string").put("value", ((StringEntry) e).value());
                    else if (e.type() == EntryType.DELETE)
                        entry.putNull("type").putNull("value");
                    data.add(entry);
                });
                if (dtx.version() == 1)
                    jsObject.remove("chainId");
            } else if (tx instanceof SetScriptTransaction) {
                SetScriptTransaction ssTx = (SetScriptTransaction) tx;
                if (ssTx.compiledScript().length > 0)
                    jsObject.put("script", Base64.encode(ssTx.compiledScript()));
                else jsObject.putNull("script");
            } else if (tx instanceof SponsorFeeTransaction) {
                SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                jsObject.put("assetId", assetToJson(sfTx.asset()))
                        .put("minSponsoredAssetFee", sfTx.minSponsoredFee());
            } else if (tx instanceof SetAssetScriptTransaction) {
                SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                jsObject.put("assetId", assetToJson(sasTx.asset()));
                if (sasTx.compiledScript().length > 0)
                    jsObject.put("script", Base64.encode(sasTx.compiledScript()));
                else jsObject.putNull("script");
            } else if (tx instanceof UpdateAssetInfoTransaction) {
                UpdateAssetInfoTransaction uaiTx = (UpdateAssetInfoTransaction) tx;
                jsObject.put("assetId", assetToJson(uaiTx.asset()))
                        .put("name", uaiTx.name())
                        .put("description", uaiTx.description());
            } else if (tx instanceof InvokeScriptTransaction) {
                InvokeScriptTransaction isTx = (InvokeScriptTransaction) tx;
                if (isTx.function().isDefault())
                    jsObject.putNull("call");
                else {
                    ObjectNode call = jsObject.putObject("call");
                    call.put("function", isTx.function().name());
                    ArrayNode args = call.putArray("args");
                    isTx.function().args().forEach(a -> {
                        ObjectNode arg = args.addObject();
                        if (a.type() == ArgType.BINARY)
                            arg.put("type", "binary").put("value", ((BinaryArg) a).valueEncoded());
                        else if (a.type() == ArgType.BOOLEAN)
                            arg.put("type", "boolean").put("value", ((BooleanArg) a).value());
                        else if (a.type() == ArgType.INTEGER)
                            arg.put("type", "integer").put("value", ((IntegerArg) a).value());
                        else if (a.type() == ArgType.STRING)
                            arg.put("type", "string").put("value", ((StringArg) a).value());
                    });
                }
                ArrayNode payments = jsObject.putArray("payments");
                isTx.payments().forEach(p -> {
                    ObjectNode payment = payments.addObject();
                    payment.put("amount", p.value()).
                            put("assetId", assetToJson(p.asset()));
                });
            }

            jsObject.put("fee", tx.fee())
                    .put("feeAssetId", assetToJson(tx.feeAsset()))
                    .put("timestamp", tx.timestamp());

            if (signature != null)
                jsObject.put("signature", signature);
            jsObject.set("proofs", proofs); //todo configurable for v1, true by default
        }

        return jsObject;
    }

    public static String toPrettyJson(TransactionOrOrder txOrOrder) {
        return toJsonObject(txOrOrder).toPrettyString();
    }

    public static String toJson(TransactionOrOrder txOrOrder) {
        return toJsonObject(txOrOrder).toString();
    }

    public static String assetToJson(Asset asset) {
        return asset.isWaves() ? null : asset.toString();
    }

}
