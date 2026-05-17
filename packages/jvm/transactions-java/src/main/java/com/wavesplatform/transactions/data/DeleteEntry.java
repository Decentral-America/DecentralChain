package com.wavesplatform.transactions.data;

public class DeleteEntry extends DataEntry {

    public static DeleteEntry as(String key) {
        return new DeleteEntry(key);
    }

    public DeleteEntry(String key) {
        super(key, EntryType.DELETE, null);
    }

}
