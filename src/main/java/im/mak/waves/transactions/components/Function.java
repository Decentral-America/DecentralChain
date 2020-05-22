package im.mak.waves.transactions.components;

import java.util.Arrays;
import java.util.List;

public class Function {

    private String name;
    private List<Arg> args;

    public Function(String name, Arg... args) {
        this(name, Arrays.asList(args));
    }

    public Function(String name, List<Arg> args) {
        this.name = name;
        this.args = args;
    }

    public static Function defaultFunction() {
        return new Function(null);
    }

    public String name() {
        return name;
    }

    public List<Arg> args() {
        return args;
    }
}
