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

## Test Cases
- **TC-INBX-01**: Verify that guests see a "Sign in required" gate when trying to access the Inbox.
- **TC-INBX-02**: Verify that switching tabs (e.g., to "Requests") filters the displayed conversations correctly.

## Terminology
- **Primary**: Main conversation list.
- **Requests**: Messages from users not followed by the current user.
- **Archived**: Conversations hidden from the main list.

## Implementation Details
The current implementation of the Inbox is a **UI prototype** using static data defined in `inboxCopy.ts`. Real-time messaging and backend synchronization are not yet implemented.
