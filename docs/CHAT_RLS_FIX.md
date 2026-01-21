# Chat RLS Policy Fix

**Date**: January 21, 2026  
**Status**: ✅ Complete and Deployed  
**Priority**: Critical (P0)

## Problem Summary

Users were unable to send chat messages, receiving a `403 Forbidden` error with the message:

```
ERROR: new row violates row-level security policy for table "chat_messages"
Code: 42501 (insufficient_privilege)
```

## Root Cause

The inbox filtering migration (`20260121010000_inbox_filtering.sql`) updated the `chat_threads` RLS policies to check `participant_a`/`participant_b` directly for better performance and simplicity. However, the `chat_messages` RLS policies were not updated and still checked the `chat_members` table, creating an inconsistency.

### Timeline
1. Original migration (`20260120210000_chat_threads.sql`) created RLS policies that checked `chat_members` for both `chat_threads` and `chat_messages`
2. Inbox filtering migration updated `chat_threads` policies to check `participant_a`/`participant_b` directly
3. `chat_messages` policies were not updated, causing a mismatch
4. Users could create threads but couldn't send messages

## Solution

Created migration `20260121030000_fix_chat_messages_rls.sql` to update the `chat_messages` RLS policies to match the simplified approach:

### Old Policy (Checking chat_members)
```sql
CREATE POLICY "chat_messages_insert_member"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.thread_id = chat_messages.thread_id
        AND chat_members.user_id = auth.uid()
    )
  );
```

### New Policy (Checking participant_a/b)
```sql
CREATE POLICY "chat_messages_insert_participant"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
        AND (chat_threads.participant_a = auth.uid() 
             OR chat_threads.participant_b = auth.uid())
    )
  );
```

## Benefits

1. **Consistency**: All RLS policies now use the same authorization logic
2. **Performance**: Direct check on `chat_threads` is more efficient than joining through `chat_members`
3. **Simplicity**: Clearer authorization model with fewer table dependencies
4. **Maintainability**: Single source of truth for participant validation

## Migration Details

### Files Created
- `supabase/migrations/20260121030000_fix_chat_messages_rls.sql`

### Policies Updated
- **Dropped**: `chat_messages_select_member`, `chat_messages_insert_member`
- **Created**: `chat_messages_select_participant`, `chat_messages_insert_participant`

### Additional Fix
Also fixed a syntax error in `20260121000001_schedule_message_cleanup.sql` where nested dollar quotes caused a PostgreSQL parsing error. Changed `$$..$$` to `$CRON$..$CRON$` for the inner string delimiter.

## Deployment

### Dev Environment
```bash
npm run db:push:dev
```
**Status**: ✅ Deployed successfully

### Production Environment
```bash
npm run db:push:prod
```
**Status**: ✅ Deployed successfully

All migrations applied to both environments:
1. ✅ `20260121000001_schedule_message_cleanup.sql` (with syntax fix)
2. ✅ `20260121010000_inbox_filtering.sql`
3. ✅ `20260121020000_atomic_array_operations.sql`
4. ✅ `20260121030000_fix_chat_messages_rls.sql`

## Testing

### Manual Testing Steps
1. Open chat screen with an existing thread
2. Send a message
3. Verify message is sent successfully without 403 error
4. Check message appears in the UI
5. Verify recipient can see the message

### Expected Behavior
- ✅ Messages send without RLS errors
- ✅ Both participants can send and receive messages
- ✅ RLS still properly enforces that only participants can access messages
- ✅ Non-participants cannot view or send messages in threads they're not part of

## Impact

- **User-Facing**: Critical bug fix - restores ability to send messages
- **Database**: Updated RLS policies, no data migration required
- **Performance**: Slight improvement due to more efficient authorization check
- **Security**: Maintains same security model, just implemented more efficiently

## Related Documentation

- [Inbox Filtering Implementation](./INBOX_FILTERING_IMPLEMENTATION.md)
- [Chat Threads Migration](../supabase/migrations/20260120210000_chat_threads.sql)
- [Inbox Filtering Migration](../supabase/migrations/20260121010000_inbox_filtering.sql)
- [RLS Fix Migration](../supabase/migrations/20260121030000_fix_chat_messages_rls.sql)

## Notes

- The `chat_members` table is still used for tracking `last_read_at` timestamps
- The authorization logic no longer depends on `chat_members` records existing
- This fix aligns all chat RLS policies with the inbox filtering approach
- Both dev and production databases have been updated and are functioning correctly
