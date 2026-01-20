# Community Moderation Specification

## Purpose
Enables community management via delegated roles and audit trails.

## Functional Requirements
...
- **FR-MOD-06**: The system shall display real-time badge counts for pending and reported content on the community management screen.

## Performance Requirements
- **PR-MOD-01**: Badge counts for pending posts and reports shall be loaded in parallel (using `Promise.all`) to ensure fast screen loading times.
- **PR-MOD-02**: Complex list items (like Report Cards) shall use `React.memo` to prevent unnecessary re-renders during state updates.

## Use Cases
...
### UC-MOD-01: Approve a Pending Post
1. Moderator navigates to Community Settings > Pending Content.
2. Moderator reviews a post.
3. Moderator clicks "Approve".
4. System updates post status to `approved` and creates a log entry.
5. Post becomes visible in the public feed.

## Test Cases
- **TC-MOD-01**: Verify that a regular member cannot see the "Pending Content" button.
- **TC-MOD-02**: Verify that removing a moderator immediately revokes their access to moderation tools.

... (existing content) ...