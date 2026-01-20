-- Initializes Finn database schema for remote Supabase projects.
-- Keep this file in sync with supabase/migrations/20260116190000_init.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  online_visible boolean not null default true,
  notifications_enabled boolean not null default true,
  last_seen_at timestamptz,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  bio text,
  location text
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, photo_url, created_at, last_seen_at)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      left(new.id::text, 8)
    ),
    coalesce(
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      nullif(new.raw_user_meta_data->>'picture', '')
    ),
    new.created_at,
    new.created_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (id, name, photo_url, created_at, last_seen_at)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'name', ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(u.email, '@', 1), ''),
    left(u.id::text, 8)
  ),
  coalesce(
    nullif(u.raw_user_meta_data->>'avatar_url', ''),
    nullif(u.raw_user_meta_data->>'picture', '')
  ),
  u.created_at,
  u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

create table if not exists public.communities (
  id bigserial primary key,
  title text not null,
  description text not null,
  image_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.communities enable row level security;

create policy "communities_select_authenticated"
  on public.communities
  for select
  to authenticated
  using (true);

create policy "communities_insert_own"
  on public.communities
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "communities_update_own"
  on public.communities
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "communities_delete_own"
  on public.communities
  for delete
  to authenticated
  using (auth.uid() = owner_id);

create table if not exists public.posts (
  id bigserial primary key,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  community_id bigint not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade
);

create index if not exists idx_posts_community_id on public.posts(community_id);
create index if not exists idx_posts_user_id on public.posts(user_id);

alter table public.posts enable row level security;

create policy "posts_select_authenticated"
  on public.posts
  for select
  to authenticated
  using (true);

create policy "posts_insert_own"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.comments (
  id bigserial primary key,
  content text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_post_id on public.comments(post_id);

alter table public.comments enable row level security;

create policy "comments_select_authenticated"
  on public.comments
  for select
  to authenticated
  using (true);

create policy "comments_insert_own"
  on public.comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "comments_update_own"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.saved_posts (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_saved_posts_user_id on public.saved_posts(user_id);
create index if not exists idx_saved_posts_post_id on public.saved_posts(post_id);

alter table public.saved_posts enable row level security;

create policy "saved_posts_select_authenticated"
  on public.saved_posts
  for select
  to authenticated
  using (true);

create policy "saved_posts_insert_own"
  on public.saved_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "saved_posts_delete_own"
  on public.saved_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  community_id bigint not null references public.communities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, community_id)
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_authenticated"
  on public.subscriptions
  for select
  to authenticated
  using (true);

create policy "subscriptions_insert_own"
  on public.subscriptions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "subscriptions_delete_own"
  on public.subscriptions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.push_tokens (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null,
  env text not null default 'prod',
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_env on public.push_tokens(env);
create index if not exists idx_push_tokens_user_env on public.push_tokens(user_id, env);

comment on column public.push_tokens.env is 'Environment: dev or prod';

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own"
  on public.push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "push_tokens_insert_own"
  on public.push_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "push_tokens_update_own"
  on public.push_tokens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_tokens_delete_own"
  on public.push_tokens
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.user_follows (
  id bigserial primary key,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

create index if not exists idx_user_follows_follower_id on public.user_follows(follower_id);
create index if not exists idx_user_follows_following_id on public.user_follows(following_id);

alter table public.user_follows enable row level security;

create policy "user_follows_select_authenticated"
  on public.user_follows
  for select
  to authenticated
  using (true);

create policy "user_follows_insert_own"
  on public.user_follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "user_follows_delete_own"
  on public.user_follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text,
  constraint chat_threads_no_self check (participant_a <> participant_b),
  unique (participant_a, participant_b)
);

create table if not exists public.chat_members (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id bigserial primary key,
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_thread_created
  on public.chat_messages (thread_id, created_at desc);

alter table public.chat_threads enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_threads_select_member"
  on public.chat_threads
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_threads.id
        and chat_members.user_id = auth.uid()
    )
  );

create policy "chat_threads_insert_creator"
  on public.chat_threads
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and auth.uid() in (participant_a, participant_b)
  );

create policy "chat_threads_update_member"
  on public.chat_threads
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_threads.id
        and chat_members.user_id = auth.uid()
    )
  );

create policy "chat_members_select_self"
  on public.chat_members
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "chat_members_insert_creator"
  on public.chat_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or auth.uid() = (
      select created_by
      from public.chat_threads
      where chat_threads.id = thread_id
    )
  );

create policy "chat_members_update_self"
  on public.chat_members
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "chat_messages_select_member"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_messages.thread_id
        and chat_members.user_id = auth.uid()
    )
  );

create policy "chat_messages_insert_member"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_messages.thread_id
        and chat_members.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values
  ('community-images', 'community-images', true),
  ('profile-images', 'profile-images', true),
  ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "storage_read_community_images_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'community-images');

create policy "storage_read_profile_images_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profile-images');

create policy "storage_read_post_images_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'post-images');

create policy "storage_insert_community_images_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'community-images');

create policy "storage_insert_profile_images_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'profile-images');

