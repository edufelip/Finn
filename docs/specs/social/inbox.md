# Inbox & Messaging Specification

## Purpose
Provides a UI for users to view and manage their direct messages and conversation requests.

## Functional Requirements
- **FR-INBX-01**: The system shall display a list of conversations categorized by tabs: Primary, Requests, and Archived.
- **FR-INBX-02**: The system shall allow users to search for conversations by name or message content.
- **FR-INBX-03**: The system shall display unread indicators for new messages.
- **FR-INBX-04**: The system shall show the online status of conversation participants.
- **FR-INBX-05**: The system shall restrict inbox access to authenticated users.

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
- **Inbox Screen**: A tabbed list of conversations (UI prototype).
- **Chat Screen**: A high-fidelity direct message interface with:
    - Receiver online status and verified badge.
    - Right-aligned blue bubbles for user messages.
    - Left-aligned white bubbles for contact messages.
    - Attachment support (e.g., PDF schema) with icons.
    - Modern input bar with quick actions for images and attachments.
    - `KeyboardAvoidingView` integration for seamless typing experience.

Real-time messaging backend synchronization is currently mocked using local state.
