package im.mak.waves.transactions.components;

public class IntegerEntry extends DataEntry {

    public static IntegerEntry as(String key, long value) {
        return new IntegerEntry(key, value);
    }

    public IntegerEntry(String key, long value) {
        super(key, EntryType.INTEGER, value);
    }

    public long value() {
        return (long) super.valueAsObject();
    }

}
