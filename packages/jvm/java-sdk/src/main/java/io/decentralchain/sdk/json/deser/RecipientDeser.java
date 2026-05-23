package io.decentralchain.sdk.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import io.decentralchain.transactions.account.Address;
import io.decentralchain.transactions.common.Alias;
import io.decentralchain.transactions.common.Recipient;
import java.io.IOException;

public class RecipientDeser extends JsonDeserializer<Recipient> {

  @Override
  public Recipient deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    String value = p.getValueAsString();

    return Address.isValid(value) ? Address.as(value) : Alias.as(value);
  }
}
