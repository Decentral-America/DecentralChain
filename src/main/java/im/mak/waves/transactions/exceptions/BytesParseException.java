package im.mak.waves.transactions.exceptions;

//TODO javadoc: used for old nor protobuf bytes parsing errors
//TODO extend closest type of exceptions
public class BytesParseException extends Exception {
    public BytesParseException(String description) {
        super(description);
    }
}
