package com.decentralchain.sdk.info;

import com.wavesplatform.transactions.ReissueTransaction;
import com.decentralchain.sdk.ApplicationStatus;

public class ReissueTransactionInfo extends TransactionInfo {

    public ReissueTransactionInfo(ReissueTransaction tx, ApplicationStatus applicationStatus, int height) {
        super(tx, applicationStatus, height);
    }

    public ReissueTransaction tx() {
        return (ReissueTransaction) super.tx();
    }

    @Override
    public String toString() {
        return "ReissueTransactionInfo{} " + super.toString();
    }

}
