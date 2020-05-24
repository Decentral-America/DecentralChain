package im.mak.waves.transactions.components;

public class StringEntry extends DataEntry {

    public static StringEntry as(String key, String value) {
        return new StringEntry(key, value);
    }

    public StringEntry(String key, String value) {
        super(key, EntryType.STRING, value == null ? "" : value);
    }

    public String value() {
        return (String) super.valueAsObject();
    }

}
