-- Notification preferences for profiles

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;

update public.profiles
  set notifications_enabled = coalesce(notifications_enabled, true);
