package com.wavesplatform.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.wavesplatform.transactions.common.Base64String;

import java.io.IOException;

public class Base64StringDeser extends JsonDeserializer<Base64String> {

    @Override
    public Base64String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return new Base64String(p.getText());
    }
}
