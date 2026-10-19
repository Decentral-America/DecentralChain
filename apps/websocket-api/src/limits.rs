//! Per-client-IP WebSocket connection accounting.

use axum::http::HeaderMap;
use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::{Arc, Mutex, PoisonError};

/// The client a connection is accounted to.
///
/// websocket-api listens on the host network behind a reverse proxy on the same
/// host, so for proxied connections the TCP peer is loopback and the proxy
/// writes the real client address in `X-Real-IP` (and as the last
/// `X-Forwarded-For` entry; earlier entries are client-supplied and ignored).
/// The headers are trusted only when the peer is loopback. Any other peer is
/// the client itself, so a direct client cannot spoof its accounting key.
pub fn client_ip(peer: SocketAddr, headers: &HeaderMap) -> IpAddr {
    if !peer.ip().is_loopback() {
        return peer.ip();
    }
    let parse = |name: &str, last_of_list: bool| -> Option<IpAddr> {
        let v = headers.get(name)?.to_str().ok()?;
        let v = if last_of_list {
            v.rsplit(',').next()?
        } else {
            v
        };
        v.trim().parse::<IpAddr>().ok()
    };
    parse("x-real-ip", false)
        .or_else(|| parse("x-forwarded-for", true))
        .unwrap_or_else(|| peer.ip())
}

/// Counts open WebSocket connections per client IP and enforces a cap.
#[derive(Debug)]
pub struct IpConnectionLimiter {
    max_per_ip: usize,
    counts: Mutex<HashMap<IpAddr, usize>>,
}

impl IpConnectionLimiter {
    pub fn new(max_per_ip: usize) -> Arc<Self> {
        Arc::new(Self {
            max_per_ip,
            counts: Mutex::new(HashMap::new()),
        })
    }

    /// Reserves a slot for `ip`, or `None` when it already holds `max_per_ip`.
    /// The slot is released when the returned guard is dropped.
    pub fn try_acquire(self: &Arc<Self>, ip: IpAddr) -> Option<IpConnectionGuard> {
        let mut counts = self.counts.lock().unwrap_or_else(PoisonError::into_inner);
        let count = counts.entry(ip).or_insert(0);
        if *count >= self.max_per_ip {
            return None;
        }
        *count += 1;
        drop(counts);
        Some(IpConnectionGuard {
            limiter: Arc::clone(self),
            ip,
        })
    }

    /// Open connections currently accounted to `ip`.
    pub fn active(&self, ip: IpAddr) -> usize {
        self.counts
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .get(&ip)
            .copied()
            .unwrap_or(0)
    }

    fn release(&self, ip: IpAddr) {
        let mut counts = self.counts.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(count) = counts.get_mut(&ip) {
            *count = count.saturating_sub(1);
            if *count == 0 {
                counts.remove(&ip);
            }
        }
    }
}

/// Holds one per-IP slot for the lifetime of a connection.
#[derive(Debug)]
pub struct IpConnectionGuard {
    limiter: Arc<IpConnectionLimiter>,
    ip: IpAddr,
}

impl Drop for IpConnectionGuard {
    fn drop(&mut self) {
        self.limiter.release(self.ip);
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use axum::http::HeaderMap;
    use std::net::{IpAddr, SocketAddr};

    fn headers(name: &'static str, value: &str) -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert(name, value.parse().expect("header value"));
        h
    }

    #[test]
    fn behind_local_proxy_x_real_ip_is_the_client() {
        let peer: SocketAddr = "127.0.0.1:50000".parse().unwrap();
        let ip = client_ip(peer, &headers("x-real-ip", "203.0.113.9"));
        assert_eq!(ip, "203.0.113.9".parse::<IpAddr>().unwrap());
    }

    #[test]
    fn x_real_ip_wins_over_forwarded_for() {
        let peer: SocketAddr = "127.0.0.1:50000".parse().unwrap();
        let mut h = headers("x-real-ip", "203.0.113.9");
        h.insert("x-forwarded-for", "6.6.6.6, 198.51.100.1".parse().unwrap());
        assert_eq!(
            client_ip(peer, &h),
            "203.0.113.9".parse::<IpAddr>().unwrap()
        );
    }

    #[test]
    fn behind_local_proxy_the_last_forwarded_entry_is_the_client() {
        let peer: SocketAddr = "127.0.0.1:50000".parse().unwrap();
        // A client-supplied left part must be ignored; the proxy controls the last entry.
        let ip = client_ip(peer, &headers("x-forwarded-for", "6.6.6.6, 203.0.113.9"));
        assert_eq!(ip, "203.0.113.9".parse::<IpAddr>().unwrap());
    }

    #[test]
    fn a_non_loopback_peer_is_the_client_and_headers_are_ignored() {
        let peer: SocketAddr = "198.51.100.7:40000".parse().unwrap();
        assert_eq!(
            client_ip(peer, &headers("x-real-ip", "203.0.113.9")),
            peer.ip()
        );
        assert_eq!(
            client_ip(peer, &headers("x-forwarded-for", "203.0.113.9")),
            peer.ip()
        );
    }

    #[test]
    fn a_malformed_or_missing_header_falls_back_to_the_peer() {
        let peer: SocketAddr = "127.0.0.1:50000".parse().unwrap();
        assert_eq!(
            client_ip(peer, &headers("x-real-ip", "not-an-ip")),
            peer.ip()
        );
        assert_eq!(
            client_ip(peer, &headers("x-forwarded-for", "not-an-ip")),
            peer.ip()
        );
        assert_eq!(client_ip(peer, &HeaderMap::new()), peer.ip());
    }

    #[test]
    fn limiter_caps_per_ip_and_releases_on_drop() {
        let limiter = IpConnectionLimiter::new(2);
        let a: IpAddr = "203.0.113.1".parse().unwrap();
        let b: IpAddr = "203.0.113.2".parse().unwrap();

        let g1 = limiter.try_acquire(a).expect("first");
        let g2 = limiter.try_acquire(a).expect("second");
        assert!(
            limiter.try_acquire(a).is_none(),
            "third connection from the same IP"
        );
        assert!(
            limiter.try_acquire(b).is_some(),
            "another IP is independent"
        );
        assert_eq!(limiter.active(a), 2);

        drop(g1);
        assert_eq!(limiter.active(a), 1);
        let _g3 = limiter.try_acquire(a).expect("slot freed");
        drop(g2);
        assert_eq!(limiter.active(a), 1);
    }
}
