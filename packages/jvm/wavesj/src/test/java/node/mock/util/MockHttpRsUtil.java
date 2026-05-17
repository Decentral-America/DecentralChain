package node.mock.util;

import com.decentralchain.sdk.Node;
import org.mockito.Mockito;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doReturn;

public class MockHttpRsUtil {

    public static void mockTransactionInfoRs(Node nodeMock, String txId, String rsFilePath) throws IOException, InterruptedException {
        doReturn(createBasicRs(rsFilePath))
                .when(nodeMock.client())
                .send(argThat((HttpRequest rq) -> rq != null && rq.uri().getPath().equals("/transactions/info/" + txId)), any());
    }

    public static void mockGetBlockRs(Node nodeMock, int height, String rsFilePath) throws IOException, InterruptedException {
        doReturn(createBasicRs(rsFilePath))
                .when(nodeMock.client())
                .send(argThat((HttpRequest rq) -> rq != null && rq.uri().getPath().equals("/blocks/at/" + height)), any());
    }

    public static void mockGBlockHeadersRs(Node nodeMock, int height, String rsFilePath) throws IOException, InterruptedException {
        doReturn(createBasicRs(rsFilePath))
                .when(nodeMock.client())
                .send(argThat((HttpRequest rq) -> rq != null && rq.uri().getPath().equals("/blocks/headers/at/" + height)), any());
    }

    public static HttpClient mockHttpClient(String addressFilePath) throws IOException, InterruptedException {
        HttpClient mockHttpClient = Mockito.mock(HttpClient.class);
        doReturn(createBasicRs(addressFilePath))
                .when(mockHttpClient)
                .send(argThat((HttpRequest rq) -> rq != null && rq.uri().getPath().endsWith("/addresses")), any());
        return mockHttpClient;
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse<byte[]> createBasicRs(String rsFilePath) throws IOException {
        HttpResponse<byte[]> response = Mockito.mock(HttpResponse.class);
        Mockito.when(response.statusCode()).thenReturn(200);
        Mockito.when(response.body()).thenReturn(Files.readAllBytes(Path.of(rsFilePath)));
        return response;
    }
}
