package com.wavesplatform.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.wavesplatform.transactions.account.Address;

import java.io.IOException;

public class AddressDeser extends JsonDeserializer<Address> {

    @Override
    public Address deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return Address.as(p.getText());
    }
}
