package io.decentralchain.transactions.serializers.json;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

public class DccTransactionsJsonMapper extends ObjectMapper {

    public DccTransactionsJsonMapper() {
        registerModule(new DccTransactionsModule());
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

}
