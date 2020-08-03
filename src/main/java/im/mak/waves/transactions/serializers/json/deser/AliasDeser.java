package im.mak.waves.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import im.mak.waves.transactions.common.Alias;

import java.io.IOException;

public class AliasDeser extends JsonDeserializer<Alias> {

    @Override
    public Alias deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return Alias.as(p.getValueAsString());
    }

}
