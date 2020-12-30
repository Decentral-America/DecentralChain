package com.wavesplatform.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.wavesplatform.transactions.common.Id;

import java.io.IOException;

public class IdDeser extends JsonDeserializer<Id> {

    @Override
    public Id deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return Id.as(p.getText());
    }
}
