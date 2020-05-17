package im.mak.waves.transactions.components;

import java.util.Arrays;
import java.util.List;

public class Function {

    public static Function defaultFunction() {
        return new Function(null);
    }

    private String name;
    private List<Arg> args;

    public Function(String name, Arg... args) {
        this(name, Arrays.asList(args));
    }

    public Function(String name, List<Arg> args) {
        this.name = name;
        this.args = args;
    }

    public String name() {
        return name;
    }

    public List<Arg> args() {
        return args;
    }
}
