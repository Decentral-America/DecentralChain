package io.decentralchain.sdk.json.deser;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import io.decentralchain.transactions.*;
import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.sdk.LeaseInfo;
import io.decentralchain.sdk.LeaseStatus;
import io.decentralchain.sdk.StateChanges;
import io.decentralchain.sdk.info.*;
import java.io.IOException;

public class TransactionInfoDeser extends JsonDeserializer<TransactionInfo> {

  @Override
  public TransactionInfo deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    ObjectCodec codec = p.getCodec();
    JsonNode json = codec.readTree(p);

    // transaction fields and info fields are on the same level
    Transaction tx = Transaction.fromJson(json.toString());
    JsonNode applicationStatus = json.get("applicationStatus");
    ApplicationStatus status =
        applicationStatus != null
            ? codec.treeToValue(applicationStatus, ApplicationStatus.class)
            : null;
    int height = json.get("height").asInt();

    if (tx instanceof GenesisTransaction)
      return new GenesisTransactionInfo((GenesisTransaction) tx, status, height);
    else if (tx instanceof PaymentTransaction)
      return new PaymentTransactionInfo((PaymentTransaction) tx, status, height);
    else if (tx instanceof IssueTransaction)
      return new IssueTransactionInfo((IssueTransaction) tx, status, height);
    else if (tx instanceof TransferTransaction)
      return new TransferTransactionInfo((TransferTransaction) tx, status, height);
    else if (tx instanceof ReissueTransaction)
      return new ReissueTransactionInfo((ReissueTransaction) tx, status, height);
    else if (tx instanceof BurnTransaction)
      return new BurnTransactionInfo((BurnTransaction) tx, status, height);
    else if (tx instanceof ExchangeTransaction)
      return new ExchangeTransactionInfo((ExchangeTransaction) tx, status, height);
    else if (tx instanceof LeaseTransaction)
      return new LeaseTransactionInfo(
          (LeaseTransaction) tx,
          status,
          height,
          codec.treeToValue(json.get("status"), LeaseStatus.class));
    else if (tx instanceof LeaseCancelTransaction)
      return new LeaseCancelTransactionInfo(
          (LeaseCancelTransaction) tx,
          status,
          height,
          codec.treeToValue(json.get("lease"), LeaseInfo.class));
    else if (tx instanceof CreateAliasTransaction)
      return new CreateAliasTransactionInfo((CreateAliasTransaction) tx, status, height);
    else if (tx instanceof DataTransaction)
      return new DataTransactionInfo((DataTransaction) tx, status, height);
    else if (tx instanceof MassTransferTransaction)
      return new MassTransferTransactionInfo((MassTransferTransaction) tx, status, height);
    else if (tx instanceof SetScriptTransaction)
      return new SetScriptTransactionInfo((SetScriptTransaction) tx, status, height);
    else if (tx instanceof SponsorFeeTransaction)
      return new SponsorFeeTransactionInfo((SponsorFeeTransaction) tx, status, height);
    else if (tx instanceof SetAssetScriptTransaction)
      return new SetAssetScriptTransactionInfo((SetAssetScriptTransaction) tx, status, height);
    else if (tx instanceof InvokeScriptTransaction)
      return new InvokeScriptTransactionInfo(
          (InvokeScriptTransaction) tx,
          status,
          height,
          codec.treeToValue(json.get("stateChanges"), StateChanges.class));
    else if (tx instanceof UpdateAssetInfoTransaction)
      return new UpdateAssetInfoTransactionInfo((UpdateAssetInfoTransaction) tx, status, height);
    else if (tx instanceof EthereumTransaction)
      return new EthereumTransactionInfo(
          (EthereumTransaction) tx,
          status,
          height,
          stateChangesFromJson(codec, json),
          json.get("bytes").asText());
    else if (tx instanceof CommitToGenerationTransaction)
      return new CommitToGenerationTransactionInfo(
          (CommitToGenerationTransaction) tx, status, height);
    else throw new IOException("Can't parse transaction info: " + json.toString());
  }

  private StateChanges stateChangesFromJson(ObjectCodec codec, JsonNode json)
      throws JsonProcessingException {
    JsonNode payload = json.get("payload");
    if (payload == null || payload.isNull()) return null;
    JsonNode stateChanges = payload.get("stateChanges");
    return stateChanges != null ? codec.treeToValue(stateChanges, StateChanges.class) : null;
  }
}
