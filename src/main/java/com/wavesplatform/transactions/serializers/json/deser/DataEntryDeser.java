package com.wavesplatform.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.wavesplatform.transactions.data.*;
import im.mak.waves.transactions.data.*;

import java.io.IOException;

public class DataEntryDeser extends JsonDeserializer<DataEntry> {

    @Override
    public DataEntry deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        ObjectCodec codec = p.getCodec();
        JsonNode json = codec.readTree(p);

        String key = json.get("key").asText();
        if (json.hasNonNull("type")) {
            String type = json.get("type").asText();
            if (type.equals("binary"))
                return new BinaryEntry(key, json.get("value").asText());
            if (type.equals("boolean"))
                return new BooleanEntry(key, json.get("value").asBoolean());
            if (type.equals("integer"))
                return new IntegerEntry(key, json.get("value").asLong());
            if (type.equals("string"))
                return new StringEntry(key, json.get("value").asText());
        } else if (!json.hasNonNull("value"))
            return new DeleteEntry(key);

        throw new IOException("Can't parse entry \"" + p.getValueAsString() + "\"");
    }
}
