# Security Policy

## Supported Versions

Security fixes are applied to the latest state of the `main` branch.

## Reporting a Vulnerability

Do not open public GitHub issues for security problems.

Instead, email `security@hvts.app` with:

- A short description of the issue
- Steps to reproduce or a proof of concept
- Impact assessment if known
- Any suggested remediation or mitigation

We will acknowledge new reports as quickly as possible, validate the issue, and
coordinate disclosure once a fix or mitigation is available.

## Scope Notes

- Secrets or credentials accidentally committed to this repository should be
  treated as compromised immediately and rotated.
- Frontend reports are most useful when they include the affected route, API
  call, and whether the issue depends on backend behavior.
