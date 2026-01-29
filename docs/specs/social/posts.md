# Posts Specification

## Purpose
Posts are the core content unit of the platform, consisting of text and optional images. Posts are created within communities and can be liked, saved, commented on, and reported.

## Functional Requirements

### Core Features
- **FR-POST-01**: Users shall be able to create posts with text and one optional image.
    - **Validation**: Post content is required (max 1000 characters).
    - **Validation**: Community selection is required.
    - **Validation**: Image upload is optional.
- **FR-POST-02**: Users shall be able to browse posts in two home feed tabs:
    - **Communities Tab**: Shows posts from all communities the user has joined.
    - **People Tab**: Shows posts from all users the user follows.
- **FR-POST-03**: Users shall be able to like/unlike posts.
- **FR-POST-04**: Users shall be able to save/unsave posts for later viewing.
- **FR-POST-05**: The system shall support pagination (20 items per page) for all feeds.
- **FR-POST-06**: Authors and community moderators shall be able to delete posts.
- **FR-POST-07**: Posts in "moderated" communities shall require approval before appearing in the public feed.
- **FR-POST-08**: Posts shall include metadata: likes count, comments count, author info, community info.
- **FR-POST-09**: Post images shall be served via signed URLs from Supabase storage.

### Moderation and Lifecycle
- **FR-POST-10**: Posts in moderated communities shall have one of three statuses:
    - `pending`: Awaiting moderator review (not visible to other users).
    - `approved`: Approved by moderator (visible in feed).
    - `rejected`: Rejected by moderator (not visible).
- **FR-POST-11**: Community moderators shall be able to approve or reject pending posts.
- **FR-POST-12**: Community moderators shall be able to mark any post for review (changes status to pending).
- **FR-POST-13**: Posts in "anyone_follows" communities shall auto-approve (status = approved).
- **FR-POST-14**: Posts in "private" communities shall only allow the owner to post.

### Sorting and Filtering
- **FR-POST-15**: Community post feeds shall support 4 sort orders:
    - `newest`: Sort by created_at DESC (default).
    - `oldest`: Sort by created_at ASC.
    - `mostLiked`: Sort by likes_count DESC.
    - `mostCommented`: Sort by comments_count DESC.
- **FR-POST-16**: Saved posts shall sort by save date (most recent first).

### Reporting
- **FR-POST-17**: Users shall be able to report posts that violate guidelines.
- **FR-POST-18**: Report reasons shall be required (15-300 characters).
- **FR-POST-19**: Users shall not be able to submit duplicate reports for the same post.
- **FR-POST-20**: Post reports shall include status tracking (pending, resolved_safe, resolved_deleted).

## Architecture

### Domain Models
**Location**: `src/domain/models/post.ts`

```typescript
export enum ModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum PostSortOrder {
  Newest = 'newest',
  Oldest = 'oldest',
  MostLiked = 'mostLiked',
  MostCommented = 'mostCommented',
}

export type Post = {
  id: number;
  content: string;
  imageUrl?: string | null;
  createdAt?: string;
  communityId: number;
  communityTitle?: string;
  communityImageUrl?: string | null;
  userId: string;
  userName?: string;
  userPhotoUrl?: string | null;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  moderationStatus?: ModerationStatus;
};
```

### Repository Interface
**Location**: `src/domain/repositories/PostRepository.ts`

```typescript
export interface PostRepository {
  getUserFeed(userId: string, page: number): Promise<Post[]>;
  getFollowingFeed(userId: string, page: number): Promise<Post[]>;
  getPublicFeed(page: number): Promise<Post[]>;
  getPostsFromCommunity(communityId: number, page: number, sortOrder?: PostSortOrder): Promise<Post[]>;
  getPostsFromUser(userId: string, page: number): Promise<Post[]>;
  getSavedPosts(userId: string, page: number): Promise<Post[]>;
  getSavedPostsCount(userId: string): Promise<number>;
  getPendingPosts(communityId: number): Promise<Post[]>;
  getPostLikes(postId: number): Promise<number>;
  findLike(postId: number, userId: string): Promise<boolean>;
  findSavedPost(postId: number, userId: string): Promise<boolean>;
  likePost(postId: number, userId: string): Promise<void>;
  dislikePost(postId: number, userId: string): Promise<void>;
  bookmarkPost(postId: number, userId: string): Promise<void>;
  unbookmarkPost(postId: number, userId: string): Promise<void>;
  savePost(post: Post, imageUri?: string | null): Promise<Post>;
  updateModerationStatus(postId: number, status: ModerationStatus): Promise<void>;
  markPostForReview(postId: number): Promise<void>;
  deletePost(postId: number): Promise<void>;
}
```

