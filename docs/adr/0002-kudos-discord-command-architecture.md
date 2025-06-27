# ADR: Kudos Discord Command Architecture

## Status
Accepted

## Context

We need to implement a `/kudos` command in the mochi-discord service that allows users to send token rewards from application vaults to other Discord users. The command must provide a smooth user experience with autocomplete functionality while handling potential API latency and Discord's interaction timeout constraints.

## Decision

We will implement the `/kudos` command as a standalone Discord slash command with the following architecture:

### Command Structure
- **Primary Command**: `/kudos` (direct command, not a subcommand)
- **Aliases**: Both `kudos` and `kudo` map to the same command
- **Builder Type**: `SlashCommandBuilder` (not subcommand)

### Parameter Design
```typescript
.addStringOption("application") // Autocomplete enabled
.addStringOption("vault")       // Autocomplete enabled  
.addStringOption("token")       // Autocomplete enabled
.addStringOption("amount")      // Manual input
.addUserOption("recipient")     // Discord user picker
.addStringOption("reason")      // Optional manual input
```

### Autocomplete Implementation
- **Timeout Protection**: 2.5-second timeout with 500ms buffer
- **Race Condition Handling**: `Promise.race()` between API calls and timeout
- **Graceful Degradation**: Empty responses for expired interactions
- **Error Resilience**: `.catch(() => {})` on all response calls

### API Integration
- **Endpoint**: `POST /profiles/{profile_id}/applications/{app_id}/vaults/{vault_id}/transfer-requests`
- **Authentication**: Bearer token with `MOCHI_BOT_SECRET`
- **Error Handling**: Comprehensive error categorization and user-friendly messages

## Rationale

### Why Standalone Command vs Subcommand
1. **Simplicity**: Users type `/kudos` directly instead of `/app transfer`
2. **Discoverability**: Easier to find in Discord's command list
3. **Semantic Clarity**: "Kudos" better represents the recognition aspect
4. **Reduced Complexity**: No need for subcommand routing logic

### Why Autocomplete with Timeout Protection
1. **User Experience**: Prevents "Unknown interaction" errors
2. **API Resilience**: Handles slow backend responses gracefully
3. **Discord Compliance**: Respects 3-second interaction timeout
4. **Fallback Strategy**: Empty responses better than crashes

### Why Direct SlashCommandBuilder
1. **Performance**: Simpler command registration
2. **Maintainability**: Less nested structure to manage
3. **Future-Proofing**: Easier to extend with additional options
4. **Discord Best Practices**: Aligns with Discord's recommended patterns

## Implementation Details

### File Structure
```
src/commands/kudos/
├── index.ts          # Command export
└── slash.ts          # Main command implementation
```

### Key Components

#### Autocomplete Handler
```typescript
autocomplete: async function (i: AutocompleteInteraction) {
  const timeoutMs = 2500
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeoutMs)
  })
  
  const result = await Promise.race([apiPromise, timeoutPromise])
  if (!result) {
    await i.respond([]).catch(() => {})
    return
  }
}
```

#### Error Handling Strategy
- **Self-Transfer Prevention**: Check `interaction.user.id === recipient.id`
- **Profile Validation**: Verify both sender and recipient profiles exist
- **Balance Verification**: Ensure sufficient vault balance
- **Amount Validation**: Positive numbers only with decimal support

#### Success Response Format
```typescript
{
  title: "Kudos Request Created",
  description: [
    "Amount: {emoji} **{amount} {symbol}** (≈ {usd})",
    "Token: {symbol}",
    "Kudos to: {recipient}",
    "From vault: {vault_name} ({app_name})",
    "Reason: {reason}",
    "⏰ The application owner will be notified..."
  ]
}
```

## Consequences

### Positive
- **Better UX**: Direct `/kudos` command is more intuitive
- **Improved Reliability**: Timeout protection prevents interaction failures
- **Clear Semantics**: "Kudos" terminology better represents the feature
- **Reduced Complexity**: No subcommand routing needed
- **Better Performance**: Faster command registration and execution

### Negative
- **Breaking Change**: Users familiar with `/app transfer` need to learn new command
- **Command Proliferation**: Adds another top-level command to the bot
- **Migration Effort**: Need to update documentation and user training

### Risks and Mitigations
- **Risk**: Users might not discover the new command
  - **Mitigation**: Clear documentation and announcement of the feature
- **Risk**: Autocomplete timeouts still occur under extreme load
  - **Mitigation**: Monitor timeout rates and adjust timeout values if needed
- **Risk**: API changes could break autocomplete
  - **Mitigation**: Comprehensive error handling and fallback responses

## Monitoring

### Success Metrics
- Command usage frequency
- Autocomplete timeout rate < 1%
- User error rate < 5%
- Average response time < 2 seconds

### Alerts
- High timeout rates (> 5%)
- API error rates (> 10%)
- Command execution failures

## Alternatives Considered

### 1. Keep as `/app transfer` subcommand
- **Pros**: No breaking changes, familiar to existing users
- **Cons**: Less semantic clarity, more complex routing, harder to discover

### 2. Use `/reward` or `/recognize` command name
- **Pros**: Also semantic, clear purpose
- **Cons**: "Kudos" is more commonly used in tech communities

### 3. No autocomplete timeout protection
- **Pros**: Simpler implementation
- **Cons**: Poor user experience with slow APIs, interaction failures

## References
- Discord Slash Commands Documentation
- Discord Interaction Timeout Limits
- mochi-pay-api vault transfer endpoints
- Existing command patterns in mochi-discord