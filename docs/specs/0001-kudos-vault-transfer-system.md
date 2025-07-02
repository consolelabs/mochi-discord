# Kudos Vault Transfer System

## Overview

The Kudos Vault Transfer System enables users to request token transfers from application vaults as a form of recognition or reward. This system spans three core services and provides a streamlined workflow for vault-based token distribution with proper approval mechanisms.

## Business Context

### Problem Statement
Organizations need a way to distribute tokens from application vaults to recognize contributions, achievements, or provide rewards. The current system lacks a user-friendly interface for requesting vault transfers with proper approval workflows.

### Solution
Implement a `/kudos` command that allows users to request token transfers from authorized application vaults, with automatic notification and approval workflows for vault owners.

### Success Metrics
- User adoption rate of the `/kudos` command
- Successful transfer completion rate
- Average time from request to approval
- User satisfaction with the kudos process

## System Architecture

### Service Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  mochi-discord  │    │  mochi-pay-api  │    │mochi-notification│
│                 │    │                 │    │                 │
│ /kudos command  │───▶│ Vault Transfer  │───▶│   Notification  │
│ User Interface  │    │ Request API     │    │   & Webhooks    │
│ Autocomplete    │    │ Approval API    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. User initiates `/kudos` command in Discord
2. Discord service validates inputs and creates transfer request via API
3. Pay API creates pending transfer request and triggers notifications
4. Notification service sends approval request to app owner
5. App owner approves/rejects via Discord interface
6. Pay API processes approval and executes transfer
7. Notification service confirms completion to all parties

## Feature Specifications

### 1. Discord Command Interface (mochi-discord)

#### Command Structure
```
/kudos
  application: [Required] Select application (autocomplete)
  vault: [Required] Select vault (autocomplete)  
  token: [Required] Select token (autocomplete)
  amount: [Required] Enter amount to transfer
  recipient: [Required] Select Discord user
  reason: [Optional] Reason for the kudos
```

#### Autocomplete Behavior
- **Application**: Lists applications user has access to
- **Vault**: Lists vaults for selected application
- **Token**: Lists tokens with available balance in selected vault
- **Timeout Protection**: 2.5-second timeout with graceful fallback

#### Validation Rules
- User cannot send kudos to themselves
- Amount must be positive number
- Amount cannot exceed available vault balance
- Recipient must have a registered profile
- All required fields must be provided

#### Success Response
```
✅ Kudos Request Created

💎 Amount:        🎯 **10.5 USDC** (≈ $10.50)
🪙 Token:         USDC
🔄 Kudos to:      @recipient
🔄 From vault:    Community Vault (DAO App)
⚙️ Reason:        Great contribution to the project

⏰ The application owner will be notified to approve or reject this kudos request.
```

#### Error Handling
- Invalid recipient: "You cannot send kudos to yourself"
- Insufficient balance: "You can send at most X tokens as kudos"
- Profile not found: Clear guidance to create profile
- System errors: Graceful fallback with support contact

### 2. Vault Transfer API (mochi-pay-api)

#### Core Endpoints

##### Create Vault Transfer Request
```http
POST /profiles/{profile_id}/applications/{app_id}/vaults/{vault_id}/transfer-requests

Headers:
  Authorization: Bearer {token}

Body:
{
  "recipient_profile_id": "string",
  "token_id": "string", 
  "token_amount": "string", // Wei format
  "description": "string",
  "requester_metadata": {
    "platform": "discord"
  }
}

Response: 200 OK
{
  "message": "Transfer request created successfully"
}
```

##### Approve Transfer Request
```http
POST /profiles/{profile_id}/applications/{app_id}/requests/{request_code}/approved

Headers:
  X-Application: Mochi
  X-Message: {timestamp}
  X-Signature: {signature}

Response: 200 OK
{
  "message": "approved"
}
```

##### Reject Transfer Request  
```http
POST /profiles/{profile_id}/applications/{app_id}/requests/{request_code}/rejected

Headers:
  X-Application: Mochi
  X-Message: {timestamp} 
  X-Signature: {signature}

Response: 200 OK
{
  "message": "rejected"
}
```

#### Data Models

##### ApplicationTransferRequest
```go
type ApplicationTransferRequest struct {
    Id                  int64     `json:"id"`
    ApplicationId       int       `json:"application_id"`
    UserProfileId       string    `json:"user_profile_id"`       // Vault profile ID
    TargetUserProfileId string    `json:"target_user_profile_id"` // Recipient profile ID
    TokenId             string    `json:"token_id"`
    TokenAmount         string    `json:"token_amount"`
    Status              string    `json:"status"` // pending, approved, rejected, expired
    Code                string    `json:"code"`   // Unique request identifier
    Description         string    `json:"description"`
    ExpiredAt           *time.Time `json:"expired_at"`
    CreatedAt           time.Time `json:"created_at"`
    UpdatedAt           time.Time `json:"updated_at"`
}
```

#### Business Logic

##### Request Creation Flow
1. Validate application exists and user has access
2. Validate vault exists and belongs to application
3. Validate token exists and has sufficient balance
4. Generate unique request code
5. Create pending transfer request record
6. Send notification to app owner
7. Trigger application webhooks
8. Return success response

##### Approval Flow
1. Acquire database lock on transfer request (SELECT FOR UPDATE)
2. Validate request exists and is in pending status
3. Check request hasn't expired
4. Update status to approved
5. Execute actual token transfer
6. Send completion notifications
7. Trigger completion webhooks
8. Release database lock

##### Race Condition Protection
- Database row-level locking prevents concurrent approvals
- Atomic status checks within locked transactions
- Clear error messages for already processed requests
- Proper transaction rollback on failures

### 3. Notification System (mochi-notification)

