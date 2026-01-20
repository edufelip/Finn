# Offline Image Persistence Specification

## Purpose
Ensures that images selected by the user while offline are not lost.

## Functional Requirements
- **FR-IMG-01**: The system shall copy selected images to a persistent internal directory before queuing a write action.
- **FR-IMG-02**: The system shall generate unique filenames for persisted images to avoid collisions.

## Use Cases
### UC-IMG-01: Persist Image for Offline Post
1. User selects an image from the gallery while offline.
2. System copies the image to `offline-images` directory.
3. System adds the new local path to the offline queue payload.

## Test Cases
- **TC-IMG-01**: Verify that if the app is restarted, the local image path in the queued action is still valid and accessible.
- **TC-IMG-02**: Verify that images are correctly copied even if the source is a temporary URI from the image picker.

... (existing content) ...