package io.decentralchain.sdk.info;

import io.decentralchain.sdk.ApplicationStatus;
import io.decentralchain.transactions.SponsorFeeTransaction;

public class SponsorFeeTransactionInfo extends TransactionInfo {

  public SponsorFeeTransactionInfo(
      SponsorFeeTransaction tx, ApplicationStatus applicationStatus, int height) {
    super(tx, applicationStatus, height);
  }

  public SponsorFeeTransaction tx() {
    return (SponsorFeeTransaction) super.tx();
  }

  @Override
  public String toString() {
    return "SponsorFeeTransactionInfo{} " + super.toString();
  }
}
