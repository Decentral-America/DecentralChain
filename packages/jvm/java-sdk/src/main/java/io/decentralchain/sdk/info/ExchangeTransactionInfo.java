package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.ExchangeTransaction;

public class ExchangeTransactionInfo extends TransactionInfo {

  public ExchangeTransactionInfo(
      ExchangeTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public ExchangeTransaction tx() {
    return (ExchangeTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "ExchangeTransactionInfo{} " + super.toString();
  }
}
