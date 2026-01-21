# Chat Message 14-Day Retention Implementation

## Overview
This document summarizes the implementation of the 14-day chat message retention policy for the Finn application.

## Business Rule
**Messages in direct message threads will automatically be deleted after 14 days from their creation date.**

## Implementation Summary

### 1. User Interface (ChatScreen)
**File**: `src/presentation/screens/ChatScreen.tsx`

**Changes**:
- Updated empty state UI to display:
  - Forum icon in a circular blue container (96x96)
  - Title: "Start a conversation"
  - Dynamic body text mentioning the peer's name
  - Disclaimer: "Messages will disappear after 14 days"
- Added styles for empty state components
- Improved character counter visibility (100 character limit)
- Enhanced send button with proper state management

### 2. Internationalization
**Files**: 
- `src/presentation/i18n/strings.ts`
- `src/presentation/content/chatCopy.ts`

**Changes**:
- Added new i18n strings:
  - `chat.emptyState.title`
  - `chat.emptyState.body`
  - `chat.emptyState.disclaimer`
- Updated chatCopy to expose these strings with dynamic name replacement

### 3. Database Layer
**File**: `supabase/migrations/20260121000000_chat_message_retention.sql`

**Changes**:
- Created `delete_old_chat_messages()` function that:
  - Deletes messages older than 14 days
  - Updates thread previews for affected threads
  - Returns count of deleted messages
- Added index on `created_at` for query optimization
- Includes setup instructions for pg_cron scheduling

### 4. Edge Function
**File**: `supabase/functions/cleanup-old-messages/index.ts`

**Changes**:
- Created scheduled Edge Function to invoke the cleanup
- Supports Bearer token authentication for security
- Returns deleted count and timestamp
- Includes comprehensive error handling and logging

**Documentation**: `supabase/functions/cleanup-old-messages/README.md`
- Setup instructions for deployment
- Multiple scheduling options (pg_cron, GitHub Actions, external services)
- Testing and monitoring guidelines

### 5. Data Repository
**File**: `src/data/repositories/SupabaseChatRepository.ts`

**Changes**:
- Updated `getMessages()` method to filter messages:
  - Calculates cutoff date (14 days ago)
  - Adds `gte('created_at', cutoffISO)` filter
  - Ensures client-side compliance with retention policy

### 6. Documentation
**Files**:
- `docs/specs/social/inbox.md`
- `docs/specs/architecture/ui-guidelines.md`

**Changes**:
- Added functional requirements (FR-INBX-09, FR-INBX-10)
- Documented data retention policy section
- Updated UI guidelines with empty state specifications
- Detailed implementation approach and user communication strategy

## Deployment Checklist

### Prerequisites
1. Ensure Supabase project is set up
2. Verify database access and permissions

### Step-by-Step Deployment

1. **Run Database Migration**
   ```bash
   supabase db push
   ```

2. **Deploy Edge Function**
   ```bash
   supabase functions deploy cleanup-old-messages
   ```

3. **Set Cron Secret (Optional but Recommended)**
   ```bash
   supabase secrets set CRON_SECRET=$(openssl rand -base64 32)
   ```

4. **Schedule the Cleanup Job**
   
   Choose one method:
   
   **Option A: Using pg_cron (Recommended)**
   ```sql
   SELECT cron.schedule(
     'cleanup-old-chat-messages',
     '0 2 * * *',  -- Daily at 2 AM UTC
     $$SELECT public.delete_old_chat_messages();$$
   );
   ```
   
   **Option B: External Scheduler**
   - Set up GitHub Actions workflow
   - Configure with CRON_SECRET in repository secrets
   - See `supabase/functions/cleanup-old-messages/README.md` for examples

5. **Test the Implementation**
   ```bash
   # Test edge function
   curl -X POST \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-old-messages
   ```

6. **Monitor Function Logs**
   ```bash
   supabase functions logs cleanup-old-messages --tail
   ```

## Key Features

### User-Facing
- ✅ Clear disclaimer about message retention
- ✅ Professional empty state design
- ✅ Improved message input with character counter
- ✅ Enhanced error handling and retry mechanism

### Backend
- ✅ Automatic deletion of messages > 14 days old
- ✅ Thread preview updates after deletion
- ✅ Optimized queries with proper indexing
- ✅ Client-side filtering for double protection
- ✅ Scheduled cleanup via Edge Function

### Documentation
- ✅ Updated specifications with retention policy
- ✅ Comprehensive deployment guide
- ✅ Setup instructions for scheduled jobs
- ✅ UI guidelines with empty state specs

## Testing Recommendations

1. **UI Testing**
   - Verify empty state displays correctly
   - Test character counter updates
   - Confirm disclaimer text is visible

2. **Functional Testing**
   - Send messages and verify they appear
   - Wait 14+ days and verify automatic deletion (or manually adjust dates in DB)
   - Check thread previews update correctly

3. **Edge Function Testing**
   - Manually trigger cleanup function
   - Verify deleted count in response
   - Check logs for any errors

4. **Repository Testing**
   - Confirm `getMessages()` filters old messages
   - Test with messages on both sides of 14-day boundary

## Future Enhancements

- Add user preference for retention period
- Implement message export before deletion
- Add admin dashboard for retention monitoring
- Consider archival strategy for compliance requirements

## Support

For issues or questions:
1. Check Edge Function logs
2. Review database migration status
3. Verify scheduled job configuration
4. Consult `docs/specs/social/inbox.md` for specifications
