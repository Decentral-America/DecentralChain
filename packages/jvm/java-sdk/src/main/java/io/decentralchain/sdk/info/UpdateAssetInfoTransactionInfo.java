package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.UpdateAssetInfoTransaction;

public class UpdateAssetInfoTransactionInfo extends TransactionInfo {

  public UpdateAssetInfoTransactionInfo(
      UpdateAssetInfoTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public UpdateAssetInfoTransaction tx() {
    return (UpdateAssetInfoTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "UpdateAssetInfoTransactionInfo{} " + super.toString();
  }
}
