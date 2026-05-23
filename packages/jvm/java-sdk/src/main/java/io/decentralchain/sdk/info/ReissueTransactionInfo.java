package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.ReissueTransaction;

public class ReissueTransactionInfo extends TransactionInfo {

  public ReissueTransactionInfo(
      ReissueTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public ReissueTransaction tx() {
    return (ReissueTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "ReissueTransactionInfo{} " + super.toString();
  }
}
