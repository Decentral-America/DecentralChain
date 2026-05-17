package com.wavesplatform.transactions.serializers.json.ser;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.wavesplatform.transactions.account.Address;

import java.io.IOException;

public class AddressSer extends JsonSerializer<Address> {
    @Override
    public void serialize(Address address, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeString(address.toString());
    }
}
