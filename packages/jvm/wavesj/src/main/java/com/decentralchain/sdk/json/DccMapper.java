package com.decentralchain.sdk.json;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

public class DccMapper extends ObjectMapper {

    public DccMapper() {
        registerModule(new DccModule());
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
}
