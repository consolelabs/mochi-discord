# CLAUDE.md

Guidance for AI agents (and humans) working in `mochi-discord`.

## What this is

`mochi-discord` is a TypeScript/JS app in the Console Labs / Mochi product line. Package manager: pnpm.

## Commands

- Install: `pnpm install --frozen-lockfile`
- dev: `pnpm dev`
- test: `pnpm test`
- start: `pnpm start`

## Conventions

- Secrets come from env (`env` module / `process.env`), NEVER hardcoded. Discord client/user/role IDs in source are public snowflakes, not secrets.
- Follow the existing lint/format config; feature branches off the default branch.

## Security / quality (consolidation hardening pass, 2026-06-25, lighter adoption)

- gitleaks: 5 raw hit(s). Reviewed: the `discord-client-id` hits are public Discord snowflake IDs (user/role/guild IDs, not secrets), and the api-key hits are env-sourced keys / default IDs, not committed credentials. (3 generic-api-key, 2 discord-client-id). Allowlisted (test paths + snowflake numerics) in .gitleaks.toml; verified no real credential is hardcoded (keys read from `env`).
- CI (`.github/workflows/security.yml`) runs gitleaks (with `.gitleaks.toml` allowlist) + `pnpm audit --audit-level=high` on PRs.
- Dependency audit: `pnpm audit --audit-level=high`; Dependabot enabled. Bump deliberately.

## Security / quality (consolidation hardening pass, 2026-06-25, lighter adoption)

- Secret scan: `gitleaks detect -c .gitleaks.toml` (clean after review). The allowlist covers test fixtures, sample env, and public Discord snowflake IDs (user/role/guild IDs are not secrets); `src/adapters/mochi-guess.ts` is allowlisted because its only flagged value is a default game `token_id`, not a credential (the real key is env-sourced via `MOCHI_GUESS_API_KEY`).
- CI (`.github/workflows/security.yml`) runs gitleaks + `pnpm audit` on PRs; Dependabot enabled.
- Secrets come from env, never hardcoded.
