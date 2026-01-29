# Global User Bans Specification

## Purpose
Enable staff/admin to eject abusive users platform-wide, hiding their profiles and communities and preventing further posting/commenting.

## Functional Requirements
- **FR-GB-01**: Staff/admin (owner) can issue a global ban for a user with an optional reason.
- **FR-GB-02**: Globally banned users cannot create posts or comments.
- **FR-GB-03**: Profiles and communities owned by globally banned users are hidden from other users.
- **FR-GB-04**: Global bans are recorded with who banned the user and when.
- **FR-GB-05**: Global bans can be removed by staff/admin.

## Domain Model
**Location**: `src/domain/models/userBan.ts`
```typescript
export type UserBan = {
  id: number;
  userId: string;
  bannedBy: string;
  reason?: string | null;
  sourcePostId?: number | null;
  createdAt: string;
};
```

## Repository
**Location**: `src/domain/repositories/UserBanRepository.ts`
```typescript
export interface UserBanRepository {
  banUser(userId: string, bannedBy: string, reason?: string | null, sourcePostId?: number | null): Promise<UserBan>;
  unbanUser(userId: string): Promise<void>;
  getBan(userId: string): Promise<UserBan | null>;
  isBanned(userId: string): Promise<boolean>;
}
```

## Database
**Location**: `supabase/migrations/20260128101000_add_user_bans.sql`

**Table**: `user_bans`
- `id` (bigserial, primary key)
- `user_id` (uuid, references profiles.id, cascade delete)
- `banned_by` (uuid, references profiles.id, set null on delete)
- `reason` (text, nullable)
- `source_post_id` (bigint, references posts.id, set null on delete)
- `created_at` (timestamptz, default now())
- **Unique constraint** on (user_id)

**RLS**:
- Staff/admin can insert/delete/select.
- Users can select their own ban record.

## Enforcement Points
- `profiles_select_authenticated`: hides banned profiles from non-staff users.
- `communities_select_authenticated`: hides communities owned by banned users.
- `posts_select_authenticated` / `comments_select_authenticated`: hides content from banned users.
- `posts_insert_own` / `comments_insert_own`: blocks banned users from posting/commenting.

## UI
- Global ban action is available in ReportedContent for community owners and staff/admin.
- Settings → Admin tools allow staff/admin to issue and remove global bans; admins can also adjust roles.
- Banned users are gated to a disabled account screen.

## Use Cases

### UC-GB-01: Global Ban from Reported Content
1. Moderator opens **Reported Content** for a community.
2. Moderator selects a reported post.
3. Moderator taps **Remove & Ban User**.
4. System shows ban scope options.
5. Moderator chooses **Global ban** (staff/admin only).
6. System deletes the post, resolves the report, and creates a `user_bans` entry.
7. Banned user’s profile and communities disappear from other users.

### UC-GB-02: Global Ban from Settings (Admin Tools)
1. Staff/Admin opens **Settings → Admin tools**.
2. Staff/Admin selects **Global ban user**.
3. Staff/Admin enters the target user ID and optional reason.
4. System creates or updates the `user_bans` entry.
5. Banned user is immediately gated to the Banned Account screen.

### UC-GB-03: Unban User
1. Staff/Admin opens **Settings → Admin tools**.
2. Staff/Admin selects **Remove global ban**.
3. Staff/Admin enters the user ID.
4. System deletes the `user_bans` record.
5. User regains access to feeds and profile visibility.

### UC-GB-04: Banned User Access Handling
1. Banned user signs in or relaunches the app.
2. System detects `user_bans` entry.
3. User is routed to the **Banned Account** screen.
4. Feeds, profile, and posting actions remain blocked.

## Related Specs
- User Blocking: `docs/specs/moderation/user-blocking.md`
- Community Moderation: `docs/specs/moderation/community-moderation.md`
- Database Schema: `docs/specs/database-schema.md`
