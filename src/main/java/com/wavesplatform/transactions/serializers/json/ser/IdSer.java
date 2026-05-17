package com.wavesplatform.transactions.serializers.json.ser;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.wavesplatform.transactions.common.Id;

import java.io.IOException;

public class IdSer extends JsonSerializer<Id> {
    @Override
    public void serialize(Id id, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeString(id.toString());
    }
}
