package io.decentralchain.sdk.exceptions;

import java.util.Objects;

public class CompilationException extends Exception {

    public CompilationException(String message) {
        super(message);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompilationException that = (CompilationException) o;
        return Objects.equals(getMessage(), that.getMessage());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getMessage());
    }

    @Override
    public String toString() {
        return "CompilationException{" +
                "message='" + getMessage() + '\'' +
                '}';
    }
}
