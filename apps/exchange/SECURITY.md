# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark:                |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue.**

Email **info@decentralchain.io** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (optional)

### Timeline

- **Acknowledgement**: 48 hours
- **Assessment**: 5 business days
- **Critical patch**: 14 days
- **Lower severity**: 30 days

## Best Practices

- Use the latest supported version
- Pin dependencies with lockfiles
- Run `npm audit` regularly

## Enterprise Security Controls

- Dependency changes are restricted by `governance/dependency-allowlist.json` and enforced via `npm run policy:deps`.
- Runtime feature enablement is controlled by `governance/feature-flags.json` and enforced via `npm run policy:flags`.
- CI and local release validation enforce both controls through `npm run policy:all`.
