# Post Reporting Specification

## Purpose
Allows users to flag inappropriate content for moderator review. The reporting system provides a structured workflow for community moderators to review, act on, and track reported content.

## Functional Requirements

### Core Features
- **FR-REP-01**: Users shall be able to report any post with a reason (15-300 characters).
- **FR-REP-02**: Users shall not be able to submit duplicate reports for the same post.
- **FR-REP-03**: Reports shall have a status: pending, resolved_safe, or resolved_deleted.
- **FR-REP-04**: Community moderators and owners shall be able to view reports for their communities.

### Moderation Actions
- **FR-REP-05**: Moderators shall be able to delete reported posts.
- **FR-REP-06**: Moderators shall be able to mark reports as "Safe" (post is not violating).
- **FR-REP-07**: All moderation actions shall be logged for audit purposes.
- **FR-REP-08**: Moderators shall see reported content in a dedicated queue.

### User Experience
- **FR-REP-09**: Users shall be able to view their own submitted reports.
- **FR-REP-10**: Users shall receive confirmation when a report is submitted.
- **FR-REP-11**: Moderators shall see badge counts for pending reports.
- **FR-REP-12**: Report workflow shall require network connectivity.
- **FR-REP-13**: Moderators shall see due/overdue indicators for the 24-hour response window.

## Architecture

### Domain Models
**Location**: `src/domain/models/postReport.ts`

```typescript
export enum ReportStatus {
  Pending = 'pending',
  ResolvedSafe = 'resolved_safe',
  ResolvedDeleted = 'resolved_deleted',
}

export type PostReport = {
  id: number;
  postId: number;
  userId: string;
  reason: string;
  status: ReportStatus;
  createdAt?: string;
  // Joined fields
  userName?: string;
  userPhotoUrl?: string | null;
  postContent?: string;
  postImageUrl?: string | null;
};
```

### Repository Interface
**Location**: `src/domain/repositories/PostReportRepository.ts`

```typescript
export interface PostReportRepository {
  createReport(report: PostReport): Promise<PostReport>;
  getReportsByPost(postId: number): Promise<PostReport[]>;
  getReportsByCommunity(communityId: number, status?: ReportStatus): Promise<PostReport[]>;
  updateReportStatus(reportId: number, status: ReportStatus): Promise<void>;
  getUserReports(userId: string): Promise<PostReport[]>;
}
```

### Database Schema
**Location**: `supabase/migrations/20260119000000_create_post_reports.sql`

