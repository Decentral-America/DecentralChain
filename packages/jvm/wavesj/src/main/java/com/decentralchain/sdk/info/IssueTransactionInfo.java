package com.decentralchain.sdk.info;

import com.wavesplatform.transactions.IssueTransaction;
import com.decentralchain.sdk.ApplicationStatus;

public class IssueTransactionInfo extends TransactionInfo {

    public IssueTransactionInfo(IssueTransaction tx, ApplicationStatus applicationStatus, int height) {
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
