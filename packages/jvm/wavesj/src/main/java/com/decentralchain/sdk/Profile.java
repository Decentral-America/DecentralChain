package com.decentralchain.sdk;

import java.net.URI;
import java.net.URISyntaxException;

public enum Profile {
    MAINNET("https://mainnet-node.decentralchain.io"),
    TESTNET("https://testnet-node.decentralchain.io"),
    STAGENET("https://stagenet-node.decentralchain.io"),
    LOCAL("http://127.0.0.1:6869");

    private final URI uri;

    Profile(String url) {
        try {
            this.uri = new URI(url);
        } catch (URISyntaxException e) {
            throw new IllegalStateException("Hardcoded profile URL is malformed: " + url, e);
        }
    }

    public URI uri() {
        return uri;
    }
}
