package com.wavesplatform.transactions.serializers.json.ser;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.wavesplatform.transactions.common.Base58String;

import java.io.IOException;

public class Base58StringSer extends JsonSerializer<Base58String> {
    @Override
    public void serialize(Base58String encodedString, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (encodedString == null || encodedString.bytes().length == 0)
            gen.writeNull();
        else
            gen.writeString(encodedString.encoded());
    }
}
