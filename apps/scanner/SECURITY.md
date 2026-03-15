# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |
| older releases | ❌ |

## Reporting a Vulnerability

We take the security of DecentralScan seriously. If you believe you have found a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, send a detailed report to **[dccscan@proton.me](mailto:dccscan@proton.me)** with:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Impact assessment** — what could an attacker achieve?
4. **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment** within 48 hours of your report
- **Status update** within 7 days with an assessment and expected timeline
- **Credit** in the security advisory (unless you prefer to remain anonymous)

### Scope

The following are in scope:

- Authentication bypass or privilege escalation
- Cross-site scripting (XSS) in the application
- Sensitive data exposure
- Dependency vulnerabilities with a known exploit

The following are **out of scope**:

- Vulnerabilities in dependencies without a proof of concept
- Issues requiring physical access to a user's device
- Social engineering attacks
- Denial of service attacks

## Security Best Practices

When deploying DecentralScan:

- Always serve over HTTPS in production
- Set appropriate Content Security Policy headers
- Keep dependencies up to date (`npm audit`)
- Use the included Nginx configuration which sets security headers
- Do not commit `.env` files or secrets to version control

## Acknowledgments

We gratefully acknowledge security researchers who help keep DecentralScan safe. Contributors will be recognized here (with permission).
