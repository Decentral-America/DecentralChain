package im.mak.waves.transactions.components.data;

public class BooleanEntry extends DataEntry {

    public static BooleanEntry as(String key, boolean value) {
        return new BooleanEntry(key, value);
    }

    public BooleanEntry(String key, boolean value) {
        super(key, EntryType.BOOLEAN, value);
    }

    public boolean value() {
        return (boolean) super.valueAsObject();
    }

}
