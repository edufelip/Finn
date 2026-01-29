-- Allow ban actors to be nulled when their profile is deleted
alter table public.user_bans
  alter column banned_by drop not null;

alter table public.community_bans
  alter column banned_by drop not null;
