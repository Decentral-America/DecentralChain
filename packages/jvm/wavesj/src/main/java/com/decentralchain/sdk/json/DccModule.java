package com.decentralchain.sdk.json;

import com.wavesplatform.transactions.common.Recipient;
import com.wavesplatform.transactions.invocation.Function;
import com.wavesplatform.transactions.serializers.json.WavesTransactionsModule;
import com.decentralchain.sdk.info.TransactionInfo;
import com.decentralchain.sdk.info.TransactionWithStatus;
import com.decentralchain.sdk.json.deser.FunctionDeser;
import com.decentralchain.sdk.json.deser.RecipientDeser;
import com.decentralchain.sdk.json.deser.TransactionInfoDeser;
import com.decentralchain.sdk.json.deser.TransactionWithStatusDeser;

public class DccModule extends WavesTransactionsModule {
    public DccModule() {
        super();
        addDeserializer(Function.class, new FunctionDeser());
        addDeserializer(Recipient.class, new RecipientDeser());
        addDeserializer(TransactionWithStatus.class, new TransactionWithStatusDeser());
        addDeserializer(TransactionInfo.class, new TransactionInfoDeser());
    }
}
