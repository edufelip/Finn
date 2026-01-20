# User Presence Specification

## Purpose
Determines if a user is currently "online" based on their last activity and privacy settings.

## Functional Requirements
- **FR-PRES-01**: The system shall track the user's "last seen" timestamp in the database.
- **FR-PRES-02**: The system shall respect the user's "online visibility" privacy setting.
- **FR-PRES-03**: The system shall provide real-time online status updates via WebSockets (Supabase Presence).
- **FR-PRES-04**: The system shall send a periodic "heartbeat" to the server while the app is active.

## Use Cases
### UC-PRES-01: View Peer Online Status
1. User A views User B's profile.
2. System checks User B's `onlineVisible` flag and `lastSeenAt` timestamp.
3. If visible and within the threshold (2 minutes), System shows an "Online" indicator.

## Test Cases
- **TC-PRES-01**: Verify that backgrounding the app stops the heartbeat and presence tracking.
- **TC-PRES-02**: Verify that setting `onlineVisible` to false immediately hides the user's status from others.

... (existing content) ...