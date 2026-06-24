# Security audit: mochi-discord (2026-06-25)

Bounded security triage , Console Labs consolidation hardening pass (lighter adoption).

## Secret scan

gitleaks: 5 raw hit(s). Reviewed: the `discord-client-id` hits are public Discord snowflake IDs (user/role/guild IDs, not secrets), and the api-key hits are env-sourced keys / default IDs, not committed credentials. (3 generic-api-key, 2 discord-client-id). Allowlisted (test paths + snowflake numerics) in .gitleaks.toml; verified no real credential is hardcoded (keys read from `env`).

## Dependency audit

`pnpm audit --audit-level=high` added to CI; Dependabot enabled. Findings surfaced non-blocking until triaged; remediation is deliberate.

## What this PR changes

CLAUDE.md + docs/ARCHITECTURE.md + .gitleaks.toml + .github/workflows/security.yml. No source/logic change, no dependency bump.
