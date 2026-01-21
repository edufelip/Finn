# Inbox & Messaging Specification

## Purpose
Provides a UI for users to view and manage their direct messages, message requests, and archived conversations.

## Functional Requirements
- **FR-INBX-01**: The system shall display conversations in three tabs:
  - **Primary**: Accepted conversations where the user has not archived them
  - **Requests**: Pending message requests from non-followed users  
  - **Archived**: Conversations archived by the user
- **FR-INBX-02**: The system shall allow users to search for conversations by name or message content.
- **FR-INBX-03**: The system shall display unread indicators for new messages from other users (not the current user's own messages).
- **FR-INBX-04**: The system shall show the online status of conversation participants.
- **FR-INBX-05**: The system shall restrict inbox access to authenticated users.
- **FR-INBX-06**: The system shall support 1:1 direct message threads only (no group chats).
- **FR-INBX-07**: The system shall use a "seen up to" timestamp per user per thread for read status.
- **FR-INBX-08**: The system shall prevent a user from messaging themselves.
- **FR-INBX-09**: The system shall automatically delete messages older than 14 days.
- **FR-INBX-10**: The system shall display a disclaimer to users that "Messages will disappear after 14 days".
- **FR-INBX-11**: The system shall categorize threads as 'pending' if sent by a user that the recipient doesn't follow.
- **FR-INBX-12**: The system shall automatically set thread status to 'accepted' if both participants follow each other (or one follows the other).
- **FR-INBX-13**: The system shall allow recipients to accept or refuse pending message requests.
- **FR-INBX-14**: The system shall allow users to archive conversations independently.
- **FR-INBX-15**: The system shall hide archived conversations from Primary and Requests tabs.
- **FR-INBX-16**: Refused threads shall not appear in any tab for the recipient.

## Use Cases
### UC-INBX-01: Search Conversations
1. User navigates to the Inbox screen.
2. User types a name in the search bar.
3. System filters the conversation list in real-time based on the query.

### UC-INBX-02: View Unread Messages
1. User sees a red dot on the Inbox tab icon when unread incoming messages exist.
2. User identifies unread conversations by a vertical blue bar.

### UC-INBX-03: Direct Message from Profile
1. User navigates to a user's profile (`UserProfile`).
2. User taps the "Message" button.
3. System navigates to the `Chat` screen.
4. User can view the conversation history and send new messages.

### UC-INBX-04: Accept Message Request
1. User receives a message from a non-followed peer.
2. Thread appears in "Requests" tab with unread indicator.
3. User taps the request to open ChatScreen.
4. ChatScreen displays the message and request UI with Accept/Refuse buttons and disclaimer.
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
6. Sender can still view the thread (not affected).

### UC-INBX-06: Archive Conversation
1. User views a conversation in Primary or Requests tab.
2. User performs archive action (swipe or long-press).
3. System adds user to thread's archived_by array.
4. Thread moves to "Archived" tab.
5. Thread no longer appears in Primary or Requests tabs.

## Implementation Details
The messaging system consists of:
- **Inbox Screen**: A tabbed list of 1:1 conversations with three tabs:
    - **Primary**: Shows accepted conversations (not archived)
    - **Requests**: Shows pending message requests from non-followed users
    - **Archived**: Shows conversations the user has archived
- **Chat Screen**: A direct message interface with:
    - Receiver online status (green dot when online, grey text when offline) and verified badge.
    - Right-aligned blue bubbles for user messages.
    - Left-aligned white bubbles for contact messages.
    - **Request Mode**: When viewing a pending request, displays:
        - Disclaimer text explaining the request
        - "Accept" button (blue, prominent)
        - "Refuse" button (grey, secondary)
        - Disabled message input until request is accepted
    - "Seen up to" read state per thread (read receipts hidden until `last_read_at` comparison is wired).
    - Modern input bar for text-only messages with:
        - 100 character limit with visible character counter (e.g., "45/100").
        - Optimistic UI updates showing "sending" status.
        - Error handling with retry capability for failed messages.
        - Send button disabled when message is empty, actively sending, or thread is pending/refused.
    - `KeyboardAvoidingView` integration for seamless typing experience.
    - Bottom safe area spacing (32px minimum) to prevent input obstruction.
    - Simplified header without info/settings button.
    - Empty state with forum icon, conversation prompt, and 14-day retention disclaimer.

Data model (direct messages):
- `chat_threads`: stores the 1:1 participant pair, last message preview, **last_message_sender_id**, **request_status**, and **archived_by** array.
- `chat_members`: stores per-user `last_read_at` (seen up to).
- `chat_messages`: stores message content and sender per thread.

**Request Status Values:**
- `pending`: Initial state when non-followed user sends first message
- `accepted`: Recipient accepted the request, or follow relationship exists
- `refused`: Recipient declined the request (hidden from recipient's view)

**Archive Behavior:**
- Archived threads persist in the `archived` tab until user un-archives
- Both participants can independently archive the same thread
- Archived threads still receive new messages (they just don't appear in Primary)
- Archive state stored in `archived_by` UUID array on chat_threads table

## Data Retention Policy
- **Retention Period**: Messages are automatically deleted after 14 days from their `created_at` timestamp.
- **Implementation**: 
    - Database-level policy using Supabase RLS or scheduled cleanup function.
    - Client-side filtering in repositories to exclude messages older than 14 days.
    - Automated daily job to permanently delete expired messages.
- **User Communication**: 
    - Empty state displays: "Messages will disappear after 14 days"
    - Users are informed upfront about the ephemeral nature of messages.
- **Thread Management**: 
    - When all messages in a thread are deleted, the thread's `last_message_preview` and `last_message_sender_id` are cleared.
    - Empty threads remain visible to preserve conversation history metadata.
