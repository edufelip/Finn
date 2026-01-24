# Comments Specification

## Purpose
Comments allow users to engage in discussions on posts. Comments are displayed in chronological order and support user profile integration.

## Functional Requirements

### Core Features
- **FR-COMP-01**: Users shall be able to add text comments to any approved post.
    - **Validation**: Comment content is required (max 500 characters).
    - **Validation**: User must be authenticated.
- **FR-COMP-02**: The system shall display comments in chronological order (oldest first).
- **FR-COMP-03**: Comments shall be cached locally for performance (2-hour TTL).
- **FR-COMP-04**: Comments shall include author metadata (name, profile photo).
- **FR-COMP-05**: Comments shall be paginated when viewing user comment history.
- **FR-COMP-06**: Users shall be able to view all comments made by a specific user.

### Permissions
- **FR-COMP-07**: Comment authors shall be able to delete their own comments.
- **FR-COMP-08**: Community moderators shall be able to delete any comment in their communities.
- **FR-COMP-09**: Comment authors shall be able to edit their own comments (if implemented).
- **FR-COMP-10**: Users can only comment on approved posts (moderation_status = approved).

### Data Management
- **FR-COMP-11**: Comments shall survive user deletion (user_id becomes nullable on cascade).
- **FR-COMP-12**: Comments shall be cascade-deleted when parent post is deleted.
- **FR-COMP-13**: Comment creation shall trigger real-time notifications to post author.
- **FR-COMP-14**: Comment counts shall be updated in real-time on posts.

## Architecture

### Domain Models
**Location**: `src/domain/models/comment.ts`

```typescript
export type Comment = {
  id: number;
  postId: number;
  userId: string;
  userName?: string;
  userImageUrl?: string | null;
  content: string;
  createdAt?: string;
};
```

### Repository Interface
**Location**: `src/domain/repositories/CommentRepository.ts`

```typescript
export interface CommentRepository {
  getCommentsForPost(postId: number): Promise<Comment[]>;
  getCommentsFromUser(userId: string): Promise<Comment[]>;
  saveComment(comment: Comment): Promise<Comment>;
}
```

**Note**: Deletion is handled via RLS policies - users can delete their own comments through standard delete operations.

### Database Schema
**Location**: `supabase/remote_init.sql`

**Table**: `comments`
- `id` (bigserial, primary key)
- `post_id` (bigint, references posts.id, cascade delete)
- `user_id` (uuid, references profiles.id, set null on delete)
- `content` (text, not null, max 500 chars)
- `created_at` (timestamptz, default now())

**Indexes**:
- `idx_comments_post_id` on `post_id` (for fast post comment lookup)

**RLS Policies**:
- `comments_select_authenticated`: All authenticated users can view comments
- `comments_insert_own`: Users can insert comments with their own user_id
- `comments_update_own`: Users can update their own comments
- `comments_delete_own`: Users can delete their own comments

**Triggers**:
- `trg_notify_comment`: After insert, triggers notification to post author

### Implementation
**Location**: `src/data/repositories/SupabaseCommentRepository.ts`

**Key Features**:
- Caching: Comments for a post are cached with 2-hour TTL
- Cache invalidation: New comments append to cached list
- User photo resolution: Handles both remote URLs and storage bucket URLs
- Profile joins: Eagerly loads user name and photo
- Sorting: getCommentsForPost sorts by created_at ASC
- User history: getCommentsFromUser sorts by created_at DESC

**Cache Policy**:
```typescript
CacheKey.commentsByPost(postId) // Cache key format
CACHE_TTL_MS.comments = 7_200_000 // 2 hours
```

## Use Cases

### UC-COMP-01: Comment on a Post
1. User views a post in their feed.
2. User taps "Comment" or comment count badge.
3. System navigates to Post Detail screen.
4. System loads and displays existing comments (cached or fetched).
5. User types comment text in input field (max 500 chars).
6. User taps "Send" button.
7. System validates content (non-empty, ≤500 chars).
8. System creates comment record via saveComment().
9. System appends comment to cached list.
10. System updates post comments_count.
11. System triggers notification to post author.
12. Comment appears immediately in UI.

### UC-COMP-02: View User Comments
1. User navigates to another user's profile (or their own).
2. User taps the "Comments" tab.
3. System fetches user's comment history via getCommentsFromUser(userId).
4. System displays list of comment cards showing:
   - Comment content
   - Target post context (post preview)
   - Timestamp
5. Comments sorted by newest first (created_at DESC).
6. User can tap on a comment to view full post context.

