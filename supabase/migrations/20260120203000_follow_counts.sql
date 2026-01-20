-- Add cached follow counters to profiles and keep them in sync with user_follows.

alter table public.profiles
  add column if not exists followers_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

-- Backfill counts for existing profiles.
update public.profiles p
set followers_count = coalesce(f.cnt, 0)
from (
  select following_id as user_id, count(*) as cnt
  from public.user_follows
  group by following_id
) f
where p.id = f.user_id;

update public.profiles p
set following_count = coalesce(f.cnt, 0)
from (
  select follower_id as user_id, count(*) as cnt
  from public.user_follows
  group by follower_id
) f
where p.id = f.user_id;

create or replace function public.handle_user_follow_counts()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles
      set followers_count = followers_count + 1
      where id = new.following_id;
    update public.profiles
      set following_count = following_count + 1
      where id = new.follower_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles
      set followers_count = greatest(followers_count - 1, 0)
      where id = old.following_id;
    update public.profiles
      set following_count = greatest(following_count - 1, 0)
      where id = old.follower_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_user_follow_counts on public.user_follows;

create trigger trg_user_follow_counts
  after insert or delete on public.user_follows
  for each row execute function public.handle_user_follow_counts();
