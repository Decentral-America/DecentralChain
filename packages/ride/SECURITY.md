# Security Policy — packages/ride

## Reporting a Vulnerability

To report a security vulnerability in the RIDE compiler or REPL, please
follow the DecentralChain security disclosure process:

**Email**: security@decentralchain.io  
**GitHub**: [Security Advisories](https://github.com/Decentral-America/DecentralChain/security/advisories)

Do NOT open public GitHub issues for security vulnerabilities.

## Scope

This package contains:
- **RIDE compiler** (lang/) — compiles RIDE scripts to bytecode. Handles untrusted
  user input (source code). Vulnerabilities could allow malformed bytecode.
- **RIDE REPL** (repl/) — interactive evaluation. Runs in sandboxed Scala.js in browsers.
- **TypeScript wrapper** (ts/) — thin wrapper. No direct cryptographic operations.

## Known Security Notes

- `com.wavesplatform.zwaves.*` (BLS12/BN256 Groth16) is an external library.
  Monitor the [zwaves](https://github.com/wavesplatform/zwaves) repository for advisories.
- The Scala.js build does NOT bundle native RSA — RSA operations are unavailable
  in the browser build (see KNOWN_ISSUES.md).
- Protocol-level security (transaction signing, key derivation) is handled by
  `packages/sdk/crypto`, not this package.