### Database Schema
**Table**: `posts`
- `id` (bigserial, primary key)
- `content` (text, not null)
- `image_url` (text, nullable)
- `created_at` (timestamptz, default now())
- `community_id` (bigint, references communities.id)
- `user_id` (uuid, references profiles.id)
- `moderation_status` (text, default 'approved', check: pending/approved/rejected)

**Table**: `likes`
- `id` (bigserial, primary key)
- `post_id` (bigint, references posts.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `created_at` (timestamptz, default now())
- **Constraint**: Unique index on (user_id, post_id)

**Table**: `saved_posts`
- `id` (bigserial, primary key)
- `post_id` (bigint, references posts.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `created_at` (timestamptz, default now())
- **Constraint**: Unique index on (user_id, post_id)

**Table**: `post_reports` (added in `20260119000000_create_post_reports.sql`)
- `id` (bigserial, primary key)
- `post_id` (bigint, references posts.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `reason` (text, 15-300 chars)
- `status` (text, default 'pending', check: pending/resolved_safe/resolved_deleted)
- `created_at` (timestamptz, default now())
- **Constraint**: Unique index on (user_id, post_id) prevents duplicate reports

### Storage
Post images are stored in Supabase storage bucket `post-images` with signed URLs (7-day expiry).

## Use Cases

### UC-POST-01: Create Post with Image
1. User navigates to Create Post screen.
2. User selects a community (only subscribed communities shown).
3. User types content (up to 1000 characters).
4. User optionally selects an image from the gallery.
5. User submits.
6. System uploads image to storage (if provided).
7. System creates post record with moderation_status based on community settings:
   - `approved` for "anyone_follows" communities.
   - `pending` for "moderated" communities.
   - `pending` when text filtering flags content or when a non-moderator includes an image.
8. System clears relevant feed caches.
9. Post appears immediately in author's feed (if approved) or pending queue (if moderated).

### UC-POST-02: Like a Post
1. User taps the heart icon on a post.
2. System performs optimistic UI update (increments count, fills icon).
3. System creates record in `likes` table.
4. If offline, system queues operation.
5. UI reflects new like state.

### UC-POST-03: Unlike a Post
1. User taps the filled heart icon on a liked post.
2. System performs optimistic UI update (decrements count, unfills icon).
3. System deletes record from `likes` table.
4. If offline, system queues operation.

### UC-POST-04: Save a Post
1. User taps the bookmark icon on a post.
2. System performs optimistic UI update (fills icon).
3. System creates record in `saved_posts` table.
4. If offline, system queues operation.
5. Post appears in "Saved" tab immediately.

### UC-POST-05: Report a Post
1. User taps "Report" option on a post.
2. User enters reason (15-300 characters).
3. System validates input.
4. System creates `post_reports` record with status = pending.
5. System prevents duplicate reports (unique constraint).
6. User sees confirmation alert.

### UC-POST-06: Moderate Pending Post (Moderator)
1. Community moderator navigates to "Pending Content" screen.
2. Moderator sees list of posts with moderation_status = pending.
3. Moderator taps on a post to review.
4. Moderator selects "Approve" or "Reject".
5. System updates post.moderation_status to approved or rejected.
6. If approved, post appears in community feed for all users.
7. If rejected, post remains hidden and author is notified.

### UC-POST-07: Mark Post for Review (Moderator)
1. Moderator views any approved post in community.
2. Moderator taps "Mark for Review" option.
3. System updates post.moderation_status to pending.
4. Post is removed from public feed until re-approved.
5. Post appears in "Pending Content" queue.

### UC-POST-08: Sort Community Posts
1. User navigates to Community Detail screen.
2. User taps sort dropdown.
3. User selects sort order (newest/oldest/mostLiked/mostCommented).
4. System fetches posts with selected sort order.
5. Feed updates with sorted posts.

### UC-POST-09: Browse Following Feed (People Tab)
1. User taps "People" tab in Home screen.
2. System fetches posts from followed users (getFollowingFeed).
3. System displays paginated feed (20 posts per page).
4. User scrolls to bottom to load more.
5. System fetches next page and appends to feed.

### UC-POST-10: Delete Post
1. Author or moderator taps "Delete" on a post.
2. System shows confirmation alert.
3. User confirms deletion.
4. System deletes post record (cascade deletes likes, comments, reports).
5. System deletes post image from storage (if exists).
6. Post is removed from all feeds immediately.

## Test Cases

### Creation and Display
- **TC-POST-01**: Verify post creation fails without selecting a community.
- **TC-POST-02**: Verify post content validation enforces max length (1000 chars).
- **TC-POST-03**: Verify image upload handles network errors gracefully.
- **TC-POST-04**: Verify post created in "anyone_follows" community has status = approved.
- **TC-POST-05**: Verify post created in "moderated" community has status = pending.
- **TC-POST-06**: Verify pending posts do not appear in public feed.

### Likes and Saves
- **TC-POST-07**: Verify like creates record and increments count.
- **TC-POST-08**: Verify unlike deletes record and decrements count.
- **TC-POST-09**: Verify duplicate like fails (unique constraint).
- **TC-POST-10**: Verify save adds post to saved_posts and appears in Saved tab.
- **TC-POST-11**: Verify unsave removes post from Saved tab.
- **TC-POST-12**: Verify offline like queues operation and syncs later.

### Sorting
- **TC-POST-13**: Verify "newest" sort returns posts ordered by created_at DESC.
- **TC-POST-14**: Verify "oldest" sort returns posts ordered by created_at ASC.
- **TC-POST-15**: Verify "mostLiked" sort returns posts ordered by likes_count DESC.
- **TC-POST-16**: Verify "mostCommented" sort returns posts ordered by comments_count DESC.
- **TC-POST-17**: Verify sort order persists across pagination.

### Moderation
- **TC-POST-18**: Verify moderator can approve pending post (status → approved).
- **TC-POST-19**: Verify moderator can reject pending post (status → rejected).
- **TC-POST-20**: Verify approved post appears in community feed.
- **TC-POST-21**: Verify rejected post does not appear in feed.
- **TC-POST-22**: Verify "Mark for Review" changes approved post to pending.
- **TC-POST-23**: Verify only moderator can approve/reject posts.

### Reporting
- **TC-POST-24**: Verify report creation with valid reason (15-300 chars) succeeds.
- **TC-POST-25**: Verify duplicate report from same user fails (unique constraint).
- **TC-POST-26**: Verify report reason validation rejects <15 or >300 characters.
- **TC-POST-27**: Verify report status defaults to 'pending'.
- **TC-POST-28**: Verify user can view their own reports.

### Deletion
- **TC-POST-29**: Verify author can delete their own post.
- **TC-POST-30**: Verify moderator can delete any post in their community.
- **TC-POST-31**: Verify post deletion cascades to likes, comments, saved_posts, reports.
- **TC-POST-32**: Verify post image is deleted from storage after post deletion.

### Feeds and Pagination
- **TC-POST-33**: Verify Communities feed shows posts from subscribed communities only.
- **TC-POST-34**: Verify People feed shows posts from followed users only.
- **TC-POST-35**: Verify pagination loads exactly 20 posts per page.
- **TC-POST-36**: Verify hasMore flag is false when result count < 20.
- **TC-POST-37**: Verify optimistic updates revert on API failure.

### Edge Cases
- **TC-POST-38**: Verify guest users cannot create, like, or save posts (shows guest gate).
- **TC-POST-39**: Verify offline post creation queues operation.
- **TC-POST-40**: Verify empty feed shows appropriate empty state message.
- **TC-POST-41**: Verify posts from deleted communities do not appear in feed.

## Performance Requirements
- **PR-POST-01**: Feed queries shall complete within 500ms under normal conditions.
- **PR-POST-02**: Image uploads shall support retry logic for network failures.
- **PR-POST-03**: Like/unlike operations shall use optimistic updates for instant feedback.
- **PR-POST-04**: Pagination shall prevent loading duplicate pages simultaneously.

## Related Specifications
- Communities: See `docs/specs/social/communities.md`
- Comments: See `docs/specs/social/comments.md`
- Post Reporting: See `docs/specs/moderation/post-reporting.md`
- Community Moderation: See `docs/specs/moderation/community-moderation.md`
- Offline Queue: See `docs/specs/data-sync/offline-queue.md`
- Caching: See `docs/specs/data-sync/caching.md`
