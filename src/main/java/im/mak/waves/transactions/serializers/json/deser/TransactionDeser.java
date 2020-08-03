package im.mak.waves.transactions.serializers.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import im.mak.waves.transactions.Transaction;

import java.io.IOException;

public class TransactionDeser extends JsonDeserializer<Transaction> {

    @Override
    public Transaction deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        ObjectCodec codec = p.getCodec();
        JsonNode json = codec.readTree(p);

        return Transaction.fromJson(json.toString());
    }
}