**Table**: `post_reports`
- `id` (bigserial, primary key)
- `post_id` (bigint, references posts.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `reason` (text, not null, check: 15-300 chars)
- `status` (text, default 'pending', check: pending/resolved_safe/resolved_deleted)
- `created_at` (timestamptz, default now())

**Indexes**:
- `idx_post_reports_post_id` on `post_id`
- `idx_post_reports_user_id` on `user_id`
- `idx_post_reports_created_at` on `created_at desc`
- `idx_post_reports_status` on `status`

**Constraints**:
- Unique index on (user_id, post_id) - Prevents duplicate reports

**RLS Policies**:
- `Users can report posts`: Users can insert reports with their own user_id
- `Users can view their own reports`: Users can select their own reports
- `Service role can view all reports`: Service role has full read access
- `Moderators can view community reports`: Moderators can view reports for their communities
- `Moderators can update report status`: Moderators can update status field

## UI Components

### ReportedContentScreen
**Location**: `src/presentation/screens/ReportedContentScreen.tsx` (555 lines)

**Features**:
- Lists pending post reports for the community
- Custom report card showing:
  - Reporter info (avatar, name, timestamp)
  - Report reason with flag badge
  - Post preview (content + image thumbnail)
  - Action buttons (Delete Post, Mark Safe)
  - Due/overdue indicator (24-hour SLA)
- Authorization check (owner or moderator only)
- Optimistic UI updates (removes card immediately)
- Confirmation dialogs for destructive actions
- Empty state with shield icon when no reports

**Key Functions**:
```typescript
handleDeletePost(report: PostReport) {
  1. Shows confirmation dialog
  2. Checks network connectivity
  3. Deletes post via postRepository.deletePost()
  4. Updates report status to 'resolved_deleted'
  5. Creates a community ban or global ban for the post author
  6. Creates moderation log (action: 'user_banned')
  7. Removes from UI optimistically
}

handleMarkSafe(report: PostReport) {
  1. Shows confirmation dialog
  2. Checks network connectivity
  3. Updates report status to 'resolved_safe'
  4. Creates moderation log (action: 'mark_safe')
  5. Removes from UI optimistically
}
```

### PostOptionsModal
**Location**: `src/presentation/components/PostOptionsModal.tsx`

**Features**:
- "Report Post" option with outlined-flag icon (error color)
- Available to all authenticated users
- Opens report submission dialog
- Dynamic modal height based on user permissions

### ReportCard Component
**Internal to ReportedContentScreen**

**Layout**:
```
┌─────────────────────────────────────┐
│ [Avatar] Reporter Name              │
│          3 days ago                 │
│ ┌────────────────┐                  │
│ │ 🚩 Flag Badge  │                  │
│ └────────────────┘                  │
│ "Report reason text goes here..."   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Post Preview:                   │ │
│ │ "Post content..."               │ │
│ │ [Image Thumbnail]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Delete Post] [Mark Safe]           │
└─────────────────────────────────────┘
```

## Workflow

### Workflow 1: User Reports Post
```
1. User views post in feed
   ↓
2. User taps 3-dot menu on PostCard
   ↓
3. User selects "Report Post" option
   ↓
4. System shows report reason input dialog
   ↓
5. User enters reason (15-300 characters)
   ↓
6. System validates input
   ↓
7. System creates post_report record with status = 'pending'
   ↓
8. System enforces unique constraint (prevents duplicates)
   ↓
9. User sees success confirmation
   ↓
10. Report appears in moderator's ReportedContentScreen
```

### Workflow 2: Moderator Reviews Report (Mark Safe)
```
1. Moderator navigates to EditCommunityScreen
   ↓
2. Moderator sees badge count on "Reported Content" button
   ↓
3. Moderator taps "Reported Content"
   ↓
4. System shows ReportedContentScreen with pending reports
   ↓
5. Moderator reviews report card (reporter, reason, post preview)
   ↓
6. Moderator determines post does not violate rules
   ↓
7. Moderator taps "Mark Safe" button
   ↓
8. System shows confirmation dialog
   ↓
9. Moderator confirms action
   ↓
10. System checks network connectivity
   ↓
11. System updates report.status to 'resolved_safe'
   ↓
12. System creates moderation_log with action = 'mark_safe'
   ↓
13. Report card removed from queue (optimistic update)
   ↓
14. Post remains visible in community feed
```

### Workflow 3: Moderator Reviews Report (Delete Post)
```
1. Moderator navigates to ReportedContentScreen
   ↓
2. Moderator reviews report and determines post violates rules
   ↓
3. Moderator taps "Delete Post" button
   ↓
4. System shows confirmation dialog with warning
   ↓
5. Moderator confirms deletion
   ↓
6. System checks network connectivity
   ↓
7. System deletes post via postRepository.deletePost()
   ↓
8. System cascade-deletes likes, comments, saved_posts
   ↓
9. System deletes post image from storage
   ↓
10. System updates report.status to 'resolved_deleted'
   ↓
11. System creates moderation_log with action = 'delete_post'
   ↓
12. Report card removed from queue (optimistic update)
   ↓
13. Post removed from all feeds and user profiles
```

### Workflow 4: View User's Submitted Reports
```
1. User navigates to Profile → Settings (if implemented)
   ↓
2. User selects "My Reports" option
   ↓
3. System fetches reports via getUserReports(userId)
   ↓
4. System displays list of user's submitted reports
   ↓
5. Each report shows:
   - Post that was reported
   - Report reason
   - Status (pending/resolved_safe/resolved_deleted)
   - Submission date
```

## Use Cases

### UC-REP-01: Report a Post
1. User views a post with inappropriate content.
2. User taps the 3-dot menu icon on PostCard.
3. User selects "Report Post" option (outlined-flag icon).
4. System displays report reason input dialog.
5. User enters reason: "This post contains spam".
6. System validates reason (≥15 chars, ≤300 chars).
7. System calls `reportRepository.createReport()`.
8. System enforces unique constraint (user hasn't reported this post before).
9. System creates report with status = 'pending'.
10. System shows success alert: "Thank you for your report".
11. Post remains visible to user (not auto-hidden).

### UC-REP-02: View Reported Content Queue
1. Community moderator opens EditCommunityScreen.
2. Moderator sees "Reported Content" button with badge (3).
3. Moderator taps "Reported Content".
4. System checks authorization (owner or moderator).
5. System fetches pending reports via `getReportsByCommunity(communityId, 'pending')`.
6. System displays ReportedContentScreen with 3 report cards.
7. Each card shows: reporter info, flag badge, reason, post preview.
8. Moderator can scroll through all pending reports.

### UC-REP-03: Mark Report as Safe
1. Moderator reviews report card.
2. Moderator reads reason: "This is offensive".
3. Moderator reviews post content and determines it's acceptable.
4. Moderator taps "Mark Safe" button.
5. System shows confirmation: "Mark this post as safe? The report will be marked as resolved safe."
6. Moderator confirms.
7. System checks network connectivity.
8. System updates report.status to 'resolved_safe'.
9. System creates moderation log with action = 'mark_safe'.
10. System removes report card from UI (optimistic).
11. Post remains visible in community feed.
12. Badge count decrements (2 remaining).

### UC-REP-04: Delete Reported Post
1. Moderator reviews report card.
2. Moderator reads reason: "Contains illegal content".
3. Moderator reviews post and confirms violation.
4. Moderator taps "Delete Post" button.
5. System shows confirmation: "Delete this post? This action cannot be undone."
6. Moderator confirms deletion.
7. System checks network connectivity.
8. System calls `postRepository.deletePost(postId)`.
9. System deletes post record (cascade deletes likes, comments, reports).
10. System deletes post image from Supabase storage.
11. System updates report.status to 'resolved_deleted'.
12. System creates moderation log with action = 'delete_post'.
13. System removes report card from UI (optimistic).
14. Post removed from all feeds immediately.
15. Badge count decrements (1 remaining).

### UC-REP-05: Duplicate Report Prevention
1. User reports a post with reason "Spam".
2. System creates report successfully.
3. Later, user tries to report the same post again.
4. System attempts to create second report.
5. Database unique constraint fails (user_id, post_id).
6. System shows error: "You have already reported this post".
7. No duplicate report is created.

### UC-REP-06: Report SLA Countdown (24 Hours)
1. Moderator opens ReportedContentScreen.
2. System calculates due time = report.created_at + 24 hours.
3. Report card displays **Due in Xh** for open reports.
4. After 24 hours, label switches to **Overdue**.
5. Moderator prioritizes overdue reports for action.

## Test Cases

### Report Creation
- **TC-REP-01**: Verify user can report any approved post.
- **TC-REP-02**: Verify report reason validation (≥15, ≤300 chars).
- **TC-REP-03**: Verify duplicate report fails with unique constraint error.
- **TC-REP-04**: Verify report defaults to status = 'pending'.
- **TC-REP-05**: Verify report includes reporter info (userId, createdAt).
- **TC-REP-06**: Verify guest users cannot report posts.

### Report Viewing
- **TC-REP-07**: Verify moderator sees only pending reports initially.
- **TC-REP-08**: Verify report card shows all required info (reporter, reason, post).
- **TC-REP-09**: Verify non-moderators cannot access ReportedContentScreen.
- **TC-REP-10**: Verify badge count matches pending report count.
- **TC-REP-11**: Verify empty state shows when no pending reports.

### Mark Safe Action
- **TC-REP-12**: Verify "Mark Safe" updates report status to 'resolved_safe'.
- **TC-REP-13**: Verify "Mark Safe" creates moderation log.
- **TC-REP-14**: Verify post remains visible after marking safe.
- **TC-REP-15**: Verify report removed from pending queue after marking safe.
- **TC-REP-16**: Verify confirmation dialog appears before marking safe.

### Delete Post Action
- **TC-REP-17**: Verify "Delete Post" removes post from database.
- **TC-REP-18**: Verify "Delete Post" updates report status to 'resolved_deleted'.
- **TC-REP-19**: Verify "Delete Post" creates moderation log.
- **TC-REP-20**: Verify post deletion cascades to likes, comments, saved_posts.
- **TC-REP-21**: Verify post image deleted from storage.
- **TC-REP-22**: Verify confirmation dialog appears before deleting post.

### Authorization
- **TC-REP-23**: Verify only moderators/owners can access ReportedContentScreen.
- **TC-REP-24**: Verify only moderators/owners can delete reported posts.
- **TC-REP-25**: Verify only moderators/owners can mark reports as safe.
- **TC-REP-26**: Verify non-moderators redirected with error message.

### Network Handling
- **TC-REP-27**: Verify offline report actions show error alert.
- **TC-REP-28**: Verify network check before delete/mark safe actions.
- **TC-REP-29**: Verify optimistic updates revert on failure.

### Edge Cases
- **TC-REP-30**: Verify reporting deleted post fails gracefully.
- **TC-REP-31**: Verify viewing reports for deleted community fails gracefully.
- **TC-REP-32**: Verify report with exactly 15 characters accepted.
- **TC-REP-33**: Verify report with exactly 300 characters accepted.
- **TC-REP-34**: Verify report with 14 characters rejected.
- **TC-REP-35**: Verify report with 301 characters rejected.

## Performance Requirements
- **PR-REP-01**: Report submission shall complete within 500ms.
- **PR-REP-02**: ReportedContentScreen shall load within 1 second.
- **PR-REP-03**: Delete post action shall complete within 2 seconds.
- **PR-REP-04**: Optimistic UI updates shall be instant (<16ms).

## Related Specifications
- Community Moderation: See `docs/specs/moderation/community-moderation.md`
- User Blocking: See `docs/specs/moderation/user-blocking.md`
- Global Bans: See `docs/specs/moderation/global-bans.md`
- Posts: See `docs/specs/social/posts.md`
- Moderation Logs: See moderation system audit trail
- Database Schema: See `docs/specs/database-schema.md`
