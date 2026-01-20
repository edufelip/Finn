# Social Graph Specification

## Purpose
Manages relationships between users, specifically the following/follower model.

## Functional Requirements
- **FR-SOC-01**: Users shall be able to follow other users.
- **FR-SOC-02**: Users shall be able to unfollow users.
- **FR-SOC-03**: The system shall prevent a user from following themselves.
- **FR-SOC-04**: The system shall provide a real-time "isFollowing" status for UI buttons.

## Use Cases
### UC-SOC-01: Follow a Peer
1. User A views User B's profile.
2. User A clicks "Follow".
3. System inserts relationship and increments User B's follower count.
4. System triggers a notification for User B.

## Test Cases
- **TC-SOC-01**: Verify that following a user immediately changes the button state to "Following".
- **TC-SOC-02**: Verify that deleting a user account removes all their follow relationships from the DB.

... (existing content) ...