package io.decentralchain.sdk.info;

import com.wavesplatform.transactions.SetScriptTransaction;
import io.decentralchain.sdk.ApplicationStatus;

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
