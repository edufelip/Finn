# Database Schema Specification

## Purpose
Provides a mapping between Domain Models and the Supabase PostgreSQL schema, including constraints and triggers.

## Entity Mappings

### 1. Profiles (`public.profiles`)
- **Primary Key**: `id` (UUID, references `auth.users`)
- **Fields**: `name`, `photo_url`, `bio`, `location`, `online_visible`, `notifications_enabled`, `last_seen_at`.
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
- **Likes (`likes`)**: `post_id` -> `user_id` (Unique pair).
- **Saved Posts (`saved_posts`)**: `post_id` -> `user_id` (Unique pair).
- **Subscriptions (`subscriptions`)**: `community_id` -> `user_id` (Unique pair).

### 6. Moderation
- **Moderators (`community_moderators`)**: `community_id` -> `user_id`.
- **Logs (`moderation_logs`)**: Tracks `action` by `moderator_id`.
    - **Actions**: `approve_post`, `reject_post`, `mark_for_review`, `delete_post`, `mark_safe`, `moderator_added`, `moderator_removed`, `settings_changed`.
- **Reports (`post_reports`)**: `post_id`, `user_id`, `reason`, `status`.

### 7. Topics (`public.topics`)
- **Primary Key**: `id` (BigSerial)
- **Fields**: `name`, `label`, `icon`, `tone`.

## Triggers & Automation
- **Follow Notifications**: `trg_notify_follow` creates a notification for the followed user.
- **Like Notifications**: `trg_notify_like` creates a notification for the post author.
- **Comment Notifications**: `trg_notify_comment` creates a notification for the post author with a 140-character preview.
- **Asset Cleanup**: `delete_user_assets_trigger` invokes an Edge Function after profile deletion.

## Security (RLS)
- **Global Rule**: `enable row level security` on all tables.
- **Privacy Rule**: `profiles` only allows updates where `auth.uid() = id`.
- **Community Rule**: Only owners/moderators can update community settings or post statuses.

## Storage Buckets
- `user-avatars`, `post-images`, `community-images`.