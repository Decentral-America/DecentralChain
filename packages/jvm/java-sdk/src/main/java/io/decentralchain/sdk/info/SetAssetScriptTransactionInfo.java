package io.decentralchain.sdk.info;

import com.wavesplatform.transactions.SetAssetScriptTransaction;
import io.decentralchain.sdk.ApplicationStatus;

public class SetAssetScriptTransactionInfo extends TransactionInfo {

  public SetAssetScriptTransactionInfo(
      SetAssetScriptTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public SetAssetScriptTransaction tx() {
    return (SetAssetScriptTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "SetAssetScriptTransactionInfo{} " + super.toString();
  }
}
