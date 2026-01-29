# Community Moderation Specification

## Purpose
Enables comprehensive community management via delegated moderator roles, content approval workflows, and detailed audit trails. Community owners can assign moderators, configure posting permissions, and maintain full visibility into moderation activities.

## Functional Requirements

### Core Moderation Features
- **FR-MOD-01**: Community owners shall be able to set posting permissions: `anyone_follows`, `moderated`, or `private`.
- **FR-MOD-02**: Community owners shall be able to assign and remove moderators.
- **FR-MOD-03**: Moderators shall be able to approve or reject pending posts.
- **FR-MOD-04**: Moderators shall be able to review and act on reported content.
- **FR-MOD-05**: Moderators shall be able to mark approved posts for review.
- **FR-MOD-06**: The system shall display real-time badge counts for pending and reported content.
- **FR-MOD-21**: The system shall apply automated text filtering using remote-config term lists (blocked/review), defaulting to empty lists when not configured.
- **FR-MOD-22**: Moderation term lists shall be normalized to lowercase and limited to word characters (letters/numbers/underscore).
- **FR-MOD-23**: Post submission shall be blocked while moderation config is still loading on cold start.

### Audit and Logging
- **FR-MOD-07**: All moderation actions shall be logged with moderator ID, action type, and timestamp.
- **FR-MOD-08**: The system shall track 9 moderation action types: approve_post, reject_post, delete_post, mark_safe, mark_for_review, moderator_added, moderator_removed, settings_changed, user_banned.
- **FR-MOD-09**: Moderation logs shall be viewable by owners and moderators.
- **FR-MOD-10**: Moderation logs shall display color-coded icons based on action severity.

### Authorization
- **FR-MOD-11**: Only community owners can add/remove moderators and change settings.
- **FR-MOD-12**: Both owners and moderators can approve/reject posts and handle reports.
- **FR-MOD-13**: Non-moderators attempting to access moderation screens shall be redirected.
- **FR-MOD-14**: The system shall use RLS helper function `is_community_moderator()` for authorization.

### User Experience
- **FR-MOD-15**: The system shall provide 5 dedicated moderation screens accessible from community management.
- **FR-MOD-16**: Navigation blockers shall prevent accidental loss of unsaved changes.
- **FR-MOD-17**: Confirmation dialogs shall appear before destructive actions.
- **FR-MOD-18**: Network connectivity checks shall prevent offline moderation actions.
- **FR-MOD-19**: Moderators/owners shall be able to ban a user from a community when resolving reports.
- **FR-MOD-20**: Community-banned users shall be prevented from posting or commenting, and their content shall be hidden from other users.

## Architecture

### Domain Models

**PostPermission** (`src/domain/models/community.ts`):
```typescript
export type PostPermission = 'anyone_follows' | 'moderated' | 'private';
```

**ModerationStatus** (`src/domain/models/post.ts`):
```typescript
export enum ModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}
```

**ModerationAction** (`src/domain/models/moderationLog.ts`):
```typescript
export type ModerationAction =
  | 'approve_post'
  | 'reject_post'
  | 'mark_for_review'
  | 'delete_post'
  | 'mark_safe'
  | 'moderator_added'
  | 'moderator_removed'
  | 'settings_changed'
  | 'user_banned';

export type ModerationLog = {
  id: number;
  communityId: number;
  moderatorId: string;
  action: ModerationAction;
  postId?: number | null;
  createdAt?: string;
  // Joined fields
  moderatorName?: string;
  moderatorPhotoUrl?: string | null;
};
```

**CommunityModerator** (`src/domain/models/communityModerator.ts`):
```typescript
export type CommunityModerator = {
  id: number;
  communityId: number;
  userId: string;
  addedBy: string;
  addedAt?: string;
  // Joined fields
  userName?: string;
  userPhotoUrl?: string | null;
  addedByName?: string;
};
```

### Database Schema

