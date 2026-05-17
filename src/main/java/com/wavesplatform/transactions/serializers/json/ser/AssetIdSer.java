package com.wavesplatform.transactions.serializers.json.ser;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.wavesplatform.transactions.common.AssetId;

import java.io.IOException;

public class AssetIdSer extends JsonSerializer<AssetId> {
    @Override
    public void serialize(AssetId assetId, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (assetId == null || assetId.isWaves())
            gen.writeNull();
        else
            gen.writeString(assetId.encoded());
    }
}
