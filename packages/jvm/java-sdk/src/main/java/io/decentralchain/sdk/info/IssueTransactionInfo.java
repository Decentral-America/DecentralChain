package io.decentralchain.sdk.info;

import com.decentralchain.transactions.IssueTransaction;
import io.decentralchain.sdk.ApplicationStatus;

public class IssueTransactionInfo extends TransactionInfo {

  public IssueTransactionInfo(
      IssueTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public IssueTransaction tx() {
    return (IssueTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "IssueTransactionInfo{} " + super.toString();
  }
}
