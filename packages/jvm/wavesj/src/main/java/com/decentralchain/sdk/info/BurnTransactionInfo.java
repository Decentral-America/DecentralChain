package com.decentralchain.sdk.info;

import com.wavesplatform.transactions.BurnTransaction;
import com.decentralchain.sdk.ApplicationStatus;

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
