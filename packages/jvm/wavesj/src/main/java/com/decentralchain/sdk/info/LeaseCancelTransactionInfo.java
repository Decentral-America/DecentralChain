package com.decentralchain.sdk.info;

import com.wavesplatform.transactions.LeaseCancelTransaction;
import com.decentralchain.sdk.ApplicationStatus;
import com.decentralchain.sdk.LeaseInfo;

public class LeaseCancelTransactionInfo extends TransactionInfo {

    private final LeaseInfo leaseInfo;

    public LeaseCancelTransactionInfo(LeaseCancelTransaction tx, ApplicationStatus applicationStatus, int height, LeaseInfo leaseInfo) {
        super(tx, applicationStatus, height);
        this.leaseInfo = leaseInfo;
    }

    public LeaseCancelTransaction tx() {
        return (LeaseCancelTransaction) super.tx();
    }

    public LeaseInfo leaseInfo() {
        return leaseInfo;
    }

}
