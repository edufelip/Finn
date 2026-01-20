# Comments Specification

## Purpose
Allows users to engage in discussions on posts.

## Functional Requirements
- **FR-COMP-01**: Users shall be able to add text comments to any approved post.
- **FR-COMP-02**: The system shall display comments in chronological order.
- **FR-COMP-03**: Comments shall be cached locally for performance.

## Use Cases
### UC-COMP-01: Comment on a Post
1. User opens a post's detail view.
2. User types a comment in the input field.
3. User clicks "Send".
4. System saves the comment and appends it to the local thread.

## Test Cases
- **TC-COMP-01**: Verify that an empty comment cannot be submitted.
- **TC-COMP-02**: Verify that comments are correctly associated with the author's profile (name/photo).

... (existing content) ...