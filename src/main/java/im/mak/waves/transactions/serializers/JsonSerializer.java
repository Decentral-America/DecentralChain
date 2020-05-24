package im.mak.waves.transactions.serializers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.common.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public abstract class JsonSerializer {

    //todo use modules http://tutorials.jenkov.com/java-json/jackson-objectmapper.html#custom-serializer
    public static final ObjectMapper JSON_MAPPER = new ObjectMapper();

    public static Transaction fromJson(String json) throws IOException {
        JsonNode jsonNode = JSON_MAPPER.readTree(json);

        int type = jsonNode.get("type").asInt();
        int version = jsonNode.get("version").asInt();
        byte chainId = jsonNode.has("chainId") ? (byte) jsonNode.get("chainId").asInt() : Waves.chainId;
        PublicKey sender = PublicKey.as(jsonNode.get("senderPublicKey").asText());
        //todo validate sender address if exists? configurable? jsonNode.get("sender").asText(sender.address())
        long fee = jsonNode.get("fee").asLong();
        Asset feeAssetId = Asset.id(jsonNode.get("feeAssetId").asText(null));
        long timestamp = jsonNode.get("timestamp").asLong();
        //todo validate id if exists? configurable?
        //todo what if some field doesn't exist? Default values, e.g. for proofs

        List<Proof> proofs = new ArrayList<>();
        if (jsonNode.has("proofs")) {
            JsonNode jProofs = jsonNode.get("proofs");
            int size = jProofs.size();
            for (int i = 0; i < size; i++)
                proofs.add(Proof.as(jProofs.get(i).asText()));
        }

        if (type == IssueTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for ReissueTransaction");
            if (version == 1 && jsonNode.has("signature"))
                proofs = Proof.list(Proof.as(jsonNode.get("signature").asText()));
            return new IssueTransaction(sender, jsonNode.get("name").asText(), jsonNode.get("description").asText(),
                    jsonNode.get("quantity").asLong(), jsonNode.get("decimals").asInt(), jsonNode.get("reissuable").asBoolean(),
                    Base64.decode(jsonNode.get("script").asText()), chainId, fee, timestamp, version, proofs);
        } if (type == TransferTransaction.TYPE) {
            Recipient recipient = Recipient.as(jsonNode.get("recipient").asText());
            if (version < 3)
                chainId = recipient.chainId();
            Asset asset = jsonNode.has("assetId") ? Asset.id(jsonNode.get("assetId").asText(null)) : Asset.WAVES;
            //fixme not typed, NODE-2145
            String attachment = jsonNode.has("attachment") ? jsonNode.get("attachment").asText("") : "";

            if (version == 1 && jsonNode.has("signature"))
                proofs = Proof.list(Proof.as(jsonNode.get("signature").asText()));
            return new TransferTransaction(sender, recipient, jsonNode.get("amount").asLong(), asset,
                    attachment, chainId, fee, feeAssetId, timestamp, version, proofs);
        } else if (type == ReissueTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for ReissueTransaction");

            if (version == 1 && jsonNode.has("signature"))
                proofs = Proof.list(Proof.as(jsonNode.get("signature").asText()));
            return new ReissueTransaction(sender, Asset.id(jsonNode.get("assetId").asText()),
                    jsonNode.get("quantity").asLong(), jsonNode.get("reissuable").asBoolean(),
                    chainId, fee, timestamp, version, proofs);
        } else if (type == BurnTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for BurnTransaction");

            if (version == 1 && jsonNode.has("signature"))
                proofs = Proof.list(Proof.as(jsonNode.get("signature").asText()));
            return new BurnTransaction(sender, Asset.id(jsonNode.get("assetId").asText()),
                    jsonNode.get("quantity").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == LeaseTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for LeaseTransaction");
            Recipient recipient = Recipient.as(jsonNode.get("recipient").asText());
            if (version < 3)
                chainId = recipient.chainId();

            if (version == 1 && jsonNode.has("signature"))
                proofs = Proof.list(Proof.as(jsonNode.get("signature").asText()));
            return new LeaseTransaction(
                    sender, recipient, jsonNode.get("amount").asLong(), chainId, fee, timestamp, version, proofs);
        } else if (type == LeaseCancelTransaction.TYPE) {
            if (!feeAssetId.isWaves())
                throw new IOException("feeAssetId field must be null for LeaseCancelTransaction");

            if (version == 1 && jsonNode.has("signature"))
                proofs = Proof.list(Proof.as(jsonNode.get("signature").asText()));
            return new LeaseCancelTransaction(
                    sender, TxId.id(jsonNode.get("leaseId").asText()), chainId, fee, timestamp, version, proofs);
        } //todo other types

        throw new IOException("Can't parse json of transaction with type " + type);
    }

    public static ObjectNode toJsonObject(Transaction tx) { //todo configurable long->string
        ObjectNode jsObject = JSON_MAPPER.createObjectNode()
                .put("id", tx.id().toString()) //todo serialize id? configurable and true by default?
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
            //fixme transfer, NODE-2145
        } else if (tx instanceof ReissueTransaction) {
            ReissueTransaction rtx = (ReissueTransaction) tx;
            jsObject.put("assetId", rtx.asset().toString())
                    .put("quantity", rtx.amount())
                    .put("reissuable", rtx.isReissuable());
            if (rtx.version() == 1) {
                jsObject.remove("chainId");
                signature = rtx.proofs().get(0).toString();
            }
        } else if (tx instanceof BurnTransaction) {
            BurnTransaction btx = (BurnTransaction) tx;
            jsObject.put("assetId", btx.asset().toString())
                    .put("quantity", btx.amount());
            if (btx.version() == 1) {
                jsObject.remove("chainId");
                signature = btx.proofs().get(0).toString();
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
        } //todo other types

        jsObject.put("fee", tx.fee())
                .put("feeAssetId", tx.feeAsset() == Asset.WAVES ? null : tx.feeAsset().toString())
                .put("timestamp", tx.timestamp());

        if (signature != null)
            jsObject.put("signature", signature);
        jsObject.set("proofs", proofs); //todo configurable for v1, true by default

        return jsObject;
    }

    public static String toPrettyJson(Transaction tx) {
        return toJsonObject(tx).toPrettyString();
    }

    public static String toJson(Transaction tx) {
        return toJsonObject(tx).toString();
    }
}
