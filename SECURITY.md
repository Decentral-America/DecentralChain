# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 5.x     | :white_check_mark: |
| < 5.0   | :x:                |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues by emailing **security@decentralchain.io** with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact assessment
4. Any suggested fixes (optional)

### What to Expect

- **Acknowledgement**: Within 48 hours of your report
- **Assessment**: We will evaluate the severity within 5 business days
- **Resolution**: Critical issues will be patched within 14 days; lower-severity issues within 30 days
- **Disclosure**: We will coordinate with you on responsible disclosure timing

### Scope

This policy covers the `@decentralchain/assets-pairs-order` npm package, including:

- The core ordering logic (`src/index.js`, `src/utils.js`)
- Type definitions (`src/index.d.ts`)
- Pre-configured data files (`src/*.json`)
- Browser bundle (`dist/browser.js`)

### Out of Scope

- Issues in upstream dependencies (report these to the respective projects)
- Issues in applications that consume this library

## Security Best Practices for Users

- Always use the latest supported version
- Pin your dependencies or use lockfiles (`package-lock.json`)
- Regularly audit dependencies with `npm audit`
