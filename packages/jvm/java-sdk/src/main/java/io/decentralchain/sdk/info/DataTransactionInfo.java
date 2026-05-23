package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.DataTransaction;

public class DataTransactionInfo extends TransactionInfo {

  public DataTransactionInfo(DataTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public DataTransaction tx() {
    return (DataTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "DataTransactionInfo{} " + super.toString();
  }
}
