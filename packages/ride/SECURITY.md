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

## Security Enforcement Properties (DCC-252 Phase C Attestation)

The RIDE compiler processes untrusted user-submitted scripts. The following
limits are enforced at runtime and verified by the test suite in
`lang/tests/src/test/scala/`:

### Script Complexity Limits

Enforced by `ContractLimits.scala` and `EvaluatorV2.scala`.
Per-version maximums (see `ContractLimits.MaxComplexityByVersion`):
- V1–V4: 2,000 complexity units per script
- V5: 10,000 per callable; 2,000 per verifier
- V6+: 52,000 per callable; 2,000 per verifier

Scripts exceeding the limit are rejected at evaluation time; the evaluator
returns a typed `ExecutionError`, not a JVM exception. Internal evaluation
state (variable bindings, complexity counters) is NOT included in error messages
returned to script authors. Tests: `EvaluatorV2Test` (complexity accounting).

### FOLD<N> Iteration Cap

`FOLD<N>` is a bounded loop construct. The parser (`Parser.scala`) enforces
`N ≤ MaxListLengthV4` (1,000 in V4+). Scripts with `FOLD<N>` where N exceeds
the limit are rejected at parse time with a human-readable message:
`"List size limit in FOLD is too big, N must be less or equal MaxListLengthV4"`.

### Crypto Input Size Bounds

Byte-vector operations (`take`, `takeRight`, `drop`, `dropRight`) enforce a
maximum ByteVector length at runtime. Attempts to exceed the limit return a
user-facing error: `"Number = X passed to take() exceeds ByteVector limit = Y"`.
The `fromBase64String` function enforces a 1,024-byte limit. String functions
enforce a 500-byte input limit for V6+. Tests: `BytesDropTakeTest`,
`CodecFunctionsTest`, `SplitFunctionTest`.

### Script Size Limits

Compile-time checks enforced by `ExprScript`:
- Expression scripts: 8 KB maximum (`MaxExprSizeInBytes = 8 * 1024`)
- Contract scripts: 32 KB maximum (`MaxContractSizeInBytes = 32 * 1024`)
- Contract scripts V6+: 160 KB maximum (`MaxContractSizeInBytesV6 = 160 * 1024`)

### Error Message Safety

All runtime errors produced by the evaluator use domain-specific error types
(`ExecutionError`, `CommonError`). Error messages expose only the user-visible
RIDE expression or limit value — no JVM stack traces, internal variable names,
or memory addresses are surfaced to script authors.

## Known Security Notes

- `com.wavesplatform.zwaves.*` (BLS12/BN256 Groth16) is an external library.
  Monitor the [zwaves](https://github.com/wavesplatform/zwaves) repository for advisories.
- The Scala.js build does NOT bundle native RSA — RSA operations are unavailable
  in the browser build (see KNOWN_ISSUES.md).
- Protocol-level security (transaction signing, key derivation) is handled by
  `packages/sdk/crypto`, not this package.
