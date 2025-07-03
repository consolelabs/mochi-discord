---
title: "Project Runbook"
last_updated: "2025-07-02T16:11:32.285Z"
distilled_from:
  - "docs/adr/0001-kudos-command-architecture.md"
  - "docs/adr/0002-kudos-discord-command-architecture.md"
  - "docs/specs/0001-kudos-vault-transfer-system.md"
  - "docs/Overview.md"
  - "docs/KUDOS_FEATURE.md"
---
# Mochi Discord Bot Service Runbook

## Service Overview

The Mochi Discord Bot provides Discord server integration for the Mochi ecosystem, enabling users to interact with Mochi Pay features directly through Discord commands. The bot handles command processing, user interactions, and real-time notifications for transfer requests and approvals.

## Core Features

### 1. Kudos Command System
- **Token Recognition**: Send token-based appreciation from application vaults
- **Interactive UI**: Button-based approval/rejection interfaces
- **Autocomplete**: Smart suggestions for applications, vaults, and tokens
- **Validation**: Comprehensive input validation and error handling

### 2. Transfer Request Management
- **Interactive Notifications**: Clickable approve/reject buttons
- **Status Updates**: Real-time progress notifications for requesters
- **Error Handling**: Graceful handling of settled requests with accurate status
- **Smart Routing**: Context-aware notification targeting

### 3. Multi-Platform Integration
- **Discord Commands**: Slash command interface with rich embeds
- **Button Interactions**: Interactive message components
- **User Management**: Profile linking and permission validation
- **Real-time Updates**: Live status updates for transfer requests

## Command Structure

### Primary Commands

#### `/kudos` Command
```
/kudos application:<app> vault:<vault> token:<token> amount:<amount> recipient:<user> [reason:<text>]
```

**Parameters**:
- `application`: Target application (autocomplete enabled)
- `vault`: Application vault (filtered by selected app)
- `token`: Token type (filtered by vault availability)
- `amount`: Transfer amount (positive numbers only)
- `recipient`: Target Discord user (prevents self-transfers)
- `reason`: Optional description for the transfer

**Validation Rules**:
- User cannot send kudos to themselves
- Amount must be positive
- Recipient must have a valid Mochi profile
- User must have permissions for the selected application/vault

### Interactive Components

#### Transfer Request Buttons
- **Approve Button**: `approve-{request_code}-{app_id}`
- **Reject Button**: `reject-{request_code}-{app_id}`

#### Button Processing Flow
1. Extract request code and app ID from custom ID
2. Get user profile from Discord ID
3. Generate authentication headers
4. Call Mochi Pay API with action
5. Update message based on result
6. Handle errors with appropriate user feedback

## Discord Integration Architecture

### Authentication Flow
```typescript
// Generate application headers for API authentication
export async function getMochiApplicationHeaders() {
  const privKey = new Uint8Array(Buffer.from(MOCHI_APP_PRIVATE_KEY, "hex")).slice(0, 32)
  const message = Math.floor(new Date().getTime() / 1000).toString()
  const messageHex = Buffer.from(message, "utf-8")
  const signature = await ed25519.signAsync(messageHex, privKey)
  
  return {
    "X-Message": message,
    "X-Signature": ed25519.etc.bytesToHex(Buffer.from(signature)),
    "X-Application": "Mochi",
  }
}
```

### API Integration Points
- **Mochi Pay API**: Core backend for transfer operations
- **Mochi Profile API**: User profile management and linking
- **Discord API**: Command registration and message handling

### Error Handling Strategy

#### Settled Request Handling
```typescript
// Proper status resolution for settled requests
async function handleTransferRequestErr(i: ButtonInteraction, status: number, action: string) {
  if (status === 400) {
    // Fetch actual transfer request status instead of guessing
    const appHeaders = await getMochiApplicationHeaders()
    const { data: transferRequest } = await mochiPay.getTransferRequestByCode({
      headers: appHeaders,
      requestCode,
      appId,
    })
    
    // Use actual status from API response
    let settledStatus = "settled"
    if (transferRequest.status === "success") {
      settledStatus = "approved"
    } else if (transferRequest.status === "cancelled") {
      settledStatus = "rejected"
    }
    
    // Update message with accurate status
    await updateSettledMessage(i, settledStatus)
  }
}
```

