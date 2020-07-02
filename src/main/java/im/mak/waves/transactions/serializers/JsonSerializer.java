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
import im.mak.waves.transactions.data.*;
import im.mak.waves.transactions.exchange.Order;
import im.mak.waves.transactions.exchange.OrderType;
import im.mak.waves.transactions.invocation.*;
import im.mak.waves.transactions.mass.Transfer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static im.mak.waves.transactions.serializers.Scheme.PROTOBUF;
import static im.mak.waves.transactions.serializers.Scheme.WITH_SIGNATURE;

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
                Amount.of(json.get("amount").asLong(), assetFromJson(json.get("assetPair").get("amountAsset"))),
                Amount.of(json.get("price").asLong(), assetFromJson(json.get("assetPair").get("priceAsset"))),
                PublicKey.as(json.get("matcherPublicKey").asText()),
                json.has("chainId") ? (byte) json.get("chainId").asInt() : Waves.chainId,
                json.get("matcherFee").asLong(),
                json.has("matcherFeeAssetId") ? assetFromJson(json.get("matcherFeeAssetId")) : Asset.WAVES,
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
        Asset feeAssetId = assetFromJson(json.get("feeAssetId"));
        long timestamp = json.get("timestamp").asLong();
        //todo validate id if exists? configurable?
        //todo what if some field doesn't exist? Default values, e.g. for proofs

        Scheme scheme = Scheme.of(type, version);

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
                    scriptFromJson(json), chainId, Amount.of(fee), timestamp, version, proofs);
        } if (type == TransferTransaction.TYPE) {
            Recipient recipient = Recipient.as(json.get("recipient").asText());
            if (version < 3)
                chainId = recipient.chainId();
            Asset asset = assetFromJson(json.get("assetId"));
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
            return new ReissueTransaction(
                    sender, Amount.of(json.get("quantity").asLong(), assetFromJson(json.get("assetId"))),
                    json.get("reissuable").asBoolean(), chainId, fee, timestamp, version, proofs);
        } else if (type == BurnTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for BurnTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));

            long amount = json.get(scheme == PROTOBUF ? "quantity" : "amount").asLong();

            return new BurnTransaction(
                    sender, Amount.of(amount, assetFromJson(json.get("assetId"))),
                    chainId, fee, timestamp, version, proofs);
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
                    sender, Id.as(json.get("leaseId").asText()), chainId, fee, timestamp, version, proofs);
        } else if (type == CreateAliasTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for CreateAliasTransaction");

            if (version == 1 && json.has("signature"))
                proofs = Proof.list(Proof.as(json.get("signature").asText()));
            return new CreateAliasTransaction(
                    sender, json.get("alias").asText(), chainId, fee, timestamp, version, proofs);
        } if (type == MassTransferTransaction.TYPE) {
            //todo transferCount, totalAmount?
            JsonNode jsTransfers = json.get("transfers");
            List<Transfer> transfers = new ArrayList<>();
            for (JsonNode jsTransfer : jsTransfers) {
                Recipient recipient = Recipient.as(jsTransfer.get("recipient").asText());
                long amount = jsTransfer.get("amount").asLong();
                transfers.add(Transfer.to(recipient, amount));
            }
            Asset asset = assetFromJson(json.get("assetId"));
            byte[] attachment = json.hasNonNull("attachment") ? Base58.decode(json.get("attachment").asText()) : Bytes.empty();
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
                String entryType = entry.hasNonNull("type") ? entry.get("type").asText() : "";
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

            return new SetScriptTransaction(sender, scriptFromJson(json), chainId, fee, timestamp, version, proofs);
        } else if (type == SponsorFeeTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for SponsorFeeTransaction");

            return new SponsorFeeTransaction(sender, assetFromJson(json.get("assetId")),
                    json.get("minSponsoredAssetFee").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == SetAssetScriptTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for SetAssetScriptTransaction");

            Asset asset = assetFromJson(json.get("assetId"));
            return new SetAssetScriptTransaction(sender, asset, scriptFromJson(json), chainId, fee, timestamp, version, proofs);
        } else if (type == InvokeScriptTransaction.TYPE) {
            Recipient dApp = Recipient.as(json.get("dApp").asText());
            Function function = Function.asDefault();
            if (json.hasNonNull("call")) {
                JsonNode call = json.get("call");
                List<Arg> args = call.hasNonNull("args") ? argsFromJson(call.get("args")) : new ArrayList<>();
                function = Function.as(call.get("function").asText(), args);
            }
            List<Amount> payments = new ArrayList<>();
            String paymentsFieldName = "payment"; //todo why not "payments" for v2? `version == 1 ? "payment" : "payments"`
            if (json.hasNonNull(paymentsFieldName))
                json.get(paymentsFieldName).forEach(p ->
                        payments.add(Amount.of(p.get("amount").asLong(), assetFromJson(p.get("assetId")))));
            return new InvokeScriptTransaction(
                    sender, dApp, function, payments, chainId, Amount.of(fee, feeAssetId), timestamp, version, proofs);
        } else if (type == UpdateAssetInfoTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for UpdateAssetInfoTransaction");

            Asset asset = assetFromJson(json.get("assetId"));
            String name = json.get("name").asText();
            String description = json.get("description").asText();
            return new UpdateAssetInfoTransaction(sender, asset, name, description, chainId, fee, timestamp, version, proofs);
        }

        throw new IOException("Can't parse json of transaction with type " + type);
    }
    
    public static Transaction fromJson(String json) throws IOException {
        return fromJson(JSON_MAPPER.readTree(json));
    }

    public static JsonNode toJsonObject(TransactionOrOrder txOrOrder) { //todo configurable json number->string
        ObjectNode jsObject = JSON_MAPPER.createObjectNode();
        Scheme scheme = Scheme.of(txOrOrder);

        if (txOrOrder instanceof Order) {
            Order order = (Order) txOrOrder;
            jsObject.put("id", order.id().toString())
                    .put("orderType", order.type().value())
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
                    .put("expiration", order.expiration())
                    .put("signature", order.proofs().get(0).toString());

//todo why don't show chainId? `if (order.version() < 4)`
            jsObject.remove("chainId");
            if (order.version() < 3)
                jsObject.remove("matcherFeeAssetId");

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
                        .put("script", scriptToJson(itx.compiledScript()));
                if (itx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = itx.proofs().get(0).toString();
                }
            } else if (tx instanceof TransferTransaction) {
                TransferTransaction ttx = (TransferTransaction) tx;
                jsObject.put("recipient", ttx.recipient().toString())
                        .put("amount", ttx.amount().value())
                        .put("assetId", assetToJson(ttx.amount().asset()))
                        .put("attachment", Base58.encode(ttx.attachmentBytes()));
                if (ttx.version() < 3)
                    jsObject.remove("chainId");
                if (ttx.version() == 1)
                    signature = ttx.proofs().get(0).toString();
            } else if (tx instanceof ReissueTransaction) {
                ReissueTransaction rtx = (ReissueTransaction) tx;
                jsObject.put("assetId", assetToJson(rtx.amount().asset()))
                        .put("quantity", rtx.amount().value())
                        .put("reissuable", rtx.isReissuable());
                if (rtx.version() == 1) {
                    jsObject.remove("chainId");
                    signature = rtx.proofs().get(0).toString();
                }
            } else if (tx instanceof BurnTransaction) {
                BurnTransaction btx = (BurnTransaction) tx;
                jsObject.put("assetId", assetToJson(btx.amount().asset()))
                        .put(scheme == PROTOBUF ? "quantity" : "amount", btx.amount().value());
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
                if (scheme != PROTOBUF)
                    jsObject.remove("chainId");
                if (scheme == WITH_SIGNATURE)
                    signature = etx.proofs().get(0).toString();
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
                        .put("attachment", Base58.encode(mtTx.attachmentBytes()));
                ArrayNode jsTransfers = jsObject.putArray("transfers");
                for (Transfer transfer : mtTx.transfers()) {
                    jsTransfers.addObject()
                            .put("recipient", transfer.recipient().toString())
                            .put("amount", transfer.amount());
                }
                if (mtTx.version() == 1)
                    jsObject.remove("chainId");
            } else if (tx instanceof DataTransaction) {
                DataTransaction dtx = (DataTransaction) tx;
                ArrayNode data = jsObject.putArray("data");
                dtx.data().forEach(e -> {
                    ObjectNode entry = JSON_MAPPER.createObjectNode().put("key", e.key());
                    if (e.type() == EntryType.BINARY)
                        entry.put("type", "binary").put("value", ((BinaryEntry) e).valueEncoded());
                    else if (e.type() == EntryType.BOOLEAN)
                        entry.put("type", "boolean").put("value", ((BooleanEntry) e).value());
                    else if (e.type() == EntryType.INTEGER)
                        entry.put("type", "integer").put("value", ((IntegerEntry) e).value());
                    else if (e.type() == EntryType.STRING)
                        entry.put("type", "string").put("value", ((StringEntry) e).value());
                    else if (e.type() == EntryType.DELETE) {
                        entry.putNull("value").remove("type");
                    } else throw new IllegalArgumentException("Can't serialize entry with type " + e.type());
                    data.add(entry);
                });
                if (dtx.version() == 1)
                    jsObject.remove("chainId");
            } else if (tx instanceof SetScriptTransaction) {
                SetScriptTransaction ssTx = (SetScriptTransaction) tx;
                jsObject.put("script", scriptToJson(ssTx.compiledScript()));
            } else if (tx instanceof SponsorFeeTransaction) {
                SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                if (sfTx.version() == 1)
                    jsObject.remove("chainId");
                jsObject.put("assetId", assetToJson(sfTx.asset()))
                        .put("minSponsoredAssetFee", sfTx.minSponsoredFee());
            } else if (tx instanceof SetAssetScriptTransaction) {
                SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                jsObject.put("assetId", assetToJson(sasTx.asset()))
                        .put("script", scriptToJson(sasTx.compiledScript()));
            } else if (tx instanceof InvokeScriptTransaction) {
                InvokeScriptTransaction isTx = (InvokeScriptTransaction) tx;
                jsObject.put("dApp", isTx.dApp().toString());
                if (isTx.function().isDefault())
                {} //todo why is hidden? jsObject.putNull("call");
                else {
                    ObjectNode call = jsObject.putObject("call");
                    call.put("function", isTx.function().name());
                    argsToJson(call.putArray("args"), isTx.function().args());
                }
                ArrayNode payments = jsObject.putArray("payment");
                isTx.payments().forEach(p -> {
                    ObjectNode payment = payments.addObject();
                    payment.put("amount", p.value()).
                            put("assetId", assetToJson(p.asset()));
                });
                if (isTx.version() == 1)
                    jsObject.remove("chainId");
            } else if (tx instanceof UpdateAssetInfoTransaction) {
                UpdateAssetInfoTransaction uaiTx = (UpdateAssetInfoTransaction) tx;
                jsObject.put("assetId", assetToJson(uaiTx.asset()))
                        .put("name", uaiTx.name())
                        .put("description", uaiTx.description());
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

    public static Asset assetFromJson(JsonNode json) {
        return Asset.id(json.asText(null));
    }

    public static String assetToJson(Asset asset) {
        return asset.isWaves() ? null : asset.toString();
    }

    public static List<Arg> argsFromJson(JsonNode json) throws IOException {
        List<Arg> args = new ArrayList<>();
        for (int i = 0; i < json.size(); i++) {
            JsonNode arg = json.get(i);
            String argType = arg.get("type").asText();
            if (argType.equals("binary"))
                args.add(BinaryArg.as(arg.get("value").asText()));
            else if (argType.equals("boolean"))
                args.add(BooleanArg.as(arg.get("value").asBoolean()));
            else if (argType.equals("integer"))
                args.add(IntegerArg.as(arg.get("value").asLong()));
            else if (argType.equals("string"))
                args.add(StringArg.as(arg.get("value").asText()));
            else if (argType.equals("list"))
                args.add(ListArg.as(argsFromJson(arg.get("value"))));
            else throw new IOException("Unknown arg type " + argType);
        }
        return args;
    }

    public static void argsToJson(ArrayNode json, List<Arg> args) {
        args.forEach(a -> {
            ObjectNode arg = json.addObject();
            if (a instanceof BinaryArg)
                arg.put("type", "binary").put("value", ((BinaryArg) a).valueEncoded());
            else if (a instanceof BooleanArg)
                arg.put("type", "boolean").put("value", ((BooleanArg) a).value());
            else if (a instanceof IntegerArg)
                arg.put("type", "integer").put("value", ((IntegerArg) a).value());
            else if (a instanceof StringArg)
                arg.put("type", "string").put("value", ((StringArg) a).value());
            else if (a instanceof ListArg) {
                arg.put("type", "list");
                argsToJson(arg.putArray("value"), ((ListArg) a).value());
            } else throw new IllegalArgumentException(); //todo
        });
    }

    public static byte[] scriptFromJson(JsonNode json) {
        return json.hasNonNull("script") ? Base64.decode(json.get("script").asText()) : Bytes.empty();
    }

    public static String scriptToJson(byte[] script) {
        return script == null || script.length == 0 ? null : Base64.encodeWithPrefix(script);
    }

}
