# Inbox Message Filtering Implementation Plan

## Executive Summary
This document outlines the implementation plan for adding message request filtering and conversation archiving to the Finn inbox system. The plan follows Clean Architecture principles and ensures all changes cascade properly through domain models, repositories, UI screens, and documentation.

---

## Current System Analysis

### Architecture Overview
- **Domain Models**: `ChatThread`, `ChatMessage` (src/domain/models/chat.ts)
- **Repository Interface**: `ChatRepository` (src/domain/repositories/ChatRepository.ts)
- **Implementation**: `SupabaseChatRepository` (src/data/repositories/SupabaseChatRepository.ts)
- **UI Screens**: 
  - `InboxScreen` (src/presentation/screens/InboxScreen.tsx) - List of conversations
  - `ChatScreen` (src/presentation/screens/ChatScreen.tsx) - Individual chat interface

### Current Database Schema
**chat_threads table:**
- `id` (UUID, primary key)
- `participant_a` (UUID, user_id)
- `participant_b` (UUID, user_id)
- `created_by` (UUID, user_id)
- `created_at` (timestamp)
- `last_message_at` (timestamp)
- `last_message_preview` (text)

**chat_members table:**
- `thread_id` (UUID)
- `user_id` (UUID)
- `last_read_at` (timestamp)

**chat_messages table:**
- `id` (bigserial)
- `thread_id` (UUID)
- `sender_id` (UUID)
- `content` (text)
- `created_at` (timestamp)

### Current Tab System
The InboxScreen currently has three tabs (`primary`, `requests`, `archived`) but they're UI-only prototypes without real data filtering:
- All tabs currently show the same mock data
- No logic to differentiate between primary chats, requests, or archived conversations
- No database-level distinction between these categories

---

## Requirements Analysis

