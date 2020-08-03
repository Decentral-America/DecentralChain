package im.mak.waves.transactions.serializers.json.ser;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import im.mak.waves.transactions.account.PublicKey;

import java.io.IOException;

public class PublicKeySer extends JsonSerializer<PublicKey> {

    @Override
    public void serialize(PublicKey publicKey, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeString(publicKey.toString());
    }
}
