package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.BurnTransaction;

public class BurnTransactionInfo extends TransactionInfo {

  public BurnTransactionInfo(BurnTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public BurnTransaction tx() {
    return (BurnTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "BurnTransactionInfo{} " + super.toString();
  }
}