### Primary Tab (Existing, needs refinement)
**Requirement**: Show any chats between user and other users that user follows or has accepted
**Current State**: ✅ Partially working (shows all threads but doesn't filter by follow status)
**Needed Changes**: Add filtering logic based on follow relationship

### Requests Tab (New Functionality)
**Requirement**: 
- List messages from users that sent a message to user, but user doesn't follow that person
- When user clicks on message and navigates to ChatScreen:
  - Show the message the other person is trying to send
  - Display two options: 'Accept' and 'Refuse'
  - Show a disclaimer about message requests
  
**Current State**: ❌ Not implemented
**Needed Changes**: Complete implementation from database to UI

### Archived Tab (New Functionality)
**Requirement**: List conversations that user archived
**Current State**: ❌ Not implemented
**Needed Changes**: Complete implementation from database to UI

---

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Add columns to `chat_threads` table
```sql
ALTER TABLE public.chat_threads 
  ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'accepted',
  ADD COLUMN IF NOT EXISTS archived_by UUID[] DEFAULT '{}';

-- Add check constraint for request_status
ALTER TABLE public.chat_threads
  ADD CONSTRAINT chat_threads_request_status_check 
  CHECK (request_status IN ('pending', 'accepted', 'refused'));

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_chat_threads_request_status 
  ON public.chat_threads(request_status);
```

**Fields Explanation:**
- `request_status`: 
  - `'pending'` - Initial message request (sender sent first message, recipient hasn't accepted)
  - `'accepted'` - Request accepted by recipient (or mutual follow exists)
  - `'refused'` - Request declined by recipient
  
- `archived_by`: 
  - Array of user IDs who archived this thread
  - Both participants can independently archive the same thread
  - Example: `{user_id_1}` or `{user_id_1, user_id_2}`

#### 1.2 Migration Logic
- Existing threads should default to `request_status = 'accepted'`
- Existing threads should default to `archived_by = '{}'` (empty array)
- Add trigger to auto-set `request_status = 'accepted'` when both participants follow each other

#### 1.3 Create Migration File
**File**: `supabase/migrations/YYYYMMDDHHMMSS_add_inbox_filtering.sql`

---

### Phase 2: Domain Model Updates

#### 2.1 Update `ChatThread` model
**File**: `src/domain/models/chat.ts`

```typescript
export type ChatThreadStatus = 'pending' | 'accepted' | 'refused';

export type ChatThread = {
  id: string;
  participantA: string;
  participantB: string;
  createdBy?: string;
  createdAt?: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  requestStatus: ChatThreadStatus;  // NEW
  archivedBy: string[];              // NEW
};
```

**Breaking Change**: Yes - adds required fields
**Migration Path**: Provide defaults in repository mapping layer

---

### Phase 3: Repository Interface Updates

#### 3.1 Update `ChatRepository` interface
**File**: `src/domain/repositories/ChatRepository.ts`

Add new methods:
```typescript
export interface ChatRepository {
  // Existing methods
  getOrCreateDirectThread(userId: string, peerId: string): Promise<ChatThread>;
  getMessages(threadId: string, limit?: number): Promise<ChatMessage[]>;
  sendMessage(threadId: string, senderId: string, content: string): Promise<ChatMessage>;
  markThreadRead(threadId: string, userId: string, readAt?: string): Promise<void>;
  
  // NEW methods
  getThreadsForUser(userId: string, filter: 'primary' | 'requests' | 'archived'): Promise<ChatThread[]>;
  acceptThreadRequest(threadId: string, userId: string): Promise<void>;
  refuseThreadRequest(threadId: string, userId: string): Promise<void>;
  archiveThread(threadId: string, userId: string): Promise<void>;
  unarchiveThread(threadId: string, userId: string): Promise<void>;
}
```

#### 3.2 Update `SupabaseChatRepository` implementation
**File**: `src/data/repositories/SupabaseChatRepository.ts`

**Key Implementation Details:**

1. **getThreadsForUser** method:
   - `primary` filter: Returns threads where:
     - `request_status = 'accepted'` AND
     - `userId` NOT IN `archived_by`
   
   - `requests` filter: Returns threads where:
     - `request_status = 'pending'` AND
     - `userId != created_by` (user is recipient, not sender) AND
     - `userId` NOT IN `archived_by`
   
   - `archived` filter: Returns threads where:
     - `userId` IN `archived_by`

2. **acceptThreadRequest** method:
   - Update `request_status = 'accepted'`
   - Only allowed if user is recipient (not created_by)
   
3. **refuseThreadRequest** method:
   - Update `request_status = 'refused'`
   - Only allowed if user is recipient

4. **archiveThread** method:
   - Append userId to `archived_by` array using Postgres array_append
   - `UPDATE chat_threads SET archived_by = array_append(archived_by, userId)`

5. **unarchiveThread** method:
   - Remove userId from `archived_by` array using Postgres array_remove
   - `UPDATE chat_threads SET archived_by = array_remove(archived_by, userId)`

**Request Status Logic:**
- When creating a new thread, check if participants follow each other:
  - If YES: Set `request_status = 'accepted'`
  - If NO: Set `request_status = 'pending'`
  - Query: `SELECT EXISTS (SELECT 1 FROM user_follows WHERE follower_id = X AND following_id = Y)`

#### 3.3 Update Mock Repository
**File**: `src/data/repositories/mock/MockChatRepository.ts`
- Implement same interface methods with in-memory filtering logic
- Useful for testing and mock mode (`EXPO_PUBLIC_APP_MODE=mock`)

---

### Phase 4: UI Changes - InboxScreen

#### 4.1 Update InboxScreen data fetching
**File**: `src/presentation/screens/InboxScreen.tsx`

**Current State:**
- Uses static mock data from `inboxCopy.messages`
- No real repository integration

**Changes Needed:**

1. **Add state for real threads:**
```typescript
const [threads, setThreads] = useState<ChatThread[]>([]);
const [loading, setLoading] = useState(true);
```

2. **Fetch threads based on active tab:**
```typescript
useEffect(() => {
  const fetchThreads = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const data = await chatRepository.getThreadsForUser(
        session.user.id, 
        activeTab // 'primary' | 'requests' | 'archived'
      );
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  };
  void fetchThreads();
}, [activeTab, session?.user?.id, chatRepository]);
```

3. **Update navigation to ChatScreen:**
```typescript
<Pressable 
  key={thread.id} 
  onPress={() => navigation.navigate('Chat', {
    userId: getPeerId(thread, session.user.id),
    user: null,
    threadId: thread.id,           // NEW - pass thread ID
    isRequest: activeTab === 'requests' // NEW - flag for request mode
  })}
  // ... rest
>
```

4. **Update badge indicator logic (Inbox tab icon):**
```typescript
const hasUnread = useMemo(() => {
  // Only unread incoming messages should trigger the badge
  return threads.some(t =>
    t.requestStatus === 'accepted' &&
    !t.archivedBy.includes(session?.user?.id ?? '') &&
    t.lastMessageSenderId &&
    t.lastMessageSenderId !== session?.user?.id &&
    isUnread(t)
  );
}, [threads, session?.user?.id]);
```

5. **Remove request count badge on Requests tab:**
```typescript
// Requests tab no longer shows a numeric badge
```

#### 4.2 Add swipe actions for archiving (Future Enhancement)
- Left swipe on thread row reveals "Archive" button
- Uses `react-native-gesture-handler` Swipeable component
- Calls `chatRepository.archiveThread(threadId, userId)`

---

### Phase 5: UI Changes - ChatScreen

#### 5.1 Add request acceptance UI
**File**: `src/presentation/screens/ChatScreen.tsx`

**Changes Needed:**

1. **Accept route params for request mode:**
```typescript
const { userId, user: initialUser, threadId, isRequest } = route.params;
```

2. **Add state for request status:**
```typescript
const [threadStatus, setThreadStatus] = useState<ChatThreadStatus>('accepted');
const [isHandlingRequest, setIsHandlingRequest] = useState(false);
```

3. **Fetch thread status on mount:**
```typescript
// In bootstrap effect, after fetching thread
setThreadStatus(thread.requestStatus);
```

4. **Add request action handlers:**
```typescript
const handleAcceptRequest = async () => {
  if (!threadId || !session?.user?.id) return;
  setIsHandlingRequest(true);
  try {
    await chatRepository.acceptThreadRequest(threadId, session.user.id);
    setThreadStatus('accepted');
  } catch (error) {
    console.error('Failed to accept request:', error);
    // Show error toast
  } finally {
    setIsHandlingRequest(false);
  }
};

const handleRefuseRequest = async () => {
  if (!threadId || !session?.user?.id) return;
  setIsHandlingRequest(true);
  try {
    await chatRepository.refuseThreadRequest(threadId, session.user.id);
    navigation.goBack(); // Return to inbox
  } catch (error) {
    console.error('Failed to refuse request:', error);
    // Show error toast
  } finally {
    setIsHandlingRequest(false);
  }
};
```

5. **Render request UI when in request mode:**
```typescript
{isRequest && threadStatus === 'pending' ? (
  <View style={styles.requestContainer}>
    <View style={styles.requestDisclaimerBox}>
      <MaterialIcons name="info-outline" size={20} color="#64748B" />
      <Text style={styles.requestDisclaimerText}>
        {chatCopy.request.disclaimer}
      </Text>
    </View>
    
    <View style={styles.requestActions}>
      <Pressable 
        style={[styles.requestButton, styles.refuseButton]}
        onPress={handleRefuseRequest}
        disabled={isHandlingRequest}
      >
        <Text style={styles.refuseButtonText}>
          {chatCopy.request.refuse}
        </Text>
      </Pressable>
      
      <Pressable 
        style={[styles.requestButton, styles.acceptButton]}
        onPress={handleAcceptRequest}
        disabled={isHandlingRequest}
      >
        <Text style={styles.acceptButtonText}>
          {chatCopy.request.accept}
        </Text>
      </Pressable>
    </View>
  </View>
) : null}
```

6. **Disable message input when thread is pending or refused:**
```typescript
const canSendMessages = threadStatus === 'accepted';

// In TextInput and send button
disabled={!canSendMessages || !message.trim() || isSending}
```

#### 5.2 Add copy strings
**File**: `src/presentation/content/chatCopy.ts`

Add request-related copy:
```typescript
export const chatCopy = {
  // ... existing
  request: {
    disclaimer: "This person isn't in your network. Accept to start chatting, or refuse to ignore.",
    accept: "Accept",
    refuse: "Refuse",
  },
};
```

---

### Phase 6: Navigation Type Updates

#### 6.1 Update MainStackParamList
**File**: `src/presentation/navigation/MainStack.tsx`

```typescript
export type MainStackParamList = {
  // ... existing routes
  Chat: { 
    userId: string; 
    user?: User | null;
    threadId?: string;      // NEW - optional thread ID
    isRequest?: boolean;    // NEW - flag for request mode
  };
};
```

---

### Phase 7: Documentation Updates

#### 7.1 Update inbox specification
**File**: `docs/specs/social/inbox.md`

**Additions:**

1. **Update FR-INBX-01** to clarify tab filtering logic:
```markdown
- **FR-INBX-01**: The system shall display conversations in three tabs:
  - **Primary**: Accepted conversations where the user is not archived
  - **Requests**: Pending message requests from non-followed users
  - **Archived**: Conversations archived by the user
```

2. **Add new functional requirements:**
```markdown
- **FR-INBX-11**: The system shall categorize threads as 'pending' if sent by a user that the recipient doesn't follow.
- **FR-INBX-12**: The system shall automatically set thread status to 'accepted' if both participants follow each other.
- **FR-INBX-13**: The system shall allow recipients to accept or refuse pending message requests.
- **FR-INBX-14**: The system shall allow users to archive conversations independently.
- **FR-INBX-15**: The system shall hide archived conversations from Primary and Requests tabs.
- **FR-INBX-16**: Refused threads shall not appear in any tab for the recipient.
```

3. **Add new use cases:**
```markdown
### UC-INBX-04: Accept Message Request
1. User receives a message from a non-followed peer.
2. Thread appears in "Requests" tab with unread indicator.
3. User taps the request to open ChatScreen.
4. ChatScreen displays the message and request UI with Accept/Refuse buttons.
5. User taps "Accept".
6. System updates thread status to 'accepted'.
7. Thread moves to "Primary" tab.
8. User can now send replies.

### UC-INBX-05: Refuse Message Request
1. User opens a pending message request in ChatScreen.
2. User taps "Refuse".
3. System updates thread status to 'refused'.
4. User is returned to Inbox.
5. Thread disappears from all tabs for the recipient.

### UC-INBX-06: Archive Conversation
1. User swipes left on a conversation in Primary or Requests tab.
2. "Archive" action appears.
3. User taps "Archive".
4. Thread moves to "Archived" tab.
5. Thread no longer appears in Primary or Requests tabs.
```

4. **Update Data Model section:**
```markdown
Data model (direct messages):
- `chat_threads`: stores 1:1 participant pair, last message, **request_status**, and **archived_by** array.
- `chat_members`: stores per-user `last_read_at` (seen up to).
- `chat_messages`: stores message content and sender per thread.

Request Status Values:
- `pending`: Initial state when non-followed user sends first message
- `accepted`: Recipient accepted the request, or mutual follow exists
- `refused`: Recipient declined the request (hidden from recipient's view)

Archive Behavior:
- Archived threads persist in the `archived` tab until user un-archives
- Both participants can independently archive the same thread
- Archived threads still receive new messages (they just don't appear in Primary)
```

#### 7.2 Update database schema documentation
**File**: `docs/specs/database-schema.md`

**Update Messaging section:**
```markdown
### 6. Messaging (Direct)
- **Threads (`chat_threads`)**: 
  - `participant_a`, `participant_b` (ordered unique pair, no self)
  - `created_by` (UUID, references the user who initiated the thread)
  - `last_message_at`, `last_message_preview`
  - **`request_status`** (TEXT): 'pending' | 'accepted' | 'refused'
  - **`archived_by`** (UUID[]): Array of user IDs who archived this thread
- **Members (`chat_members`)**: `thread_id`, `user_id`, `last_read_at` (seen up to).
- **Messages (`chat_messages`)**: `thread_id`, `sender_id` (non-null), `content`, `created_at`.

**Request Status Logic:**
- New threads default to 'pending' if sender doesn't follow recipient
- Auto-upgraded to 'accepted' if mutual follow relationship exists
- Recipient can accept or refuse pending requests
- Refused threads are hidden from recipient but remain accessible to sender

**Archive Logic:**
- Users can independently archive threads
- Archived threads move to separate tab but continue receiving messages
- Un-archiving returns thread to Primary tab
```

#### 7.3 Create implementation tracking document
**File**: `docs/INBOX_FILTERING_IMPLEMENTATION.md`

Track progress of implementation with checklist:
- [ ] Database migration created and tested
- [ ] Domain models updated
- [ ] Repository interfaces updated
- [ ] Supabase repository implementation
- [ ] Mock repository implementation
- [ ] InboxScreen UI updates
- [ ] ChatScreen request UI
- [ ] Navigation types updated
- [ ] Copy strings added
- [ ] Unit tests for repository methods
- [ ] Integration tests for request flows
- [ ] E2E tests for primary/requests/archived tabs
- [ ] Documentation updated

---

## Testing Strategy

### Unit Tests
**File**: `__tests__/data/repositories/SupabaseChatRepository.test.ts`

Test cases:
- ✅ `getThreadsForUser` filters primary conversations correctly
- ✅ `getThreadsForUser` filters requests correctly
- ✅ `getThreadsForUser` filters archived conversations correctly
- ✅ `acceptThreadRequest` updates status to 'accepted'
- ✅ `refuseThreadRequest` updates status to 'refused'
- ✅ `archiveThread` adds user to archived_by array
- ✅ `unarchiveThread` removes user from archived_by array
- ✅ New threads auto-set to 'accepted' when mutual follow exists
- ✅ New threads default to 'pending' when no follow relationship

### Integration Tests
**File**: `__tests__/presentation/screens/ChatScreen.test.tsx`

Test cases:
- ✅ Request UI appears when `isRequest=true` and `status='pending'`
- ✅ Accept button updates thread status and enables messaging
- ✅ Refuse button navigates back and hides thread
- ✅ Message input is disabled when thread is pending
- ✅ Disclaimer text is displayed in request mode

### E2E Tests (Maestro)
**File**: `e2e/maestro/inbox-filtering.yaml`

Scenarios:
1. **Receive and accept message request**
   - User B (not followed) sends message to User A
   - User A sees request in "Requests" tab
   - User A taps request, sees accept/refuse UI
   - User A taps "Accept"
   - Thread moves to "Primary" tab
   - User A can reply

2. **Refuse message request**
   - User A opens request from User C
   - User A taps "Refuse"
   - Thread disappears from all tabs
   - User C still sees thread (not affected)

3. **Archive conversation**
   - User A has conversation with User B in Primary
   - User A swipes and archives thread
   - Thread moves to "Archived" tab
   - Thread no longer in "Primary" tab

---

## Migration Strategy

### Step 1: Database Migration
1. Create migration file in `supabase/migrations/`
2. Test migration locally: `supabase migration up`
3. Run migration on staging environment
4. Verify existing threads have correct defaults
5. Run migration on production

### Step 2: Backend Changes (Repositories)
1. Update domain models with new fields
2. Update repository interfaces
3. Implement new methods in SupabaseChatRepository
4. Implement mock methods in MockChatRepository
5. Add unit tests for new methods
6. Verify all tests pass

### Step 3: Frontend Changes (UI)
1. Update InboxScreen with real data fetching
2. Add request UI to ChatScreen
3. Update navigation types
4. Add copy strings for request flow
5. Test in development mode
6. Test in mock mode

### Step 4: Testing
1. Run unit tests
2. Run integration tests
3. Run E2E tests in CI
4. Manual QA on staging
5. User acceptance testing

### Step 5: Documentation
1. Update inbox.md specification
2. Update database-schema.md
3. Create implementation tracking doc
4. Update TESTING_GUIDE.md with new scenarios

### Step 6: Deployment
1. Merge to main branch
2. Deploy to staging
3. Smoke test critical flows
4. Deploy to production
5. Monitor error logs
6. Monitor user feedback

---

## Risk Assessment

### High Risk
1. **Breaking Change to ChatThread Model**
   - **Risk**: Adding required fields breaks existing code
   - **Mitigation**: Provide defaults in repository mapping, use optional fields initially

2. **Data Migration for Existing Threads**
   - **Risk**: Existing threads might not migrate cleanly
   - **Mitigation**: Test migration on production snapshot, add rollback script

### Medium Risk
3. **Performance Impact of Follow Lookup**
   - **Risk**: Checking follow status on every thread creation adds latency
   - **Mitigation**: Add database index on user_follows, cache follow relationships

4. **User Confusion with Request Flow**
   - **Risk**: Users might not understand accept/refuse UI
   - **Mitigation**: Add clear disclaimer text, user education

### Low Risk
5. **Archive Array Size Growth**
   - **Risk**: archived_by array could grow large in group scenarios
   - **Mitigation**: Only 1:1 threads supported, max 2 participants

---

## Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1: Database Schema | 2 hours | None |
| Phase 2: Domain Models | 1 hour | Phase 1 |
| Phase 3: Repositories | 4 hours | Phase 2 |
| Phase 4: InboxScreen UI | 3 hours | Phase 3 |
| Phase 5: ChatScreen UI | 4 hours | Phase 3 |
| Phase 6: Navigation Types | 30 minutes | Phase 4, 5 |
| Phase 7: Documentation | 2 hours | All phases |
| Testing | 4 hours | All phases |
| **Total** | **~20 hours** | |

---

## Open Questions

1. **Q**: Should refused threads be permanently deleted or soft-deleted?
   - **A**: Soft-deleted (status = 'refused'). Only hidden from recipient's view.

2. **Q**: Can users un-archive conversations?
   - **A**: Yes, via swipe action or long-press menu (future enhancement).

3. **Q**: What happens if User A refuses User B's request, but later User A follows User B?
   - **A**: Thread status remains 'refused'. User B would need to send a new message (creates new thread).

4. **Q**: Should message requests expire after X days?
   - **A**: Not in initial version. Could be added later with scheduled job.

5. **Q**: Should there be a notification for new message requests?
   - **A**: Yes, existing notification system should handle this (future enhancement).

---

## Success Criteria

✅ **Feature Complete When:**
1. Users can receive message requests from non-followed users
2. Requests appear in dedicated "Requests" tab
3. Users can accept or refuse requests from ChatScreen
4. Accepted requests move to "Primary" tab
5. Refused requests disappear from recipient's view
6. Users can archive conversations
7. Archived conversations appear in "Archived" tab
8. All tests pass (unit, integration, E2E)
9. Documentation is updated and accurate
10. Performance is acceptable (< 500ms to load inbox)

---

## Appendix: Reference Links

- [Existing Inbox Spec](docs/specs/social/inbox.md)
- [Database Schema Spec](docs/specs/database-schema.md)
- [Social Graph Spec](docs/specs/social/social-graph.md)
- [Chat Retention Implementation](docs/CHAT_RETENTION_IMPLEMENTATION.md)
- [AGENTS.md](AGENTS.md) - Repository guidelines
