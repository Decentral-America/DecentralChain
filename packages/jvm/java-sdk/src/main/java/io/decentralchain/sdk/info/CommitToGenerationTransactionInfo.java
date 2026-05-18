package io.decentralchain.sdk.info;

import com.decentralchain.transactions.CommitToGenerationTransaction;
import com.decentralchain.transactions.Transaction;
import io.decentralchain.sdk.ApplicationStatus;

public class CommitToGenerationTransactionInfo extends TransactionInfo {
  public CommitToGenerationTransactionInfo(
      Transaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public CommitToGenerationTransaction tx() {
    return (CommitToGenerationTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "CommitToGenerationTransaction{} " + super.toString();
  }
}
