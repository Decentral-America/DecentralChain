package com.wavesplatform.transactions.serializers.binary;

import com.wavesplatform.transactions.invocation.StringArg;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

public class BytesWriterTest {

    @Test
    void testStringArgs() {
        StringArg emojiArg = StringArg.as("\uD83D\uDFE1");

        assertThat(new BytesWriter()
                .writeArguments(Collections.singletonList(emojiArg))
                .getBytes()).containsExactly(0, 0, 0, 1, 2, 0, 0, 0, 4, -16, -97, -97, -95);
    }
}
