package com.decentralchain.sdk.info;

import com.wavesplatform.transactions.ExchangeTransaction;
import com.decentralchain.sdk.ApplicationStatus;

public class ExchangeTransactionInfo extends TransactionInfo {

    public ExchangeTransactionInfo(ExchangeTransaction tx, ApplicationStatus applicationStatus, int height) {
        super(tx, applicationStatus, height);
    }

    public ExchangeTransaction tx() {
        return (ExchangeTransaction) super.tx();
    }

    @Override
    public String toString() {
        return "ExchangeTransactionInfo{} " + super.toString();
    }

}