### UC-COMP-03: Delete Own Comment
1. User views their own comment in Post Detail screen.
2. User long-presses or swipes on comment.
3. System shows "Delete" option (if user is author).
4. User confirms deletion.
5. System deletes comment record (RLS policy enforces ownership).
6. System clears cache for commentsByPost(postId).
7. System decrements post comments_count.
8. Comment is removed from UI immediately.

### UC-COMP-04: Moderator Deletes Comment
1. Community moderator views a comment in their community.
2. Moderator long-presses on comment.
3. System shows "Delete" option (if user is moderator).
4. Moderator confirms deletion.
5. System deletes comment record.
6. System clears cache for commentsByPost(postId).
7. System decrements post comments_count.
8. Comment is removed from UI immediately.

### UC-COMP-05: Cached Comments Load
1. User views a post they recently viewed.
2. System checks cache for CacheKey.commentsByPost(postId).
3. If cache hit and not expired (< 2 hours):
   - System returns cached comments immediately (fast load).
4. If cache miss or expired:
   - System fetches from database.
   - System caches result for 2 hours.

### UC-COMP-06: Real-time Comment Notification
1. User A comments on User B's post.
2. System triggers `trg_notify_comment` after insert.
3. System creates notification record for User B.
4. User B receives notification in Notifications tab.
5. User B taps notification to view post and new comment.

## Test Cases

### Creation and Display
- **TC-COMP-01**: Verify comment creation with valid content (≤500 chars) succeeds.
- **TC-COMP-02**: Verify comment creation fails without content.
- **TC-COMP-03**: Verify comment content validation rejects >500 characters.
- **TC-COMP-04**: Verify comments display in chronological order (oldest first).
- **TC-COMP-05**: Verify new comment appears immediately after creation.
- **TC-COMP-06**: Verify comment includes author name and photo.

### Caching
- **TC-COMP-07**: Verify getCommentsForPost returns cached data within 2-hour TTL.
- **TC-COMP-08**: Verify cache miss triggers database fetch.
- **TC-COMP-09**: Verify saveComment appends new comment to cache.
- **TC-COMP-10**: Verify cache invalidation after comment deletion.

### User Comments
- **TC-COMP-11**: Verify getCommentsFromUser returns all comments by user.
- **TC-COMP-12**: Verify user comments sorted by newest first (created_at DESC).
- **TC-COMP-13**: Verify user comment history displays post context.

### Permissions
- **TC-COMP-14**: Verify only comment author can delete their own comment (RLS).
- **TC-COMP-15**: Verify community moderator can delete any comment in their community.
- **TC-COMP-16**: Verify non-author/non-moderator cannot delete comment (403 error).
- **TC-COMP-17**: Verify users can only comment on approved posts.

### Cascade Behavior
- **TC-COMP-18**: Verify comment deletion when parent post is deleted.
- **TC-COMP-19**: Verify comment.user_id becomes null when user is deleted (not cascade).
- **TC-COMP-20**: Verify deleted user's comments remain visible with null user_id.

### Real-time Features
- **TC-COMP-21**: Verify comment creation triggers notification to post author.
- **TC-COMP-22**: Verify post comments_count increments after comment creation.
- **TC-COMP-23**: Verify post comments_count decrements after comment deletion.

### Profile Integration
- **TC-COMP-24**: Verify user photo URL resolution for storage bucket URLs.
- **TC-COMP-25**: Verify user photo URL resolution for remote URLs (http/https).
- **TC-COMP-26**: Verify null photo_url returns null (no crash).

### Edge Cases
- **TC-COMP-27**: Verify guest users cannot create comments (shows guest gate).
- **TC-COMP-28**: Verify offline comment creation queues operation (if offline queue enabled).
- **TC-COMP-29**: Verify empty comment list shows appropriate message.
- **TC-COMP-30**: Verify comment on deleted post fails gracefully.
- **TC-COMP-31**: Verify comments with null user_id display as "[Deleted User]" or similar.

## Performance Requirements
- **PR-COMP-01**: Comment queries shall complete within 300ms under normal conditions.
- **PR-COMP-02**: Cached comment loads shall return within 50ms.
- **PR-COMP-03**: Cache TTL shall be 2 hours (7,200,000ms).
- **PR-COMP-04**: Comments shall load eagerly with profile data (single query with join).

## Related Specifications
- Posts: See `docs/specs/social/posts.md`
- User Profile: See `docs/specs/user-management/user-profile.md`
- Caching: See `docs/specs/data-sync/caching.md`
- Notifications: See `docs/specs/user-management/notifications.md`
- Community Moderation: See `docs/specs/moderation/community-moderation.md`