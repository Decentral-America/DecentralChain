package im.mak.waves.transactions.components;

public class Arg {

    //TODO static

    private Object value; //TODO typed

    public Arg(byte[] binary) {
        this.value = binary;
    }

    public Arg(boolean bool) {
        this.value = bool;
    }

    public Arg(long integer) {
        this.value = integer;
    }

    public Arg(String string) {
        this.value = string;
    }

    public Object value() {
        return value;
    }
}
