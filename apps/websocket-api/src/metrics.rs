use prometheus::{Counter, Histogram, HistogramOpts, IntGauge, Registry, exponential_buckets};
use std::sync::{LazyLock, Once};

pub static REGISTRY: LazyLock<Registry> = LazyLock::new(Registry::new);

pub static CLIENTS: LazyLock<IntGauge> = LazyLock::new(|| {
    IntGauge::new(
        "websocket_clients_active",
        "Number of currently connected WebSocket clients",
    )
    .expect("create websocket_clients_active")
});

pub static CLIENT_CONNECT: LazyLock<Counter> = LazyLock::new(|| {
    Counter::new(
        "websocket_connections_total",
        "Total WebSocket connections accepted",
    )
    .expect("create websocket_connections_total")
});

pub static CLIENT_DISCONNECT: LazyLock<Counter> = LazyLock::new(|| {
    Counter::new(
        "websocket_disconnections_total",
        "Total WebSocket connections closed",
    )
    .expect("create websocket_disconnections_total")
});

pub static TOPICS: LazyLock<IntGauge> = LazyLock::new(|| {
    IntGauge::new(
        "websocket_topics_active",
        "Number of topics with at least one subscriber",
    )
    .expect("create websocket_topics_active")
});

pub static TOPIC_SUBSCRIBED: LazyLock<Counter> = LazyLock::new(|| {
    Counter::new(
        "websocket_topic_subscriptions_total",
        "Total topic subscription requests processed",
    )
    .expect("create websocket_topic_subscriptions_total")
});

pub static TOPIC_UNSUBSCRIBED: LazyLock<Counter> = LazyLock::new(|| {
    Counter::new(
        "websocket_topic_unsubscriptions_total",
        "Total topic unsubscription requests processed",
    )
    .expect("create websocket_topic_unsubscriptions_total")
});

pub static MESSAGES: LazyLock<Counter> = LazyLock::new(|| {
    Counter::new(
        "websocket_messages_sent_total",
        "Total update messages sent to clients",
    )
    .expect("create websocket_messages_sent_total")
});

pub static SUBSCRIBED_MESSAGE_LATENCIES: LazyLock<Histogram> = LazyLock::new(|| {
    // Start at 500µs — cache-hit subscribes complete sub-millisecond.
    // 12 buckets covers 500µs → ~1s; anything beyond that is a timeout, not a latency.
    Histogram::with_opts(
        HistogramOpts::new(
            "websocket_subscription_latency_seconds",
            "Time from Subscribe received to Subscribed reply sent",
        )
        .buckets(exponential_buckets(0.0005, 2.0, 12).expect("build histogram buckets")),
    )
    .expect("create websocket_subscription_latency_seconds")
});

/// Depth of the in-process channel between the Redis updater and the broadcast handler.
/// Incremented when a message arrives from Redis; decremented when the handler consumes it.
pub static REDIS_QUEUE_DEPTH: LazyLock<IntGauge> = LazyLock::new(|| {
    IntGauge::new(
        "websocket_redis_queue_depth",
        "Number of Redis pub/sub messages pending processing",
    )
    .expect("create websocket_redis_queue_depth")
});

pub static TOPICS_MAP_SIZE: LazyLock<IntGauge> = LazyLock::new(|| {
    IntGauge::new(
        "websocket_topics_map_size",
        "Entry count of the global topics map",
    )
    .expect("create websocket_topics_map_size")
});

pub static TOPICS_MAP_CAPACITY: LazyLock<IntGauge> = LazyLock::new(|| {
    IntGauge::new(
        "websocket_topics_map_capacity",
        "Allocated capacity of the global topics map",
    )
    .expect("create websocket_topics_map_capacity")
});

/// Registers all metrics into the custom registry. Safe to call multiple times — only registers
/// on the first call; subsequent calls are no-ops.
pub fn register_all() {
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        macro_rules! register {
            ($metric:expr) => {
                REGISTRY
                    .register(Box::new($metric.clone()))
                    .expect(concat!("register ", stringify!($metric)))
            };
        }

        register!(CLIENTS);
        register!(CLIENT_CONNECT);
        register!(CLIENT_DISCONNECT);
        register!(TOPICS);
        register!(TOPIC_SUBSCRIBED);
        register!(TOPIC_UNSUBSCRIBED);
        register!(MESSAGES);
        register!(SUBSCRIBED_MESSAGE_LATENCIES);
        register!(REDIS_QUEUE_DEPTH);
        register!(TOPICS_MAP_SIZE);
        register!(TOPICS_MAP_CAPACITY);
    });
}
