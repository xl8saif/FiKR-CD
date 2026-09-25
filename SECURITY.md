# Security Policy

## Scope

This policy covers the FiKR&CD public website, its source repository, public research resources, and the production deployment.

## Reporting a vulnerability

Please do not publish suspected security vulnerabilities in a public issue, discussion, or pull request.

Use GitHub's private vulnerability reporting / Security Advisories for this repository when available. Include:
- the affected URL, file, or component;
- steps to reproduce;
- security impact;
- screenshots or logs when useful;
- a suggested remediation, if known.

Do not include passwords, API keys, tokens, personal data, or other secrets in the report.

## Secrets

Secrets must never be committed to the repository or embedded in client-side JavaScript. Production credentials belong in Vercel environment variables or the relevant provider's secret store.

If a real credential is ever exposed, treat it as compromised: rotate/revoke it first, then remove the exposed value from the repository history as appropriate.

## Supported versions

The `main` branch and the current production deployment are the supported versions.

## Security maintenance

FiKR&CD uses automated dependency monitoring, secret protection, code scanning, and production security headers where supported by the hosting platform.
