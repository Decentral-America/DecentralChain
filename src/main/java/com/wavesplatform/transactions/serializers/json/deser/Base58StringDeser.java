package com.wavesplatform.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.wavesplatform.transactions.common.Base58String;

import java.io.IOException;

public class Base58StringDeser extends JsonDeserializer<Base58String> {

    @Override
    public Base58String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return new Base58String(p.getText());
    }
}
