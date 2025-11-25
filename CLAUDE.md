# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mochi is a Discord bot built with TypeScript and discord.js v13. It provides various crypto/DeFi features including tipping, wallet tracking, airdrops, and more.

## Common Commands

```bash
# Install dependencies
pnpm install

# Run bot in dev mode (hot reload)
pnpm dev

# Run all tests
pnpm test

# Run a single test file
pnpm test -- src/commands/tip/index/slash.test.ts

# Run tests matching a pattern
pnpm test -- --testNamePattern="pattern"

# Lint and fix
pnpm lint:fix

# Format code
pnpm format

# Sync slash commands to Discord
pnpm cmd:sync

# Generate API types from Swagger
pnpm generate:types
```

## Architecture

### Core Components

```
Discord                API
---------------       -------
|             |          |
======================================
[commands] <-> [events]    [handlers]
    |             |            |
    └---------------------------┘
                  |
              [modules]
```

### Directory Structure

- **src/commands/**: Slash and text commands organized by feature (e.g., `tip/`, `balances/`, `token/`)
  - Each command has: `index.ts` (entry), `slash.ts` (slash command), `text.ts` (text command), `processor.ts` (business logic)
- **src/adapters/**: API clients for external services (mochi-api, mochi-pay, profile, defi, etc.)
- **src/listeners/**: Discord event handlers (ready, message, interaction)
- **src/handlers/**: API webhook handlers
- **src/utils/**: Shared utilities
- **src/errors/**: Custom error definitions
- **src/types/**: TypeScript type definitions
- **src/ui/**: UI components (canvas rendering)
- **src/cache/**: Caching utilities
- **src/queue/**: Kafka queue producer/consumer

### Command Structure

Commands follow a consistent pattern:
1. `slash.ts` - Defines slash command structure and options
2. `text.ts` - Handles text-based command parsing
3. `processor.ts` - Contains core business logic (shared between slash/text)
4. Tests are colocated with a `.test.ts` suffix

### Key Dependencies

- **discord.js v13**: Discord API client
- **vite-node**: TypeScript execution (dev and prod)
- **pino**: Logging
- **jest/ts-jest**: Testing
- **canvas/chartjs-node-canvas**: Image generation
- **Kafka**: Event queue
- **Unleash**: Feature flags

### API Integration

The bot communicates with multiple APIs:
- `API_SERVER_HOST`: Main Mochi API (most commands)
- `INDEXER_API_SERVER_HOST`: Indexer for profile data
- `PT_API_SERVER_HOST`: Pod Town integration

### Module Resolution

TypeScript uses `src/` as baseUrl, allowing imports like:
```typescript
import { logger } from "logger"
import { slashCommands } from "commands"
```

### Feature Flags

Unleash controls feature availability. Commands sync automatically when flags change in production.

## Testing

- Tests are colocated with source files using `.test.ts` suffix
- Uses Jest with ts-jest preset
- Module paths resolve from `src/` directory
- Run single test: `pnpm test -- path/to/file.test.ts`

## Logging

Uses pino logger imported from `logger`. Error logs are sent to Discord channels configured via `LOG_CHANNEL_ID` and `ALERT_CHANNEL_ID`.

Log format should include:
- **Where**: Command/event, channel, guild, user
- **What**: Error details and data
- **How**: Reproduction steps or curl command

## Environment Variables

Required:
- `DISCORD_TOKEN`: Bot token
- `APPLICATION_ID`: For slash command registration
- `API_SERVER_HOST`: Main API endpoint
- `INDEXER_API_SERVER_HOST`: Indexer API endpoint

See README.md for full list.