## Operational Procedures

### Normal Operation Flow

#### 1. Command Processing
**Trigger**: User executes `/kudos` command
**Process**:
1. Discord validates command syntax
2. Bot processes autocomplete requests (2.5s timeout)
3. Command validation prevents invalid inputs
4. API call creates vault transfer request
5. Success/error response displayed to user

**Success Indicators**:
- Command responds within 3 seconds
- Autocomplete provides relevant suggestions
- Success embed shows request details
- No "Unknown interaction" errors

**Troubleshooting**:
```bash
# Check bot status
pm2 status mochi-discord

# View recent command logs
pm2 logs mochi-discord --lines 100

# Monitor command response times
grep "command_duration" /var/log/mochi-discord/app.log | tail -10
```

#### 2. Interactive Button Processing
**Trigger**: User clicks approve/reject button
**Process**:
1. Extract request information from button ID
2. Validate user permissions
3. Generate authentication headers
4. Call Mochi Pay API with action
5. Update message based on response
6. Handle race conditions and errors

**Success Indicators**:
- Button interaction acknowledged immediately
- Message updated with new status
- Appropriate notifications sent
- Error messages displayed for failures

#### 3. Notification Handling
**Trigger**: Webhook or real-time notification received
**Process**:
1. Parse notification payload
2. Determine target Discord users/channels
3. Format message based on notification type
4. Send Discord messages with interactive components
5. Handle delivery failures with retries

## Error Scenarios and Resolution

### Command Execution Errors

#### Autocomplete Timeout
```
Symptoms: Empty autocomplete responses, slow suggestions
Resolution:
1. Check Mochi Pay API response times
2. Verify network connectivity to backend
3. Review timeout configuration (2.5s default)
4. Check Discord API rate limits
```

#### Authentication Failures
```
Symptoms: 401/403 errors in command responses
Resolution:
1. Verify MOCHI_APP_PRIVATE_KEY environment variable
2. Check Ed25519 signature generation
3. Validate user profile exists and is linked
4. Confirm application permissions
```

#### Command Validation Errors
```
Symptoms: Validation error messages in Discord
Resolution:
1. Check user profile linking status
2. Verify application/vault permissions
3. Validate token availability and balances
4. Confirm recipient has valid profile
```

### Button Interaction Errors

#### "Interaction Failed" Errors
```
Symptoms: Discord shows "This interaction failed" message
Resolution:
1. Check bot uptime and connectivity
2. Verify button custom ID format
3. Review API authentication
4. Check for expired interactions (15-minute limit)
```

#### Settled Request Handling
```
Symptoms: Incorrect status shown for already-processed requests
Resolution:
1. Verify API endpoint for request status retrieval
2. Check authentication headers in status requests
3. Review error handling logic for 400 responses
4. Ensure proper status mapping from API response
```

### Notification Delivery Issues

#### Missing Notifications
```
Symptoms: Transfer requests created but no Discord notifications
Resolution:
1. Check webhook endpoint configuration
2. Verify Discord bot permissions in target channels
3. Review notification routing logic
4. Check for user privacy settings blocking DMs
```

#### Delayed Notifications
```
Symptoms: Notifications arrive significantly after events
Resolution:
1. Check message queue processing rates
2. Verify Discord API rate limit handling
3. Review notification worker scaling
4. Check for network connectivity issues
```

## Monitoring and Alerting

### Key Metrics

#### Performance Metrics
- **Command Response Time**: < 3 seconds (95th percentile)
- **Button Interaction Time**: < 1 second (95th percentile)
- **Autocomplete Response Time**: < 2.5 seconds (timeout)
- **Notification Delivery Time**: < 10 seconds (95th percentile)

#### Error Rate Metrics
- **Command Error Rate**: < 5% of total executions
- **Button Interaction Error Rate**: < 2% of interactions
- **Notification Delivery Failure Rate**: < 1% of messages
- **Authentication Failure Rate**: < 1% of API calls

#### Usage Metrics
- **Daily Active Users**: Users executing commands per day
- **Command Usage Distribution**: Most/least used commands
- **Server Activity**: Commands per Discord server
- **Transfer Volume**: Token amounts transferred via Discord

### Health Checks

