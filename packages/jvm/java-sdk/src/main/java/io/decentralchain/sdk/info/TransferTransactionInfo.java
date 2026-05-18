package io.decentralchain.sdk.info;

import com.decentralchain.transactions.TransferTransaction;
import io.decentralchain.sdk.ApplicationStatus;

public class TransferTransactionInfo extends TransactionInfo {

  public TransferTransactionInfo(
      TransferTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public TransferTransaction tx() {
    return (TransferTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "TransferTransactionInfo{} " + super.toString();
  }
}
