package im.mak.waves.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import im.mak.waves.transactions.common.AssetId;

import java.io.IOException;

public class AssetIdDeser extends JsonDeserializer<AssetId> {

    @Override
    public AssetId deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return AssetId.as(p.getText());
    }
}