#### Bot Status Monitoring
```bash
# Check bot process status
pm2 status mochi-discord

# Monitor memory and CPU usage
pm2 monit mochi-discord

# Check Discord API connectivity
curl -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
     "https://discord.com/api/v10/applications/@me"

# Verify database connectivity
node -e "require('./src/db/connection').testConnection()"
```

#### Performance Monitoring
```bash
# Command response time analysis
grep "command_duration" /var/log/mochi-discord/app.log | \
awk '{sum+=$NF; count++} END {print "Average:", sum/count "ms"}'

# Error rate calculation
total_commands=$(grep "command_executed" /var/log/mochi-discord/app.log | wc -l)
error_commands=$(grep "command_error" /var/log/mochi-discord/app.log | wc -l)
echo "Error rate: $(echo "scale=2; $error_commands * 100 / $total_commands" | bc)%"
```

### Discord-Specific Monitoring

#### Rate Limit Monitoring
```javascript
// Monitor Discord API rate limits
client.on('rateLimit', (info) => {
  console.warn('Rate limit hit:', {
    timeout: info.timeout,
    limit: info.limit,
    method: info.method,
    path: info.path,
    route: info.route
  })
})
```

#### Guild Status Monitoring
```javascript
// Monitor bot presence in guilds
const guildCount = client.guilds.cache.size
const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
console.log(`Bot active in ${guildCount} guilds with ${memberCount} total members`)
```

## Security Considerations

### Bot Token Security
- **Environment Variables**: Store bot token in secure environment variables
- **Token Rotation**: Regular rotation of Discord bot tokens
- **Permission Scoping**: Minimal required Discord permissions
- **Audit Logging**: Log all bot actions and API calls

### User Data Protection
- **Profile Linking**: Secure association between Discord and Mochi profiles
- **Data Minimization**: Only store necessary user information
- **Privacy Controls**: Respect user privacy settings and preferences
- **GDPR Compliance**: Handle data deletion and export requests

### API Security
- **Authentication**: Secure Ed25519 signature authentication
- **Rate Limiting**: Implement client-side rate limiting
- **Input Validation**: Comprehensive validation of all user inputs
- **Error Handling**: Secure error messages without sensitive information

## Deployment and Maintenance

### Deployment Process
1. **Environment Setup**: Configure all required environment variables
2. **Dependencies**: Install and update Node.js dependencies
3. **Command Registration**: Register/update Discord slash commands
4. **Health Verification**: Confirm bot connectivity and functionality
5. **Monitoring Setup**: Configure logging and alerting

### Configuration Management
```bash
# Required environment variables
DISCORD_BOT_TOKEN=your_bot_token
MOCHI_APP_PRIVATE_KEY=your_app_private_key
MOCHI_PAY_API_BASE_URL=https://api.mochi.gg
DATABASE_URL=postgresql://...

# Optional configuration
COMMAND_TIMEOUT=2500
MAX_RETRIES=3
LOG_LEVEL=info
```

### Maintenance Tasks
- **Log Rotation**: Regular cleanup of application logs
- **Dependency Updates**: Keep Node.js packages updated
- **Command Sync**: Periodic synchronization of Discord commands
- **Performance Review**: Regular analysis of response times and errors

## Troubleshooting Commands

### Bot Diagnostics
```bash
# Check bot connectivity
node -e "
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log('Bot login successful'))
  .catch(err => console.error('Bot login failed:', err));
"

# Test API connectivity
curl -H "X-Message: $(date +%s)" \
     -H "X-Signature: test_signature" \
     -H "X-Application: Mochi" \
     "${MOCHI_PAY_API_BASE_URL}/health"

# Check command registration
node scripts/list-commands.js
```

### Performance Analysis
```bash
# Analyze command usage patterns
grep "command_executed" /var/log/mochi-discord/app.log | \
cut -d' ' -f5 | sort | uniq -c | sort -nr

# Monitor interaction success rates
grep "interaction_" /var/log/mochi-discord/app.log | \
grep -E "(success|failure)" | \
awk '{print $NF}' | sort | uniq -c

# Check memory usage trends
ps aux | grep "node.*mochi-discord" | \
awk '{print $6}' | numfmt --from-unit=1024 --to=iec
```

This runbook provides comprehensive operational guidance for the Mochi Discord Bot service, covering command processing, error handling, monitoring, and maintenance procedures specific to Discord integration.