#### Notification Types

##### Transfer Request Notification
Sent to app owner when new kudos request is created:
```json
{
  "type": "NOTIFICATION_PAY_TRANSFER_REQUEST",
  "pay_transfer_request_metadata": {
    "user_profile_id": "recipient_profile_id",
    "sender_profile_type": "APPLICATION_VAULT", 
    "token_symbol": "USDC",
    "token_amount": "10500000", // Wei format
    "token_decimal": 6,
    "token_amount_in_usd": "$10.50",
    "request_code": "ABC123",
    "app_name": "DAO App",
    "app_id": 123,
    "chain_name": "Ethereum",
    "vault_name": "Community Vault",
    "vault_profile_id": "vault_profile_id",
    "app_owner_profile_id": "owner_profile_id"
  }
}
```

##### Transfer Completion Notification
Sent to recipient and app owner when transfer is completed:
```json
{
  "type": "NOTIFICATION_PAY_TRANSFER_REQUEST",
  "pay_transfer_request_metadata": {
    "user_profile_id": "recipient_profile_id",
    "sender_profile_type": "APPLICATION_VAULT",
    "token_symbol": "USDC", 
    "token_amount": "10.5",
    "token_decimal": 6,
    "token_amount_in_usd": "$10.50",
    "request_code": "ABC123",
    "app_name": "DAO App",
    "app_id": 123,
    "chain_name": "Ethereum",
    "vault_name": "Community Vault",
    "vault_profile_id": "vault_profile_id",
    "app_owner_profile_id": "owner_profile_id"
  }
}
```

#### Discord Integration

##### Approval Interface
App owners receive interactive Discord messages with approve/reject buttons:
```
🔔 Vault Transfer Request

💎 Amount:        🎯 **10.5 USDC** (≈ $10.50)
🪙 Token:         USDC
👤 Kudos to:      @recipient
📝 Reason:        Great contribution to the project
🏦 From vault:    Community Vault
⚙️ Request ID:    ABC123

[Approve] [Reject]
```

##### Button Handlers
- `approve-{requestCode}-{appId}`: Approves the transfer request
- `reject-{requestCode}-{appId}`: Rejects the transfer request
- Buttons update message to show final status
- Error handling for expired or already processed requests

## Security Considerations

### Authentication & Authorization
- All API calls require proper authentication
- Vault access validated per application permissions
- Request codes are cryptographically secure
- Signature verification for sensitive operations

### Input Validation
- Amount validation prevents overflow attacks
- Profile ID validation prevents unauthorized access
- Token ID validation ensures legitimate tokens only
- SQL injection prevention via parameterized queries

### Rate Limiting & Abuse Prevention
- Discord command rate limiting
- API endpoint rate limiting
- Vault balance checks prevent overdrafts
- Request expiration prevents stale approvals

### Data Protection
- Sensitive data encrypted in transit and at rest
- Request codes are single-use and time-limited
- Personal information handled per privacy policies
- Audit logging for all transfer operations

## Error Handling & Edge Cases

### Common Error Scenarios
1. **Insufficient Vault Balance**: Clear message with available amount
2. **Invalid Recipient**: Profile validation with helpful guidance
3. **Expired Requests**: Automatic cleanup and clear error messages
4. **Network Timeouts**: Graceful degradation with retry mechanisms
5. **Concurrent Approvals**: Database locking prevents race conditions

### Monitoring & Alerting
- Success/failure rate monitoring
- Response time tracking
- Error rate alerting
- Vault balance monitoring
- Request approval time tracking

## Performance Requirements

### Response Times
- Discord command response: < 3 seconds
- API endpoints: < 1 second
- Notification delivery: < 5 seconds
- Autocomplete responses: < 2.5 seconds

### Scalability
- Support for 1000+ concurrent users
- Handle 10,000+ requests per day
- Auto-scaling for peak usage
- Database optimization for large datasets

### Availability
- 99.9% uptime target
- Graceful degradation during outages
- Automatic failover mechanisms
- Health check endpoints

## Testing Strategy

### Unit Testing
- Individual function validation
- Mock external dependencies
- Edge case coverage
- Error condition testing

### Integration Testing
- End-to-end workflow testing
- Cross-service communication
- Database transaction testing
- External API integration

### User Acceptance Testing
- Discord command usability
- Approval workflow testing
- Error message clarity
- Performance under load

## Deployment & Rollout

### Phased Rollout
1. **Phase 1**: Internal testing with limited vaults
2. **Phase 2**: Beta testing with select communities
3. **Phase 3**: Full production rollout
4. **Phase 4**: Feature optimization based on usage

### Monitoring & Metrics
- Command usage statistics
- Transfer success rates
- User feedback collection
- Performance monitoring
- Error tracking and resolution

### Rollback Plan
- Feature flags for quick disable
- Database migration rollback scripts
- Service version rollback procedures
- Communication plan for users

## Future Enhancements

### Planned Features
- Bulk kudos transfers
- Scheduled kudos distributions
- Kudos templates and presets
- Analytics dashboard for vault owners
- Mobile app integration

### API Extensions
- GraphQL API for advanced queries
- Webhook customization options
- Advanced filtering and search
- Audit trail API endpoints

### User Experience Improvements
- Rich embed customization
- Reaction-based approvals
- Kudos leaderboards
- Achievement badges

## Conclusion

The Kudos Vault Transfer System provides a comprehensive solution for token-based recognition within Discord communities. By spanning three core services with robust security, monitoring, and user experience considerations, this system enables seamless vault-to-user transfers while maintaining proper approval workflows and audit trails.

The system is designed for scalability, reliability, and ease of use, ensuring that organizations can effectively distribute rewards and recognition tokens through their existing Discord workflows.