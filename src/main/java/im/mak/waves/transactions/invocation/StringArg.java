package im.mak.waves.transactions.invocation;

public class StringArg extends Arg {

    public static StringArg as(String value) {
        return new StringArg(value);
    }

    public StringArg(String value) {
        super(ArgType.STRING, value == null ? "" : value);
    }

    public String value() {
        return (String) super.valueAsObject();
    }

}
