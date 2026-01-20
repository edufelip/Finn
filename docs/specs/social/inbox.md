# Inbox & Messaging Specification

## Purpose
Provides a UI for users to view and manage their direct messages and conversation requests.

## Functional Requirements
- **FR-INBX-01**: The system shall display a list of conversations categorized by tabs: Primary, Requests, and Archived.
- **FR-INBX-02**: The system shall allow users to search for conversations by name or message content.
- **FR-INBX-03**: The system shall display unread indicators for new messages.
- **FR-INBX-04**: The system shall show the online status of conversation participants.
- **FR-INBX-05**: The system shall restrict inbox access to authenticated users.
- **FR-INBX-06**: The system shall support 1:1 direct message threads only (no group chats).
- **FR-INBX-07**: The system shall use a "seen up to" timestamp per user per thread for read status.
- **FR-INBX-08**: The system shall prevent a user from messaging themselves.

## Use Cases
### UC-INBX-01: Search Conversations
1. User navigates to the Inbox screen.
2. User types a name in the search bar.
3. System filters the conversation list in real-time based on the query.

### UC-INBX-02: View Unread Messages
1. User sees a badge on the "Primary" tab indicating the number of unread conversations.
2. User identifies unread conversations by a vertical blue bar.

### UC-INBX-03: Direct Message from Profile
1. User navigates to a user's profile (`UserProfile`).
2. User taps the "Message" button.
3. System navigates to the `Chat` screen.
4. User can view the conversation history and send new messages.

## Implementation Details
The messaging system consists of:
- **Inbox Screen**: A tabbed list of 1:1 conversations (UI prototype).
- **Chat Screen**: A direct message interface with:
    - Receiver online status and verified badge.
    - Right-aligned blue bubbles for user messages.
    - Left-aligned white bubbles for contact messages.
    - "Seen up to" read state per thread.
    - Modern input bar for text-only messages.
    - `KeyboardAvoidingView` integration for seamless typing experience.

Data model (direct messages):
- `chat_threads`: stores the 1:1 participant pair and last message preview.
- `chat_members`: stores per-user `last_read_at` (seen up to).
- `chat_messages`: stores message content and sender per thread.
