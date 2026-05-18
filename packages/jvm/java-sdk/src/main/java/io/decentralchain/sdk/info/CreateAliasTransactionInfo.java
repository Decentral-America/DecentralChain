package io.decentralchain.sdk.info;

import com.decentralchain.transactions.CreateAliasTransaction;
import io.decentralchain.sdk.ApplicationStatus;

public class CreateAliasTransactionInfo extends TransactionInfo {

  public CreateAliasTransactionInfo(
      CreateAliasTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public CreateAliasTransaction tx() {
    return (CreateAliasTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "CreateAliasTransactionInfo{} " + super.toString();
  }
}
