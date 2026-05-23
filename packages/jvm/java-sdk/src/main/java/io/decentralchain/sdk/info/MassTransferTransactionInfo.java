package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.MassTransferTransaction;

public class MassTransferTransactionInfo extends TransactionInfo {

  public MassTransferTransactionInfo(
      MassTransferTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public MassTransferTransaction tx() {
    return (MassTransferTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "MassTransferTransactionInfo{} " + super.toString();
  }
}