**community_moderators table**:
- `id` (bigserial, primary key)
- `community_id` (bigint, references communities.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `added_by` (uuid, references profiles.id, set null on delete)
- `added_at` (timestamptz, default now())
- **Unique constraint** on (community_id, user_id) - prevents duplicate moderators

**moderation_logs table**:
- `id` (bigserial, primary key)
- `community_id` (bigint, references communities.id, cascade delete)
- `moderator_id` (uuid, references profiles.id, set null on delete)
- `action` (text, not null, check: 9 valid values)
  - `post_id` (bigint, references posts.id, set null on delete, nullable)
  - `created_at` (timestamptz, default now())

**community_bans table**:
- `id` (bigserial, primary key)
- `community_id` (bigint, references communities.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `banned_by` (uuid, references profiles.id, set null on delete)
- `reason` (text, nullable)
- `source_post_id` (bigint, references posts.id, set null on delete)
- `created_at` (timestamptz, default now())

**RLS Helper Function**:
```sql
CREATE FUNCTION is_community_moderator(comm_id bigint, uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM communities WHERE id = comm_id AND owner_id = uid
    UNION
    SELECT 1 FROM community_moderators WHERE community_id = comm_id AND user_id = uid
  );
$$ LANGUAGE SQL STABLE;
```

### Repository Interfaces

**CommunityModeratorRepository** (`src/domain/repositories/CommunityModeratorRepository.ts`):
```typescript
export interface CommunityModeratorRepository {
  addModerator(moderator: CommunityModerator): Promise<CommunityModerator>;
  removeModerator(moderatorId: number): Promise<void>;
  getModerators(communityId: number): Promise<CommunityModerator[]>;
  isModerator(communityId: number, userId: string): Promise<boolean>;
}
```

**ModerationLogRepository** (`src/domain/repositories/ModerationLogRepository.ts`):
```typescript
export interface ModerationLogRepository {
  createLog(log: ModerationLog): Promise<ModerationLog>;
  getLogs(communityId: number): Promise<ModerationLog[]>;
}
```

## UI Screens

### 1. EditCommunityScreen
**Location**: `src/presentation/screens/EditCommunityScreen.tsx` (652 lines)

**Purpose**: Central hub for community management and moderation

**Features**:
- **Cover Image Upload**: Camera/gallery via ImageSourceSheet
- **Post Permission Settings**: Radio button group with 3 options:
  - "Anyone can post" (anyone_follows)
  - "Posts require approval" (moderated)
  - "Only I can post" (private)
- **Moderation Section** with 4 navigation buttons:
  - **Pending Content** (badge showing count)
  - **Reported Content** (badge showing count)
  - **Moderation Logs** (read-only, history icon)
  - **Manage Moderators**
- **Save Button**: Only enabled when changes detected
- **Unsaved Changes Dialog**: Navigation blocker if changes pending
- **Authorization**: Owner only (non-owners redirected)

**Component Structure**:
```typescript
<ScrollView>
  <ImageSection onSelectImage={handleSelectImage} />
  <PostPermissionSection
    value={postPermission}
    onChange={setPostPermission}
  />
  <ModerationSection>
    <ModerationNavButton
      icon="pending-actions"
      title="Pending Content"
      badge={pendingCount}
      onPress={() => navigate('PendingContent')}
    />
    <ModerationNavButton
      icon="flag"
      title="Reported Content"
      badge={reportCount}
      onPress={() => navigate('ReportedContent')}
    />
    <ModerationNavButton
      icon="history"
      title="Moderation Logs"
      onPress={() => navigate('ModerationLogs')}
    />
    <ModerationNavButton
      icon="supervisor-account"
      title="Manage Moderators"
      onPress={() => navigate('ManageModerators')}
    />
  </ModerationSection>
  <SaveButton onPress={handleSave} disabled={!hasChanges} />
</ScrollView>
```

**Performance Optimizations**:
- Uses `React.memo` for RadioOption and ModerationNavButton
- Uses `useCallback` for event handlers
- Loads badge counts in parallel with `Promise.all`

---

### 2. PendingContentScreen
**Location**: `src/presentation/screens/PendingContentScreen.tsx` (421 lines)

**Purpose**: Queue for reviewing posts awaiting approval in moderated communities

**Features**:
- Lists posts with `moderation_status = 'pending'`
- Uses PostCard component for consistent display
- **Action Buttons**:
  - **Approve** (check icon, primary color) → status = 'approved'
  - **Reject** (close icon, error color) → status = 'rejected'
- Confirmation dialogs for both actions
- Optimistic UI updates (removes post immediately)
- Network connectivity check before actions
- Creates moderation logs (approve_post / reject_post)
- Empty state with check-circle icon

**Authorization**: Owner or moderator only

**Workflow**:
```
1. Load pending posts for community
2. Display in FlatList with PostCard
3. User taps Approve/Reject
4. Show confirmation dialog
5. Check network connectivity
6. Update moderation_status
7. Create moderation log
8. Remove from UI (optimistic)
9. Badge count updates automatically
```

---

### 3. ReportedContentScreen
**Location**: `src/presentation/screens/ReportedContentScreen.tsx` (555 lines)

**Purpose**: Queue for reviewing user-reported content

**Features**:
- Lists pending post reports for community
- Custom report card showing:
  - Reporter avatar, name, timestamp
  - Flag badge with report reason
  - Post preview (content + image thumbnail)
- **Action Buttons**:
  - **Remove & Ban User** (error color) → deletes post + updates report to 'resolved_deleted' + bans author
  - **Mark Safe** (primary color) → updates report to 'resolved_safe', keeps post
- Confirmation dialogs for both actions
- Optimistic UI updates
- Creates moderation logs (user_banned / mark_safe)
- Empty state with shield icon

**Authorization**: Owner or moderator only

**Report Card Layout**:
```
┌─────────────────────────────────────┐
│ [Avatar] John Doe                   │
│          3 days ago                 │
│ ┌────────────────┐                  │
│ │ 🚩 Report       │                  │
│ └────────────────┘                  │
│ "This post contains spam and..."    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Reported Post:                  │ │
│ │ "Buy this product now..."       │ │
│ │ [Image]                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Delete Post] [Mark Safe]           │
└─────────────────────────────────────┘
```

---

### 4. ModerationLogsScreen
**Location**: `src/presentation/screens/ModerationLogsScreen.tsx` (343 lines)

**Purpose**: Read-only audit trail of all moderation actions

**Features**:
- Color-coded icons for each action type:
  - `approve_post` → check-circle (primary)
  - `reject_post` → cancel (error)
  - `delete_post` → delete (error)
  - `mark_safe` → verified-user (primary)
  - `mark_for_review` → flag (tertiary)
  - `moderator_added` → person-add (tertiary)
  - `moderator_removed` → person-remove (onSurfaceVariant)
  - `settings_changed` → settings (tertiary)
  - `other` → info (onSurfaceVariant)
- Shows moderator info (avatar, name) and timestamp
- Sorted by newest first (created_at DESC)
- Empty state with history icon

**Authorization**: Owner or moderator can view

**Log Entry Layout**:
```
┌─────────────────────────────────────┐
│ [Icon] Action Name                  │
│ by Moderator Name                   │
│ 2 hours ago                         │
└─────────────────────────────────────┘
```

---

### 5. ManageModeratorsScreen
**Location**: `src/presentation/screens/ManageModeratorsScreen.tsx` (471 lines)

**Purpose**: Manage community moderator assignments

**Features**:
- Lists all moderators with avatars
- Shows metadata: "Added by Owner Name • Jan 20, 2026"
- **Add Moderator** button (FAB style, bottom-right)
  - Uses `Alert.prompt()` for user ID input
  - Owner only
- **Remove** button per moderator (trash icon)
  - Confirmation dialog
  - Owner only
- Network connectivity check
- Creates moderation logs (moderator_added / moderator_removed)
- Empty state with supervisor-account icon

**Authorization**: 
- Owner: Can add/remove moderators
- Moderators: Can view list only

**Moderator Card Layout**:
```
┌─────────────────────────────────────┐
│ [Avatar] Jane Smith         [Remove]│
│ Added by John Doe • Jan 20, 2026    │
└─────────────────────────────────────┘
```

---

## Updated Screens

### ProfileScreen (Updated)
**Location**: `src/presentation/screens/ProfileScreen.tsx` (948 lines)

**New Feature**: Added "My Communities" tab (3rd tab)

**Changes**:
- Shows communities where user is owner
- Each community has "Manage" button → navigates to EditCommunity
- Tab animations work with 3 values (0, 0.5, 1)
- Uses ManagedCommunityCard component

---

### CreatePostScreen (Updated)
**Location**: `src/presentation/screens/CreatePostScreen.tsx`

**New Feature**: Moderation disclaimer and status handling

**Changes**:
- Checks if user is moderator/owner of selected community
- Sets `moderation_status` based on community permission:
  - Moderated + non-mod → `pending`
  - Moderated + mod/owner → `approved` (bypass)
  - Non-moderated → `approved`
- Shows info banner for moderated communities (non-mods only):
  - "This community requires moderator approval before posts are visible."
- Different success alerts based on status
- Offline support includes `moderationStatus`

---

### CommunityDetailScreen (Updated)
**Location**: `src/presentation/screens/CommunityDetailScreen.tsx`

**New Feature**: Mark post for review

**Changes**:
- Checks if user can moderate community
- Passes `canModerate` prop to PostCard
- New handler: `handleMarkForReview()`
  - Confirmation dialog
  - Network check
  - Calls `postRepository.markPostForReview()`
  - Creates moderation log with action = 'mark_for_review'

---

## UI Components

### ModerationNavButton (Internal)
**Location**: Internal to EditCommunityScreen

**Props**:
```typescript
{
  icon: string;
  title: string;
  badge?: number;
  onPress: () => void;
}
```

**Features**:
- Material icon with color
- Title with description
- Optional badge (red circle with count)
- Chevron-right navigation indicator
- Pressable with ripple effect
- Optimized with React.memo

---

### ManagedCommunityCard
**Location**: `src/presentation/components/ManagedCommunityCard.tsx` (133 lines)

**Purpose**: Display owned communities in Profile tab

**Features**:
- Community cover image
- Title and description
- Subscriber count
- "Manage" button → navigates to EditCommunity
- Optimized with React.memo

---

### PostCard (Updated)
**Location**: `src/presentation/components/PostCard.tsx`

**New Props**:
```typescript
{
  canModerate?: boolean;
  onMarkForReview?: () => void;
}
```

**Changes**: Passes new props to PostOptionsModal

---

### PostOptionsModal (Updated)
**Location**: `src/presentation/components/PostOptionsModal.tsx`

**New Props**:
```typescript
{
  canModerate?: boolean;
  onMarkForReview?: () => void;
}
```

**New Feature**: "Mark for Review" option
- Flag icon (tertiary color)
- Only visible to moderators/owners
- Different from "Report" (outlined-flag, error color)
- Dynamic modal height based on option count

---

## Use Cases

### UC-MOD-01: Set Community to Moderated Mode
1. Community owner navigates to owned community.
2. Owner taps "Manage" button on community card.
3. System opens EditCommunityScreen.
4. Owner sees current post permission (e.g., "Anyone can post").
5. Owner selects "Posts require approval" radio button.
6. Owner taps "Save" button.
7. System updates community.post_permission to 'moderated'.
8. System creates moderation log with action = 'settings_changed'.
9. System shows success message.
10. All future posts from non-moderators require approval.

### UC-MOD-02: Add a Moderator
1. Community owner navigates to EditCommunityScreen.
2. Owner taps "Manage Moderators" button.
3. System opens ManageModeratorsScreen.
4. Owner taps "Add Moderator" FAB button.
5. System displays native `Alert.prompt()`.
6. Owner enters user ID (e.g., "abc-123-def") and confirms.
7. System validates user ID exists.
8. System creates community_moderators record.
9. System creates moderation log with action = 'moderator_added'.
10. System refreshes moderator list.
11. New moderator gains immediate access to moderation screens.

### UC-MOD-03: Approve Pending Post
1. Moderator opens EditCommunityScreen.
2. Moderator sees "Pending Content" button with badge (5).
3. Moderator taps "Pending Content".
4. System opens PendingContentScreen with 5 pending posts.
5. Moderator reviews first post content.
6. Moderator taps "Approve" button.
7. System shows confirmation: "Approve this post?".
8. Moderator confirms.
9. System checks network connectivity.
10. System updates post.moderation_status to 'approved'.
11. System creates moderation log with action = 'approve_post'.
12. Post removed from pending queue (optimistic).
13. Post appears in community feed for all users.
14. Badge count decrements to (4).

### UC-MOD-04: Remove & Ban Reported User
1. Moderator opens EditCommunityScreen.
2. Moderator sees "Reported Content" button with badge (2).
3. Moderator taps "Reported Content".
4. System opens ReportedContentScreen.
5. Moderator reviews report card with reason and post preview.
6. Moderator determines post violates rules.
7. Moderator taps "Remove & Ban User" button.
8. System shows confirmation with ban scope options (community or global, if staff/admin).
9. Moderator confirms deletion.
10. System checks network connectivity.
11. System deletes post (cascade deletes likes, comments).
12. System updates report.status to 'resolved_deleted'.
13. System creates community or global ban entry for the post author.
14. System creates moderation log with action = 'user_banned'.
15. Report card removed from queue (optimistic).
16. Post removed from all feeds.

### UC-MOD-05: Remove Moderator
1. Community owner navigates to ManageModeratorsScreen.
2. Owner sees list of 3 moderators.
3. Owner wants to remove one moderator (Jane Smith).
4. Owner taps "Remove" button next to Jane's card.
5. System shows confirmation: "Remove Jane Smith as moderator?".
6. Owner confirms removal.
7. System checks network connectivity.
8. System deletes community_moderators record.
9. System creates moderation log with action = 'moderator_removed'.
10. Jane's card removed from list (optimistic).
11. Jane loses access to moderation screens immediately.

### UC-MOD-06: View Moderation Logs
1. Moderator opens EditCommunityScreen.
2. Moderator taps "Moderation Logs" button.
3. System opens ModerationLogsScreen.
4. System fetches logs via `logRepository.getLogs(communityId)`.
5. System displays list sorted by newest first.
6. Each log shows:
   - Color-coded icon (e.g., check-circle for approve_post)
   - Action name (e.g., "Approved Post")
   - Moderator name and timestamp
7. Moderator can scroll through full history.
8. Moderator cannot edit or delete logs (read-only).

### UC-MOD-07: Mark Post for Review
1. Community moderator views approved post in feed.
2. Moderator notices post may need attention.
3. Moderator taps 3-dot menu on PostCard.
4. Moderator sees "Mark for Review" option (flag icon).
5. Moderator taps "Mark for Review".
6. System shows confirmation: "Mark this post for review?".
7. Moderator confirms.
8. System checks network connectivity.
9. System calls `postRepository.markPostForReview(postId)`.
10. System updates post.moderation_status to 'pending'.
11. System creates moderation log with action = 'mark_for_review'.
12. Post removed from public feed.
13. Post appears in PendingContentScreen for team review.

## Test Cases

### Authorization
- **TC-MOD-01**: Verify non-owner cannot access EditCommunityScreen (redirected).
- **TC-MOD-02**: Verify non-moderator cannot access PendingContentScreen (redirected).
- **TC-MOD-03**: Verify non-moderator cannot access ReportedContentScreen (redirected).
- **TC-MOD-04**: Verify non-moderator cannot see "Mark for Review" option.
- **TC-MOD-05**: Verify removed moderator loses access immediately.
- **TC-MOD-06**: Verify only owner can add/remove moderators.
- **TC-MOD-07**: Verify moderators can view but not edit moderation logs.

### Badge Counts
- **TC-MOD-08**: Verify "Pending Content" badge shows correct count.
- **TC-MOD-09**: Verify "Reported Content" badge shows correct count.
- **TC-MOD-10**: Verify badge counts load in parallel (performance).
- **TC-MOD-11**: Verify badge count updates after approving post.
- **TC-MOD-12**: Verify badge count updates after marking report safe.

### Post Moderation
- **TC-MOD-13**: Verify approve changes status to 'approved'.
- **TC-MOD-14**: Verify reject changes status to 'rejected'.
- **TC-MOD-15**: Verify approved post appears in community feed.
- **TC-MOD-16**: Verify rejected post does not appear in feed.
- **TC-MOD-17**: Verify moderation log created for approve/reject.
- **TC-MOD-18**: Verify confirmation dialog appears before approve/reject.

### Moderator Management
- **TC-MOD-19**: Verify adding moderator creates record.
- **TC-MOD-20**: Verify removing moderator deletes record.
- **TC-MOD-21**: Verify duplicate moderator fails (unique constraint).
- **TC-MOD-22**: Verify adding invalid user ID fails gracefully.
- **TC-MOD-23**: Verify moderation log created for add/remove.

### Settings
- **TC-MOD-24**: Verify changing post permission updates community.
- **TC-MOD-25**: Verify moderation log created for settings change.
- **TC-MOD-26**: Verify unsaved changes dialog blocks navigation.
- **TC-MOD-27**: Verify save button only enabled when changes detected.

### Moderation Logs
- **TC-MOD-28**: Verify all 9 action types display with correct icons.
- **TC-MOD-29**: Verify logs sorted by newest first.
- **TC-MOD-30**: Verify logs show moderator name and timestamp.
- **TC-MOD-31**: Verify empty state shows when no logs.

### Network Handling
- **TC-MOD-32**: Verify offline moderation actions show error.
- **TC-MOD-33**: Verify network check before approve/reject.
- **TC-MOD-34**: Verify optimistic updates revert on failure.

## Performance Requirements
- **PR-MOD-01**: Badge counts shall be loaded in parallel using `Promise.all`.
- **PR-MOD-02**: Complex list items shall use `React.memo` to prevent unnecessary re-renders.
- **PR-MOD-03**: Moderation screens shall load within 1 second.
- **PR-MOD-04**: Optimistic UI updates shall be instant (<16ms).

## Related Specifications
- Post Reporting: See `docs/specs/moderation/post-reporting.md`
- User Blocking: See `docs/specs/moderation/user-blocking.md`
- Global Bans: See `docs/specs/moderation/global-bans.md`
- Communities: See `docs/specs/social/communities.md`
- Posts: See `docs/specs/social/posts.md`
- Navigation: See `docs/specs/architecture/navigation.md`
