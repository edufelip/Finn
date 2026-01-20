# Comments Specification

## Purpose
Allows users to engage in discussions on posts.

## Functional Requirements
- **FR-COMP-01**: Users shall be able to add text comments to any approved post.
- **FR-COMP-02**: The system shall display comments in chronological order.
- **FR-COMP-03**: Comments shall be cached locally for performance.

## Use Cases
### UC-COMP-01: Comment on a Post
... (existing content) ...

### UC-COMP-02: View User Comments
1. User opens a `UserProfile` screen.
2. User selects the "Comments" tab.
3. System fetches the user's latest comments via `getCommentsFromUser`.
4. System displays a list of comment cards showing the content and context.

## Implementation Details
- **CommentRepository**: Extended to support `getCommentsFromUser(userId)` fetching.
- **Data Mapping**: Comments include the target post ID and author profile information.
- **Caching**: User-specific comment lists are cached following the project's standard TTL policies.