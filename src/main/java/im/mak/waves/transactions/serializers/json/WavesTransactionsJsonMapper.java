package im.mak.waves.transactions.serializers.json;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

public class WavesTransactionsJsonMapper extends ObjectMapper {

    public WavesTransactionsJsonMapper() {
        registerModule(new WavesTransactionsModule());
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

}
