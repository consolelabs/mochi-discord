# Kudos Feature Documentation - Discord Service

## Overview

The Kudos Feature allows Discord users to send token-based recognition and rewards from application vaults to community members using the `/kudos` slash command.

## Documentation Index

### Architecture Decision Records (ADRs)
- **[Discord Command Architecture](./adr/0002-kudos-discord-command-architecture.md)** - Design decisions for the `/kudos` Discord slash command implementation, including autocomplete timeout protection and user experience optimizations.

### Changelog
- **[App Transfer Command Fixes](./changelog/0001-app-transfer-timeout-and-race-condition-fixes.md)** - Documentation of timeout protection and race condition fixes implemented for the command system.

## Quick Reference

### Command Usage
```
/kudos application:<app> vault:<vault> token:<token> amount:<amount> recipient:<user> [reason:<text>]
```

### Key Features
- **Smart Autocomplete**: Intelligent suggestions with timeout protection
- **Input Validation**: Comprehensive validation to prevent errors
- **User-Friendly Errors**: Clear, actionable error messages
- **Rich Responses**: Detailed success confirmations with USD values

### Implementation Highlights
- **Timeout Protection**: 2.5-second timeout with graceful fallback
- **Race Condition Prevention**: Robust handling of Discord's interaction limits
- **Security Validation**: Multiple checkpoints for user and vault permissions
- **Error Resilience**: Comprehensive error handling and recovery

## Related Services

This feature integrates with:
- **[mochi-pay-api](../mochi-pay-api/docs/KUDOS_FEATURE.md)** - Backend API and business logic
- **[mochi-notification](../mochi-notification/docs/KUDOS_FEATURE.md)** - Real-time notification delivery

## Development

### Local Testing
```bash
npm run dev
# Test the /kudos command in a Discord server where the bot is installed
```

### Key Files
- `src/commands/kudos/slash.ts` - Main command implementation
- `src/commands/kudos/index.ts` - Command export
- `src/commands/index.ts` - Command registration

### Error Handling
The command includes comprehensive error handling for:
- Invalid recipients (self-transfers)
- Missing profiles
- Insufficient vault balances
- Token validation failures
- API timeout scenarios

For detailed troubleshooting, see the [Project Runbook](../mochi-pay-api/docs/runbook.md). 