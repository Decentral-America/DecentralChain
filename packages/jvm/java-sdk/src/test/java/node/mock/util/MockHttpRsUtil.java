package node.mock.util;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doReturn;

import io.decentralchain.sdk.Node;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.mockito.Mockito;

public class MockHttpRsUtil {

  public static void mockTransactionInfoRs(Node nodeMock, String txId, String rsFilePath)
      throws IOException, InterruptedException {
    doReturn(createBasicRs(rsFilePath))
        .when(nodeMock.client())
        .send(
            argThat(
                (HttpRequest rq) ->
                    rq != null && rq.uri().getPath().equals("/transactions/info/" + txId)),
            any());
  }

  public static void mockGetBlockRs(Node nodeMock, int height, String rsFilePath)
      throws IOException, InterruptedException {
    doReturn(createBasicRs(rsFilePath))
        .when(nodeMock.client())
        .send(
            argThat(
                (HttpRequest rq) ->
                    rq != null && rq.uri().getPath().equals("/blocks/at/" + height)),
            any());
  }

  public static void mockGBlockHeadersRs(Node nodeMock, int height, String rsFilePath)
      throws IOException, InterruptedException {
    doReturn(createBasicRs(rsFilePath))
        .when(nodeMock.client())
        .send(
            argThat(
                (HttpRequest rq) ->
                    rq != null && rq.uri().getPath().equals("/blocks/headers/at/" + height)),
            any());
  }

  public static HttpClient mockHttpClient(String addressFilePath)
      throws IOException, InterruptedException {
    HttpClient mockHttpClient = Mockito.mock(HttpClient.class);
    // Read the address from the stub file to derive a consistent generator address
    String addressContent = new String(Files.readAllBytes(Path.of(addressFilePath)), StandardCharsets.UTF_8);
    // Extract the first address from the JSON array, e.g. ["3M4qw..."] → 3M4qw...
    String address = addressContent.replaceAll("[\\[\\]\"]", "").trim();
    // Mock /blocks/headers/last — returns a minimal block header with the same address as generator
    byte[] blockHeaderJson =
        ("{\"generator\":\"" + address + "\",\"height\":1,\"version\":5}").getBytes(StandardCharsets.UTF_8);
    doReturn(createBasicRsFromBytes(blockHeaderJson))
        .when(mockHttpClient)
        .send(
            argThat(
                (HttpRequest rq) ->
                    rq != null && rq.uri().getPath().endsWith("/blocks/headers/last")),
            any());
    // Mock /addresses (still needed by getAddresses() calls in tests)
    doReturn(createBasicRs(addressFilePath))
        .when(mockHttpClient)
        .send(
            argThat((HttpRequest rq) -> rq != null && rq.uri().getPath().endsWith("/addresses")),
            any());
    return mockHttpClient;
  }

  private static HttpResponse<byte[]> createBasicRs(String rsFilePath) throws IOException {
    return createBasicRsFromBytes(Files.readAllBytes(Path.of(rsFilePath)));
  }

  @SuppressWarnings("unchecked")
  private static HttpResponse<byte[]> createBasicRsFromBytes(byte[] body) {
    HttpResponse<byte[]> response = Mockito.mock(HttpResponse.class);
    Mockito.when(response.statusCode()).thenReturn(200);
    Mockito.when(response.body()).thenReturn(body);
    return response;
  }
}
