package com.decentralchain.sdk.info;

import com.wavesplatform.transactions.PaymentTransaction;
import com.decentralchain.sdk.ApplicationStatus;

public class PaymentTransactionInfo extends TransactionInfo {

    public PaymentTransactionInfo(PaymentTransaction tx, ApplicationStatus applicationStatus, int height) {
        super(tx, applicationStatus, height);
    }

    public PaymentTransaction tx() {
        return (PaymentTransaction) super.tx();
    }

    @Override
    public String toString() {
        return "PaymentTransactionInfo{} " + super.toString();
    }

}
