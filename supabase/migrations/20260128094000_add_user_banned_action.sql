-- Allow user_banned action in moderation logs
alter table public.moderation_logs
  drop constraint if exists moderation_logs_action_check;

alter table public.moderation_logs
  add constraint moderation_logs_action_check
  check (action in (
    'approve_post',
    'reject_post',
    'mark_for_review',
    'delete_post',
    'mark_safe',
    'moderator_added',
    'moderator_removed',
    'settings_changed',
    'user_banned'
  ));
