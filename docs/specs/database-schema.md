# Database Schema Specification

## Purpose
Provides a mapping between Domain Models and the Supabase PostgreSQL schema, including constraints and triggers.

## Entity Mappings

### 1. Profiles (`public.profiles`)
- **Primary Key**: `id` (UUID, references `auth.users`)
- **Fields**: `name`, `photo_url`, `bio`, `location`, `online_visible`, `notifications_enabled`, `last_seen_at`, `followers_count`, `following_count`.
- **Logic**: `name` falls back to email prefix or ID slice if missing in metadata.
- **Triggers**: `on_auth_user_created` (auto-creates profile from session metadata).

### 2. Communities (`public.communities`)
- **Primary Key**: `id` (BigSerial)
- **Fields**: `title`, `description`, `image_url`, `owner_id`, `topic_id`, `post_permission`.
- **Constraint**: `post_permission` in (`anyone_follows`, `moderated`, `private`).
- **Default**: `post_permission` defaults to `anyone_follows`.

### 3. Posts (`public.posts`)
- **Primary Key**: `id` (BigSerial)
- **Fields**: `content`, `image_url`, `community_id`, `user_id`, `moderation_status`.
- **Constraint**: `moderation_status` in (`pending`, `approved`, `rejected`).
- **Triggers**: `on_post_deleted` (deletes storage assets).

### 4. Comments (`public.comments`)
- **Primary Key**: `id` (BigSerial)
- **Fields**: `content`, `post_id`, `user_id` (Nullable).
- **Referential Integrity**: `user_id` is set to `NULL` on profile deletion, allowing comments to persist.

### 5. Relationships & Interactions
- **Follows (`user_follows`)**: `follower_id` -> `following_id`.
    - **Constraint**: `user_follows_no_self_follow` (follower_id <> following_id).
    - **Automation**: `trg_user_follow_counts` keeps `profiles.followers_count` and `profiles.following_count` in sync.
- **Likes (`likes`)**: `post_id` -> `user_id` (Unique pair).
- **Saved Posts (`saved_posts`)**: `post_id` -> `user_id` (Unique pair).
- **Subscriptions (`subscriptions`)**: `community_id` -> `user_id` (Unique pair).

### 6. Messaging (Direct)
- **Threads (`chat_threads`)**: 
  - `participant_a`, `participant_b` (ordered unique pair, no self)
  - `created_by` (UUID, references the user who initiated the thread)
  - `last_message_at`, `last_message_preview`, `last_message_sender_id`
  - **`request_status`** (TEXT): 'pending' | 'accepted' | 'refused'
  - **`archived_by`** (UUID[]): Array of user IDs who archived this thread
- **Members (`chat_members`)**: `thread_id`, `user_id`, `last_read_at` (seen up to).
- **Messages (`chat_messages`)**: `thread_id`, `sender_id` (non-null), `content`, `created_at`.

**Request Status Logic:**
- New threads default to 'pending' if sender doesn't follow recipient
- Auto-upgraded to 'accepted' if follow relationship exists
- Recipient can accept or refuse pending requests via ChatScreen
- Refused threads are hidden from recipient but remain accessible to sender

**Archive Logic:**
- Users can independently archive threads via `archived_by` array
- Archived threads move to separate "Archived" tab but continue receiving messages
- Un-archiving removes user from `archived_by` array, returns thread to Primary tab

### 7. Moderation
- **Moderators (`community_moderators`)**: 
    - **Primary Key**: `id` (BigSerial)
    - **Fields**: `community_id`, `user_id`, `added_by`, `added_at`
    - **Unique Constraint**: (community_id, user_id) - prevents duplicate moderators
    - **Referential Integrity**: Cascade delete on community deletion, set null on user deletion
- **Logs (`moderation_logs`)**: 
    - **Primary Key**: `id` (BigSerial)
    - **Fields**: `community_id`, `moderator_id`, `action`, `post_id` (nullable), `created_at`
    - **Actions**: `approve_post`, `reject_post`, `mark_for_review`, `delete_post`, `mark_safe`, `moderator_added`, `moderator_removed`, `settings_changed`, `other`
    - **Purpose**: Audit trail for all moderation activities
- **Post Reports (`post_reports`)**: 
    - **Primary Key**: `id` (BigSerial)
    - **Fields**: `post_id`, `user_id`, `reason`, `status`, `created_at`
    - **Constraint**: `reason` must be 15-300 characters
    - **Constraint**: `status` in (`pending`, `reviewed`, `resolved`)
    - **Unique Constraint**: (user_id, post_id) - prevents duplicate reports from same user
    - **Indexes**: post_id, user_id, created_at desc, status
    - **Referential Integrity**: Cascade delete on post/user deletion
- **Community Reports (`community_reports`)**: 
    - **Primary Key**: `id` (BigSerial)
    - **Fields**: `community_id`, `user_id`, `reason`, `created_at`
    - **Constraint**: `reason` must be 15-300 characters
    - **Unique Constraint**: (user_id, community_id) - prevents duplicate reports from same user
    - **Indexes**: community_id, user_id, created_at desc
    - **Referential Integrity**: Cascade delete on community/user deletion
    - **Purpose**: Track reported communities that violate guidelines

### 8. Topics (`public.topics`)
- **Primary Key**: `id` (BigSerial)
- **Fields**: `name`, `label`, `icon`, `tone`.

## RPC Functions

### search_communities
Performs efficient community search with pagination and sorting.

**Signature:**
```sql
search_communities(
  search_text text default '',
  topic_filter bigint default null,
  sort_order text default 'mostFollowed',
  limit_count int default 20,
  offset_count int default 0
)
```

**Returns:** Table with columns:
- `id` (bigint)
- `title` (text)
- `description` (text)
- `image_url` (text)
- `owner_id` (uuid)
- `topic_id` (bigint)
- `created_at` (timestamptz)
- `post_permission` (text)
- `subscribers_count` (bigint)

**Performance:**
- Uses LEFT JOIN on subscriptions for subscriber counts
- Aggregates counts in single query (no N+1 problem)
- Performs sorting at database level
- Supports pagination with LIMIT/OFFSET
- Case-insensitive ILIKE search on title

## Triggers & Automation
- **Follow Notifications**: `trg_notify_follow` creates a notification for the followed user.
- **Follow Counters**: `trg_user_follow_counts` maintains follower/following counts on profiles.
- **Like Notifications**: `trg_notify_like` creates a notification for the post author.
- **Comment Notifications**: `trg_notify_comment` creates a notification for the post author with a 140-character preview.
- **Asset Cleanup**: `delete_user_assets_trigger` invokes an Edge Function after profile deletion.

## Security (RLS)
- **Global Rule**: `enable row level security` on all tables.
- **Privacy Rule**: `profiles` only allows updates where `auth.uid() = id`.
- **Community Rule**: Only owners/moderators can update community settings or post statuses.

## Storage Buckets
- `user-avatars`, `post-images`, `community-images`.
