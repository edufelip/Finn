create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  online_visible boolean not null default true,
  notifications_enabled boolean not null default true,
  last_seen_at timestamptz,
  bio text,
  location text
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
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

create table if not exists public.communities (
  id bigserial primary key,
  title text not null,
  description text not null,
  image_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.communities enable row level security;

drop policy if exists "communities_select_authenticated" on public.communities;
create policy "communities_select_authenticated"
  on public.communities
  for select
  to authenticated
  using (true);

drop policy if exists "communities_insert_own" on public.communities;
create policy "communities_insert_own"
  on public.communities
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "communities_update_own" on public.communities;
create policy "communities_update_own"
  on public.communities
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "communities_delete_own" on public.communities;
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

drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
  on public.posts
  for select
  to authenticated
  using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
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

drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated"
  on public.comments
  for select
  to authenticated
  using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.comments;
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

drop policy if exists "saved_posts_select_authenticated" on public.saved_posts;
create policy "saved_posts_select_authenticated"
  on public.saved_posts
  for select
  to authenticated
  using (true);

drop policy if exists "saved_posts_insert_own" on public.saved_posts;
create policy "saved_posts_insert_own"
  on public.saved_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "saved_posts_delete_own" on public.saved_posts;
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

drop policy if exists "subscriptions_select_authenticated" on public.subscriptions;
create policy "subscriptions_select_authenticated"
  on public.subscriptions
  for select
  to authenticated
  using (true);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_delete_own" on public.subscriptions;
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

drop policy if exists "push_tokens_select_own" on public.push_tokens;
create policy "push_tokens_select_own"
  on public.push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "push_tokens_insert_own" on public.push_tokens;
create policy "push_tokens_insert_own"
  on public.push_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens_update_own" on public.push_tokens;
create policy "push_tokens_update_own"
  on public.push_tokens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens_delete_own" on public.push_tokens;
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

drop policy if exists "user_follows_select_authenticated" on public.user_follows;
create policy "user_follows_select_authenticated"
  on public.user_follows
  for select
  to authenticated
  using (true);

drop policy if exists "user_follows_insert_own" on public.user_follows;
create policy "user_follows_insert_own"
  on public.user_follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "user_follows_delete_own" on public.user_follows;
create policy "user_follows_delete_own"
  on public.user_follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

insert into storage.buckets (id, name, public)
values
  ('community-images', 'community-images', true),
  ('profile-images', 'profile-images', true),
  ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "storage_read_community_images_public" on storage.objects;
create policy "storage_read_community_images_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'community-images');

drop policy if exists "storage_read_profile_images_public" on storage.objects;
create policy "storage_read_profile_images_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profile-images');

drop policy if exists "storage_read_post_images_public" on storage.objects;
create policy "storage_read_post_images_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'post-images');

drop policy if exists "storage_insert_community_images_authenticated" on storage.objects;
create policy "storage_insert_community_images_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'community-images');

drop policy if exists "storage_insert_profile_images_authenticated" on storage.objects;
create policy "storage_insert_profile_images_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'profile-images');

drop policy if exists "storage_insert_post_images_authenticated" on storage.objects;
create policy "storage_insert_post_images_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'post-images');

drop policy if exists "storage_delete_community_images_owner" on storage.objects;
create policy "storage_delete_community_images_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'community-images' and owner = auth.uid());

drop policy if exists "storage_delete_profile_images_owner" on storage.objects;
create policy "storage_delete_profile_images_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'profile-images' and owner = auth.uid());

drop policy if exists "storage_delete_post_images_owner" on storage.objects;
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
