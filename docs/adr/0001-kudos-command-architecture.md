# ADR: Kudos Command Architecture and Implementation

## Status
Accepted

## Context

We needed to implement a user-friendly system for requesting token transfers from application vaults as a form of recognition (kudos). This system spans three services: mochi-discord (user interface), mochi-pay-api (business logic and data), and mochi-notification (messaging and approvals).

The system requires:
- Intuitive Discord slash command interface
- Secure vault transfer request workflow
- Proper approval mechanisms with race condition protection
- Real-time notifications and interactive approvals
- Comprehensive error handling and user feedback

## Decision

We decided to implement the kudos system with the following architectural choices:

### 1. Discord Command Structure

**Decision**: Implement `/kudos` as a top-level command rather than a subcommand structure.

**Rationale**:
- Simpler user experience - users type `/kudos` directly
- Reflects the purpose as a recognition/reward system
- Avoids nested command complexity
- Easier to discover and remember

**Implementation**:
```typescript
// Direct command structure
/kudos application:... vault:... token:... amount:... recipient:... reason:...

// Rather than subcommand structure  
/app transfer application:... vault:... token:... amount:... recipient:... reason:...
```

### 2. Autocomplete with Timeout Protection

**Decision**: Implement aggressive timeout protection (2.5 seconds) for all autocomplete operations.

**Rationale**:
- Discord has a hard 3-second timeout for autocomplete responses
- API calls to fetch vault data can be slow
- Better user experience with graceful fallbacks than "Unknown interaction" errors
- 500ms buffer provides safety margin for network latency

**Implementation**:
```typescript
const timeoutMs = 2500
const timeoutPromise = new Promise<void>((resolve) => {
  setTimeout(() => resolve(), timeoutMs)
})

const result = await Promise.race([apiPromise, timeoutPromise])
if (!result) {
  await i.respond([]).catch(() => {}) // Handle expired interaction
  return
}
```

### 3. Database Race Condition Protection

**Decision**: Use `SELECT FOR UPDATE` row-level locking for transfer request approvals.

**Rationale**:
- Prevents multiple concurrent approvals of the same request
- Ensures atomic status checks and updates
- Maintains data consistency under high concurrency
- Clear error messages for already processed requests

**Implementation**:
```go
// Acquire exclusive lock on the transfer request
req, err := db.ApplicationTransferRequest.GetOneForUpdate(query)
if err == gorm.ErrRecordNotFound {
  return apierror.New("request not found or already processed", 400, apierror.Code400)
}

// Process within locked transaction
// ... business logic ...

err = fn.Commit() // Release lock
```

### 4. Notification Architecture

**Decision**: Reuse existing notification infrastructure with vault-specific metadata.

**Rationale**:
- Leverages proven notification delivery mechanisms
- Consistent user experience with other transfer types
- Minimal additional infrastructure required
- Easy to extend for future notification types

**Implementation**:
```go
notificationMsg := message.KafkaNotifyMessage{
  Type: typeset.NOTIFICATION_PAY_TRANSFER_REQUEST,
  PayTransferRequestMetadata: &message.PayTransferRequestMetadata{
    UserProfileId:     req.TargetUserProfileId,
    SenderProfileType: string(pftypeset.PROFILE_TYPE_APPLICATION_VAULT),
    // ... vault-specific metadata
  },
}
```

### 5. API Design Patterns

**Decision**: Follow RESTful conventions with nested resource paths.

**Rationale**:
- Clear resource hierarchy: profiles → applications → vaults → transfer-requests
- Intuitive URL structure for developers
- Consistent with existing API patterns
- Easy to understand permissions model

**Implementation**:
```
POST /profiles/{profile_id}/applications/{app_id}/vaults/{vault_id}/transfer-requests (NEW)
POST /profiles/{profile_id}/applications/{app_id}/requests/{request_code}/approved
POST /profiles/{profile_id}/applications/{app_id}/requests/{request_code}/rejected
```

### 6. Error Handling Strategy

**Decision**: Implement comprehensive error handling with user-friendly messages.

**Rationale**:
- Better user experience with clear guidance
- Reduces support burden
- Helps users self-resolve common issues
- Maintains system security without exposing internals

**Implementation**:
```typescript
// User-friendly error messages
"You cannot send kudos to yourself"
"You can send at most 100.5 USDC as kudos"
"Ask the recipient to create a profile first"
```

### 7. Data Consistency Model

**Decision**: Use database transactions with explicit rollback handling.

**Rationale**:
- Ensures data consistency across related operations
- Prevents partial state corruption
- Clear error recovery mechanisms
- Audit trail preservation

**Implementation**:
```go
tx, fn := a.params.DB().Store.NewTx()

// Multiple related operations
err = tx.ApplicationTransferRequest.Create(transferReq)
err = a.sendVaultTransferRequestNotification(transferReq, tokenInfo, vault)
err = a.runAppWebhooks(transferReq, model.ApplicationWebhookEventCreateRequest, 0)

if err != nil {
  fn.Rollback(err)
  return apierror.New("operation failed", 500, apierror.Code500)
}

err = fn.Commit()
```

## Consequences

### Positive
- **User Experience**: Simple, intuitive command structure with clear feedback
- **Reliability**: Race condition protection ensures data consistency
- **Performance**: Timeout protection prevents user-facing failures
- **Maintainability**: Clean separation of concerns across services
- **Security**: Proper validation and authorization at all levels
- **Scalability**: Leverages existing infrastructure patterns

### Negative
- **Complexity**: Multiple services require coordinated deployments
- **Latency**: Network calls between services add response time
- **Dependencies**: Failure in one service affects the entire workflow
- **Testing**: End-to-end testing requires all three services

### Risks and Mitigations

**Risk**: API timeout causing user confusion
**Mitigation**: Aggressive timeout protection with graceful fallbacks

**Risk**: Race conditions in approval process
**Mitigation**: Database locking with proper transaction management

**Risk**: Notification delivery failures
**Mitigation**: Retry mechanisms and fallback notification channels

**Risk**: Service dependency failures
**Mitigation**: Circuit breakers and graceful degradation

## Alternatives Considered

### 1. Monolithic Implementation
**Rejected**: Would require significant refactoring of existing service boundaries and lose benefits of microservice architecture.

### 2. Synchronous API Calls
**Rejected**: Would increase latency and create tighter coupling between services.

### 3. Eventually Consistent Model
**Rejected**: Transfer requests require strong consistency for financial operations.

### 4. Polling-Based Notifications
**Rejected**: Real-time notifications provide better user experience and reduce system load.

## Implementation Notes

### Development Sequence
1. Implement core API endpoints in mochi-pay-api
2. Add notification handlers in mochi-notification
3. Implement Discord command in mochi-discord
4. Add comprehensive testing across all services
5. Deploy with feature flags for controlled rollout

### Testing Strategy
- Unit tests for individual service components
- Integration tests for cross-service communication
- End-to-end tests for complete user workflows
- Load testing for concurrent approval scenarios

### Monitoring Requirements
- API response time and error rate monitoring
- Discord command usage and success rate tracking
- Notification delivery success monitoring
- Database lock contention monitoring

## References
- [Kudos Vault Transfer System Specification](../specs/0001-kudos-vault-transfer-system.md)
- [Discord API Documentation](https://discord.com/developers/docs)
- [Application Vault Architecture](existing-vault-docs)
- [Notification System Architecture](existing-notification-docs)