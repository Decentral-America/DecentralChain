# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this package, please report it responsibly.

**Do NOT open a public GitHub issue.**

Instead, please email **security@decentralchain.io** with:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if any)

We will acknowledge receipt within **48 hours** and aim to release a patch within **7 days** of confirmation.

## Security Best Practices

When using this library:

- Always validate inputs before creating `BigNumber` instances from user-supplied data
- Be aware that `.toNumber()` may lose precision for very large values
- Use `.toFixed()` or `.toString()` for serialization of large values
