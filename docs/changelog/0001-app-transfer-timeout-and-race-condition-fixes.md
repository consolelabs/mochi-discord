# App Transfer Command Fixes

## Discord Autocomplete Timeout Protection

**Problem**: Discord autocomplete interactions have a 3-second timeout. When API calls to fetch vault balances take longer than this, the interaction expires, causing "Unknown interaction" errors.

**Solution**: Implemented timeout protection in the `/kudos` command autocomplete:
- Added 2.5-second timeout with 500ms buffer before Discord's 3s limit
- Used `Promise.race()` to race API calls against timeout
- Added `.catch(() => {})` to all response calls to handle expired interactions gracefully
- Return empty arrays when timeout occurs instead of crashing

**Files Changed**:
- `mochi-discord/src/commands/kudos/slash.ts`

**Benefits**:
- No more "Unknown interaction" errors when API is slow
- Better user experience with graceful fallbacks
- Improved error handling and logging

## Race Condition Protection in Transfer Request APIs

**Problem**: The `/approved` and `/rejected` APIs had potential race conditions where multiple concurrent approvals could process the same transfer request due to lack of database locking.

**Solution**: Added proper database locking using `SELECT FOR UPDATE`:
- Modified `ApproveRequest()` and `RejectRequest()` methods to use `GetOneForUpdate()`
- Added exclusive row-level locking before processing requests
- Moved database transaction start to beginning of functions
- Added better error messages for already processed requests
- Integrated expiration check within the locked transaction

**Files Changed**:
- `mochi-pay-api/internal/controller/application/transfer_request.go`

**Race Condition Prevention**:
1. **Database Lock**: Uses `SELECT FOR UPDATE` to lock the specific transfer request record
2. **Atomic Operations**: All checks and updates happen within a single transaction
3. **Early Validation**: Status and expiration checks happen immediately after acquiring lock
4. **Clear Error Messages**: Distinguishes between "not found" and "already processed" cases

**Benefits**:
- Prevents duplicate processing of transfer requests
- Ensures data consistency under concurrent load
- Better error handling for edge cases
- Maintains transaction integrity

## Technical Implementation Details

### Autocomplete Timeout Pattern
```typescript
const timeoutMs = 2500 // Leave 500ms buffer
const timeoutPromise = new Promise<void>((resolve) => {
  setTimeout(() => resolve(), timeoutMs)
})

const result = await Promise.race([apiPromise, timeoutPromise])
if (!result) {
  await i.respond([]).catch(() => {}) // Handle expired interaction
  return
}
```

### Database Locking Pattern
```go
// Start transaction first
db, fn := a.params.DB().Store.NewTx()

// Lock the record
req, err := db.ApplicationTransferRequest.GetOneForUpdate(query)
if err == gorm.ErrRecordNotFound {
  // Handle already processed case
}

// Process within locked transaction
// ... business logic ...

// Commit or rollback
err = fn.Commit()
```

## Testing Recommendations

1. **Autocomplete Timeout**: Test with slow network or API delays to verify graceful handling
2. **Race Conditions**: Simulate concurrent approval attempts to ensure only one succeeds
3. **Error Cases**: Verify proper error messages for expired/processed requests
4. **Performance**: Monitor for any performance impact from database locking