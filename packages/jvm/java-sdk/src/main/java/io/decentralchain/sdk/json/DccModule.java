package io.decentralchain.sdk.json;

import io.decentralchain.sdk.info.TransactionInfo;
import io.decentralchain.sdk.info.TransactionWithStatus;
import io.decentralchain.sdk.json.deser.FunctionDeser;
import io.decentralchain.sdk.json.deser.RecipientDeser;
import io.decentralchain.sdk.json.deser.TransactionInfoDeser;
import io.decentralchain.sdk.json.deser.TransactionWithStatusDeser;
import io.decentralchain.transactions.common.Recipient;
import io.decentralchain.transactions.invocation.Function;
import io.decentralchain.transactions.serializers.json.DccTransactionsModule;

public class DccModule extends DccTransactionsModule {
  public DccModule() {
    super();
    addDeserializer(Function.class, new FunctionDeser());
    addDeserializer(Recipient.class, new RecipientDeser());
    addDeserializer(TransactionWithStatus.class, new TransactionWithStatusDeser());
    addDeserializer(TransactionInfo.class, new TransactionInfoDeser());
  }
}
