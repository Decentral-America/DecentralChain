# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.x     | ✅        |
| < 2.0   | ❌        |

## Reporting a Vulnerability

**Do NOT open a public issue.**

Email security concerns to **security@decentralchain.io** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (if any)

We will acknowledge receipt within **48 hours** and aim to provide a fix or
mitigation plan within **7 business days**.

## Scope

This package exports only TypeScript type definitions and compile-time constants.
It has **zero runtime dependencies** and executes no network calls, cryptographic
operations, or file-system access. Attack surface is limited to:

- Supply-chain compromise (npm package integrity)
- Type-level unsoundness that could mask runtime bugs in consuming packages

Both vectors are mitigated by:

- npm provenance signing (`publishConfig.provenance: true`)
- `publint` + `@arethetypeswrong/cli` validation on every release
- Strict TypeScript compiler options
- 90 %+ test coverage with threshold enforcement