create policy "storage_insert_post_images_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'post-images');

create policy "storage_delete_community_images_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'community-images' and owner = auth.uid());

create policy "storage_delete_profile_images_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'profile-images' and owner = auth.uid());

create policy "storage_delete_post_images_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'post-images' and owner = auth.uid());

create or replace function public.delete_storage_object(bucket text, object_path text)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if object_path is null or object_path = '' then
    return;
  end if;
  if object_path like 'http%' then
    return;
  end if;

  delete from storage.objects
  where bucket_id = bucket
    and name = object_path;
end;
$$;

create or replace function public.handle_post_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  perform public.delete_storage_object('post-images', old.image_url);
  return old;
end;
$$;

drop trigger if exists on_post_deleted on public.posts;
create trigger on_post_deleted
after delete on public.posts
for each row execute procedure public.handle_post_delete();

create or replace function public.handle_community_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  perform public.delete_storage_object('community-images', old.image_url);
  return old;
end;
$$;

drop trigger if exists on_community_deleted on public.communities;
create trigger on_community_deleted
after delete on public.communities
for each row execute procedure public.handle_community_delete();

create or replace function public.handle_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  perform public.delete_storage_object('profile-images', old.photo_url);
  return old;
end;
$$;

drop trigger if exists on_profile_deleted on public.profiles;
create trigger on_profile_deleted
after delete on public.profiles
for each row execute procedure public.handle_profile_delete();

create or replace function public.handle_auth_user_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where owner = old.id
    and bucket_id in ('community-images', 'profile-images', 'post-images');
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
after delete on auth.users
for each row execute procedure public.handle_auth_user_delete();


-- restore_missing_features
create extension if not exists pg_net;

alter table public.profiles
  add column if not exists online_visible boolean,
  add column if not exists last_seen_at timestamptz,
  add column if not exists notifications_enabled boolean,
  add column if not exists followers_count integer,
  add column if not exists following_count integer;

alter table public.profiles
  alter column online_visible set default true,
  alter column notifications_enabled set default true,
  alter column last_seen_at set default now(),
  alter column followers_count set default 0,
  alter column following_count set default 0;

update public.profiles
  set last_seen_at = coalesce(last_seen_at, created_at, now());

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

alter table public.profiles
  alter column last_seen_at set not null,
  alter column online_visible set not null,
  alter column notifications_enabled set not null,
  alter column followers_count set not null,
  alter column following_count set not null;

create index if not exists idx_profiles_last_seen_at on public.profiles (last_seen_at desc);

alter table public.comments
  alter column user_id drop not null;

alter table public.comments
  drop constraint if exists comments_user_id_fkey;

alter table public.comments
  add constraint comments_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_follows_no_self_follow'
      and conrelid = 'public.user_follows'::regclass
  ) then
    alter table public.user_follows
      add constraint user_follows_no_self_follow
      check (follower_id <> following_id);
  end if;
end
$$;

create or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
begin
  recipient := new.following_id;

  if recipient is null or recipient = new.follower_id then
    return new;
  end if;

  insert into public.notifications (recipient_id, actor_id, type)
  values (recipient, new.follower_id, 'follow');

  return new;
end;
$$;

create or replace function public.create_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
begin
  select user_id into recipient from public.posts where id = new.post_id;

  if recipient is null or recipient = new.user_id then
    return new;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, post_id)
  values (recipient, new.user_id, 'post_like', new.post_id);

  return new;
end;
$$;

create or replace function public.create_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  preview text;
begin
  select user_id into recipient from public.posts where id = new.post_id;

  if recipient is null or recipient = new.user_id then
    return new;
  end if;

  preview := left(new.content, 140);

  insert into public.notifications (recipient_id, actor_id, type, post_id, metadata)
  values (recipient, new.user_id, 'post_comment', new.post_id, jsonb_build_object('comment_preview', preview));

  return new;
end;
$$;

drop trigger if exists trg_notify_follow on public.user_follows;
create trigger trg_notify_follow
  after insert on public.user_follows
  for each row execute function public.create_follow_notification();

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

drop trigger if exists trg_notify_like on public.likes;
create trigger trg_notify_like
  after insert on public.likes
  for each row execute function public.create_like_notification();

drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment
  after insert on public.comments
  for each row execute function public.create_comment_notification();

create index if not exists idx_notifications_recipient_unread
  on public.notifications (recipient_id, read_at);

create or replace function public.trigger_delete_user_assets()
returns trigger
language plpgsql
security definer
as $$
declare
  endpoint text;
  anon_key text;
  payload jsonb;
begin
  endpoint := current_setting('app.settings.delete_user_assets_url', true);
  anon_key := current_setting('app.settings.anon_key', true);

  if endpoint is null or endpoint = '' then
    return old;
  end if;

  payload := jsonb_build_object('userId', old.id);

  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(anon_key, '')
    ),
    body := payload
  );

  return old;
end;
$$;

drop trigger if exists delete_user_assets_trigger on public.profiles;
create trigger delete_user_assets_trigger
after delete on public.profiles
for each row
execute function public.trigger_delete_user_assets();
