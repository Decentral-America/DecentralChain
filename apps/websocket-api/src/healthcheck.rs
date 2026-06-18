use std::io::{Read, Write};
use std::net::TcpStream;
use std::process;
use std::time::Duration;

const HEALTH_REQUEST: &[u8] =
    b"GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n";

/// Only the first 15 bytes are needed to verify "HTTP/1.1 200".
/// Reading a bounded buffer prevents a misbehaving server from causing
/// unbounded memory allocation via a large response body.
const STATUS_PREFIX: &[u8] = b"HTTP/1.1 200";
const READ_BUF_SIZE: usize = 32;

fn main() {
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8080);

    let Ok(mut stream) = TcpStream::connect(format!("127.0.0.1:{port}")) else {
        process::exit(1);
    };

    if stream
        .set_write_timeout(Some(Duration::from_secs(2)))
        .is_err()
    {
        process::exit(1);
    }
    if stream
        .set_read_timeout(Some(Duration::from_secs(4)))
        .is_err()
    {
        process::exit(1);
    }

    if stream.write_all(HEALTH_REQUEST).is_err() {
        process::exit(1);
    }

    let mut buf = [0u8; READ_BUF_SIZE];
    let n = match stream.read(&mut buf) {
        Ok(n) => n,
        Err(_) => process::exit(1),
    };

    if buf[..n].starts_with(STATUS_PREFIX) {
        process::exit(0);
    }
    process::exit(1);
}
