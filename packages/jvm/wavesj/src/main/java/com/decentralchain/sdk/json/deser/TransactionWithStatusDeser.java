package com.decentralchain.sdk.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.wavesplatform.transactions.*;
import com.decentralchain.sdk.ApplicationStatus;
import com.decentralchain.sdk.info.*;

import java.io.IOException;

public class TransactionWithStatusDeser extends JsonDeserializer<TransactionWithStatus> {

    @Override
    public TransactionWithStatus deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        ObjectCodec codec = p.getCodec();
        JsonNode json = codec.readTree(p);

        //transaction fields and info fields are on the same level
        Transaction tx = Transaction.fromJson(json.toString());
        ApplicationStatus status =
                json.has("applicationStatus")
                        ? codec.treeToValue(json.get("applicationStatus"), ApplicationStatus.class)
                        : ApplicationStatus.SUCCEEDED;

        return new TransactionWithStatus(tx, status);
    }
}
