package io.decentralchain.sdk.json;

import com.decentralchain.transactions.common.Recipient;
import com.decentralchain.transactions.invocation.Function;
import com.decentralchain.transactions.serializers.json.WavesTransactionsModule;
import io.decentralchain.sdk.info.TransactionInfo;
import io.decentralchain.sdk.info.TransactionWithStatus;
import io.decentralchain.sdk.json.deser.FunctionDeser;
import io.decentralchain.sdk.json.deser.RecipientDeser;
import io.decentralchain.sdk.json.deser.TransactionInfoDeser;
import io.decentralchain.sdk.json.deser.TransactionWithStatusDeser;

public class DccModule extends WavesTransactionsModule {
  public DccModule() {
    super();
    addDeserializer(Function.class, new FunctionDeser());
    addDeserializer(Recipient.class, new RecipientDeser());
    addDeserializer(TransactionWithStatus.class, new TransactionWithStatusDeser());
    addDeserializer(TransactionInfo.class, new TransactionInfoDeser());
  }
}
