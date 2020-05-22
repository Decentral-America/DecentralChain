package im.mak.waves.transactions.serializers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.LeaseTransaction;
import im.mak.waves.transactions.Transaction;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Recipient;
import im.mak.waves.transactions.common.Waves;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public abstract class JsonSerializer {

    //todo use modules http://tutorials.jenkov.com/java-json/jackson-objectmapper.html#custom-serializer
    public static final ObjectMapper JSON_MAPPER = new ObjectMapper();

    //todo own global configuration (calculate tx id or not, and etc)

    public static Transaction fromJson(String json) throws IOException {
        JsonNode jsonNode = JSON_MAPPER.readTree(json);

        int type = jsonNode.get("type").asInt();
        int version = jsonNode.get("version").asInt();
        byte chainId = jsonNode.has("chainId") ? (byte) jsonNode.get("chainId").asInt() : Waves.chainId;
        PublicKey sender = PublicKey.as(jsonNode.get("senderPublicKey").asText());
        //todo validate sender address if exists? configurable? jsonNode.get("sender").asText(sender.address())
        long fee = jsonNode.get("fee").asLong();
        String feeAssetId = jsonNode.get("feeAssetId").asText(null);
        long timestamp = jsonNode.get("timestamp").asLong();
        //todo validate id if exists? configurable?
        //todo what if some filed doesn't exist? Default values, e.g. for proofs

        List<Proof> proofs = new ArrayList<>();
        if (jsonNode.has("proofs")) {
            JsonNode jProofs = jsonNode.get("proofs");
            int size = jProofs.size();
            for (int i = 0; i < size; i++)
                proofs.add(Proof.as(jProofs.get(i).asText()));
        }

        if (type == LeaseTransaction.TYPE) {
            if (feeAssetId != null)
                throw new IOException("feeAssetId field must be null for LeaseTransaction");
            Recipient recipient = Recipient.as(jsonNode.get("recipient").asText());
            if (version < 3)
                chainId = recipient.chainId();
            return new LeaseTransaction(
                    sender,
                    recipient,
                    jsonNode.get("amount").asLong(),
                    chainId,
                    fee,
                    timestamp,
                    version,
                    proofs
            );
        } //todo other types

        throw new IOException("Can't parse json of transaction with type " + type);
    }

    public static ObjectNode toJsonObject(Transaction tx) {
        ObjectNode obj = JSON_MAPPER.createObjectNode()
                .put("id", tx.id().toString()) //todo serialize id? configurable?
                .put("type", tx.type())
                .put("version", tx.version())
                .put("chainId", tx.chainId())
                .put("senderPublicKey", tx.sender().toString())
                .put("sender", tx.sender().address(tx.chainId()).toString());

        String signature = null;
        if (tx instanceof LeaseTransaction) {
            LeaseTransaction ltx = (LeaseTransaction) tx;
            obj.put("recipient", ltx.recipient().toString());
            obj.put("amount", ltx.amount());
            if (ltx.version() == 1)
                signature = ltx.proofs().get(0).toString();
            if (ltx.version() < 3)
                obj.remove("chainId");
        } //todo other types

        ArrayNode proofs = JSON_MAPPER.createArrayNode();
        tx.proofs().forEach(p -> proofs.add(p.toString()));

        obj.put("fee", tx.fee())
                .put("feeAssetId", tx.feeAsset() == Asset.WAVES ? null : tx.feeAsset().toString())
                .put("timestamp", tx.timestamp())
                .set("proofs", proofs);

        if (signature != null)
            obj.put("signature", signature);

        return obj;
    }

    public static String toPrettyJson(Transaction tx) {
        return toJsonObject(tx).toPrettyString();
    }

    public static String toJson(Transaction tx) {
        return toJsonObject(tx).toString();
    }
}
