# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | :white_check_mark: |

All packages in this monorepo follow independent versioning. Security patches are applied to the latest version of each affected package.

## Reporting a Vulnerability

**Do NOT open a public GitHub issue.**

Email **info@decentralchain.io** with:

1. Affected package(s) (e.g. `@decentralchain/transactions`)
2. Description of the vulnerability
3. Steps to reproduce
4. Potential impact assessment
5. Suggested fix (optional)

### Timeline

- **Acknowledgement**: 48 hours
- **Assessment**: 5 business days
- **Critical patch**: 14 days
- **Lower severity**: 30 days

## Best Practices

- Use the latest supported version of each `@decentralchain/*` package
- Pin dependencies with lockfiles (`pnpm-lock.yaml`)
- Run `pnpm audit` regularly
- Keep Node.js at version 24+ as required by this project
