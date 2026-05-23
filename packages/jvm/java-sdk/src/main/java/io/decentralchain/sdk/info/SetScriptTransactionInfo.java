package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.SetScriptTransaction;

public class SetScriptTransactionInfo extends TransactionInfo {

  public SetScriptTransactionInfo(
      SetScriptTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public SetScriptTransaction tx() {
    return (SetScriptTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "SetScriptTransactionInfo{} " + super.toString();
  }
}
