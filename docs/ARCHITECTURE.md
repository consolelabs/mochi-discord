# mochi-discord architecture

TypeScript/JS app for Console Labs / Mochi. Package manager: pnpm. Scripts: start, dev, test, test:ci, lint:fix, generate:types, guilds:prune, format, cmd:sync, cmd:global:destroy.

## Notes for agents

- Build/run via the pnpm scripts above. Config + secrets via env, not source.
- Live product surface: prefer additive changes; verify with `pnpm test`.
