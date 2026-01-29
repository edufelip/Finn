# User Blocking Specification

## Purpose
Allow users to block abusive accounts, immediately hide their content, and notify moderators through the existing reporting workflow.

## Functional Requirements
- **FR-BLK-01**: Users shall be able to block another user with a reason (15-300 characters).
- **FR-BLK-02**: Users shall not be able to block themselves.
- **FR-BLK-03**: Blocking shall remove the blocked user’s content from the blocker’s feeds immediately.
- **FR-BLK-04**: Blocking shall create a moderation signal (report) for admin inbox review.
- **FR-BLK-05**: Blocking shall require network connectivity.

## Architecture

### Domain Model
**Location**: `src/domain/models/userBlock.ts`
```typescript
export type UserBlock = {
  id: number;
  blockerId: string;
  blockedId: string;
  reason: string;
  sourcePostId?: number | null;
  createdAt: string;
};
```

### Repository Interface
**Location**: `src/domain/repositories/UserBlockRepository.ts`
```typescript
export interface UserBlockRepository {
  blockUser(blockerId: string, blockedId: string, reason: string, sourcePostId?: number | null): Promise<UserBlock>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUserIds(blockerId: string): Promise<string[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
}
```

### Database Schema
**Location**: `supabase/migrations/20260128090000_add_terms_and_user_blocks.sql`

**Table**: `user_blocks`
- `id` (bigserial, primary key)
- `blocker_id` (uuid, references profiles.id, cascade delete)
- `blocked_id` (uuid, references profiles.id, cascade delete)
- `reason` (text, not null, check: 15-300 chars)
- `source_post_id` (bigint, references posts.id, set null on delete)
- `created_at` (timestamptz, default now())
- **Unique constraint** on (blocker_id, blocked_id)
- **Check**: blocker_id <> blocked_id

## UI & Behavior
- **PostCard** adds a “Block User” action and shows a reason modal.
- **BlockUserModal** collects reason and confirms the action.
- **postsStore** filters out posts from blocked users.
- **PostDetailScreen** shows a blocked-state placeholder when the author is blocked.

## Use Cases

### UC-BLK-01: Block a User from a Post
1. User views a post from an abusive account.
2. User taps the 3‑dot menu and selects **Block User**.
3. System shows a reason prompt (15–300 chars).
4. User submits a reason.
5. System creates `user_blocks` row and updates the local blocked list.
6. Blocked user’s content disappears immediately from feeds.
7. Report is created automatically for moderator review.

### UC-BLK-02: Blocked Content Visibility
1. User opens a post detail for a blocked author.
2. System shows the blocked-state UI instead of content.
3. Comments by the blocked author are filtered from the thread.

### UC-BLK-03: Unblock a User
1. User chooses to unblock a previously blocked account.
2. System deletes the `user_blocks` record.
3. Blocked content is eligible to appear again after feed refresh.

## Reporting Linkage
- Block actions create a report record automatically so moderators can review behavior in the admin inbox.
- A database trigger on `user_blocks` inserts a `post_reports` record when `source_post_id` is present.
