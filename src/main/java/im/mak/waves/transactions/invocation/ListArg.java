package im.mak.waves.transactions.invocation;

import java.util.ArrayList;
import java.util.List;

import static java.util.Arrays.asList;

public class ListArg extends Arg {

    public static ListArg as(Arg... args) {
        return new ListArg(args);
    }

    public static ListArg as(List<Arg> args) {
        return new ListArg(args);
    }

    public ListArg(List<Arg> args) {
        super(ArgType.LIST, args == null ? new ArrayList<>() : args);
    }

    public ListArg(Arg... args) {
        this(args == null ? new ArrayList<>() : new ArrayList<>(asList(args)));
    }

    public List<Arg> value() {
        return (List<Arg>) super.valueAsObject();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ListArg that = (ListArg) o;
        return this.type().equals(that.type())
                && this.value().equals(that.value());
    }

}
