# Known Issues

## Transitive `@waves/parse-json-bignumber` Dependency

**Severity**: Medium
**Status**: Cannot resolve without upstream change

`@decentralchain/marshall@0.14.0` depends on `@waves/parse-json-bignumber@1.0.3`
as a transitive dependency. This package is functionally inert (it provides
BigNumber-safe JSON parsing) and poses no security risk, but it carries the
legacy `@waves` scope.

### Why it cannot be fixed here

The dependency lives inside `@decentralchain/marshall`, which is a published npm
package maintained separately. Removing this transitive dependency requires
either:

1. Publishing a new version of `@decentralchain/marshall` that inlines or
   replaces `@waves/parse-json-bignumber`, or
2. Forking `@decentralchain/marshall` and patching out the dependency.

### Mitigation

- The package is read-only and does not make network calls.
- It has no known vulnerabilities (`npm audit` clean).
- It is only used in the marshall serialization layer, not in any
  security-sensitive code path.

### Tracking

This issue will be resolved when `@decentralchain/marshall` is updated to remove
the `@waves` transitive dependency.
