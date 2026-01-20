# Posts Specification

## Purpose
Posts are the core content unit of the platform, consisting of text and optional images.

## Functional Requirements
- **FR-POST-01**: Users shall be able to create posts with text and one optional image.
    - **Validation**: Post content is required.
    - **Validation**: Community selection is required.
    - **Validation**: Post content must be within the character limit (implicitly handled by UI).
- **FR-POST-02**: Users shall be able to browse posts in a personalized home feed.
- **FR-POST-03**: Users shall be able to like/unlike posts.
- **FR-POST-04**: Users shall be able to save/unsave posts for later viewing.
- **FR-POST-05**: The system shall support pagination (20 items per page) for all feeds.
- **FR-POST-06**: Authors and moderators shall be able to delete posts.
- **FR-POST-07**: Posts in "moderated" communities shall require approval before appearing in the public feed.

## Use Cases
### UC-POST-01: Create Post with Image
1. User clicks "Add Post".
2. User selects a community.
3. User types content and selects an image from the gallery.
4. User submits.
5. System uploads image to storage, then creates the post record.
6. Local cache for the feed is cleared.

### UC-POST-02: Like a Post
1. User clicks the heart icon on a post.
2. System upserts a record in the `likes` table.
3. UI increments the like count locally (optimistically or via refresh).

## Test Cases
- **TC-POST-01**: Verify that a user cannot submit a post without selecting a community.
- **TC-POST-02**: Verify that a deleted post's image is removed from Supabase Storage.
- **TC-POST-03**: Verify that saving a post adds it to the "Saved" screen immediately.

... (existing content) ...