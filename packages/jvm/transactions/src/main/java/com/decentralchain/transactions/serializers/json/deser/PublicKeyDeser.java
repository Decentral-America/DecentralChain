package io.decentralchain.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import io.decentralchain.transactions.account.PublicKey;

import java.io.IOException;

public class PublicKeyDeser extends JsonDeserializer<PublicKey> {

    @Override
    public PublicKey deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return PublicKey.as(p.getValueAsString());
    }
}
