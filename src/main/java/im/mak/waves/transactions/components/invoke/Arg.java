package im.mak.waves.transactions.components.invoke;

import im.mak.waves.crypto.base.Base64;

import java.util.Objects;

public abstract class Arg {

    private final ArgType type;
    private final Object value;

    protected Arg(ArgType type, Object value) {
        if (type == null || value == null)
            throw new IllegalArgumentException("Argument type and value can't be null");
        this.type = type;
        this.value = value;
    }

    public ArgType type() {
        return type;
    }

    public Object valueAsObject() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Arg that = (Arg) o;
        return this.type == that.type
                && this.value.equals(that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, value);
    }

    @Override
    public String toString() {
        String value;
        if (this.value instanceof byte[])
            value = Base64.encode((byte[]) this.value);
        else if (this.value instanceof Boolean)
            value = String.valueOf((boolean) this.value);
        else if (this.value instanceof Long)
            value = String.valueOf((long) this.value);
        else if (this.value instanceof String)
            value = (String) this.value;
        else value = "<unknown type>";
        return "Arg{" +
                "type=" + type +
                ", value=" + value +
                '}';
    }

}
