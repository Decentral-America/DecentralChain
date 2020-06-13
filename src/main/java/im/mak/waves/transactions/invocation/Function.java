package im.mak.waves.transactions.invocation;

import java.util.*;

public class Function {

    private final String name;
    private final List<Arg> args;

    public Function(String name, Arg... args) {
        this(name, new ArrayList<>(Arrays.asList(args)));
    }

    public Function(String name, List<Arg> args) {
        this.name = name;
        this.args = args == null ? Collections.emptyList() : args;
    }

    public static Function asDefault() {
        return as(null);
    }

    public static Function as(String name, Arg... args) {
        return new Function(name, args);
    }

    public static Function as(String name, List<Arg> args) {
        return new Function(name, args);
    }

    public String name() {
        return name == null ? "" : name;
    }

    public List<Arg> args() {
        return args;
    }

    public boolean isDefault() {
        return name == null && args.size() == 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Function that = (Function) o;
        return Objects.equals(this.name, that.name)
                && this.args.equals(that.args);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, args);
    }

    @Override
    public String toString() {
        return "Function{" +
                "name='" + name + '\'' +
                ", args=" + args +
                '}';
    }
}
