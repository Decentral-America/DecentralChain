# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.14.x  | :white_check_mark: |
| < 0.14  | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in `@decentralchain/marshall`, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please send a detailed report to:

- **Email:** security@decentralchain.io

### What to Include

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment:** Within 48 hours of receipt
- **Initial Assessment:** Within 5 business days
- **Resolution Target:** Within 30 days for critical issues

### Disclosure Policy

- We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure).
- We will credit reporters in release notes (unless anonymity is requested).
- Please allow us reasonable time to address the issue before any public disclosure.

## Security Best Practices for Users

- Always use the latest supported version.
- Pin your dependencies using a lockfile (`package-lock.json`).
- Verify package integrity via npm's built-in checksum verification.
- Review the [CHANGELOG](./CHANGELOG.md) before upgrading.
