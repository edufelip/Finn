# Offline Queue Specification

## Purpose
Ensures data consistency by capturing writes while offline.

## Functional Requirements
- **FR-SYNC-01**: The system shall capture all write intents (posts, likes, etc.) when the device is offline.
- **FR-SYNC-02**: The system shall persist the offline queue in local storage.
- **FR-SYNC-03**: The system shall automatically process the queue in FIFO order when connectivity is restored.
- **FR-SYNC-04**: The system shall ensure only one sync process runs at a time.

## Use Cases
### UC-SYNC-01: Offline Post Creation
1. User is in an airplane (offline).
2. User creates a post.
3. System persists the image locally (see `offline-images.md`).
4. System adds the "create_post" action to the `queueStore`.
5. When user lands and connects, the `SyncManager` processes the queue and the post goes live.

## Test Cases
- **TC-SYNC-01**: Verify that actions in the queue survive an app force-close.
- **TC-SYNC-02**: Verify that if a sync fails due to a 500 error, the item is removed (current behavior) or retried (future improvement).

... (existing content) ...