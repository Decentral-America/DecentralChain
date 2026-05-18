package io.decentralchain.sdk.info;

import com.decentralchain.transactions.DataTransaction;
import io.decentralchain.sdk.ApplicationStatus;

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
