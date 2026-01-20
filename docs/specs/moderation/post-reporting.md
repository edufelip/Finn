# Post Reporting Specification

## Purpose
Allows users to flag inappropriate content.

## Functional Requirements
- **FR-REP-01**: Users shall be able to report any post with a reason.
- **FR-REP-02**: Moderators shall be able to view a queue of reported posts.
- **FR-REP-03**: Moderators shall be able to mark a report as "Safe" or "Resolved (Deleted)".

## Use Cases
### UC-REP-01: Report a Post
1. User clicks the options menu on a post.
2. User selects "Report".
3. User chooses a reason.
4. System creates a `post_report` record and notifies moderators.

## Test Cases
- **TC-REP-01**: Verify that a user can only report a specific post once.
- **TC-REP-02**: Verify that marking a post as "Safe" removes it from the reported queue but keeps the post visible.

... (existing content) ...