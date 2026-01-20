# Communities Specification

## Purpose
Communities are the primary containers for posts, grouped by interest.

## Functional Requirements
- **FR-COMM-01**: Users shall be able to create new communities.
    - **Validation**: Title is required.
    - **Validation**: Description is required.
    - **Validation**: Community image is required (as per `createCommunityCopy`).
- **FR-COMM-02**: Community owners shall be able to set posting permissions (`anyone_follows`, `moderated`, `private`).
- **FR-COMM-03**: Users shall be able to search for communities by title or topic.
- **FR-COMM-04**: Users shall be able to subscribe/unsubscribe to communities.
- **FR-COMM-05**: The system shall serve community images via signed URLs.

## Use Cases
### UC-COMM-01: Join a Community
1. User searches for "React Native".
2. User selects a community from results.
3. User clicks "Subscribe".
4. System creates a subscription record and increments subscriber count.

## Test Cases
- **TC-COMM-01**: Verify that sorting communities by "Most Followed" correctly orders the list.
- **TC-COMM-02**: Verify that an owner can change the community description and it updates for all users.

... (existing content) ...