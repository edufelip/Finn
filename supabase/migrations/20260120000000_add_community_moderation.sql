-- Add community moderation system
-- This migration adds:
-- 1. community_moderators table for tracking moderators
-- 2. post_permission column to communities table
-- 3. moderation_status column to posts table
-- 4. moderation_logs table for audit trail
-- 5. status column to post_reports table
-- 6. Helper function to check if user is moderator/creator

-- 1. Create community_moderators table
create table if not exists public.community_moderators (
  id bigserial primary key,
  community_id bigint not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create index if not exists idx_community_moderators_community_id on public.community_moderators(community_id);
create index if not exists idx_community_moderators_user_id on public.community_moderators(user_id);

alter table public.community_moderators enable row level security;

-- Policies: Anyone authenticated can view moderators
drop policy if exists "community_moderators_select_authenticated" on public.community_moderators;
create policy "community_moderators_select_authenticated"
  on public.community_moderators
  for select
  to authenticated
  using (true);

-- Policies: Only community owner can add moderators
drop policy if exists "community_moderators_insert_owner" on public.community_moderators;
create policy "community_moderators_insert_owner"
  on public.community_moderators
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.communities
      where id = community_id and owner_id = auth.uid()
    )
  );

-- Policies: Only community owner can remove moderators
drop policy if exists "community_moderators_delete_owner" on public.community_moderators;
create policy "community_moderators_delete_owner"
  on public.community_moderators
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.communities
      where id = community_id and owner_id = auth.uid()
    )
  );

-- 2. Add post_permission column to communities
alter table public.communities 
add column if not exists post_permission text not null default 'anyone_follows' 
check (post_permission in ('anyone_follows', 'moderated', 'private'));

create index if not exists idx_communities_post_permission on public.communities(post_permission);

-- 3. Add moderation_status column to posts
alter table public.posts 
add column if not exists moderation_status text not null default 'approved'
check (moderation_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_posts_moderation_status on public.posts(moderation_status);
create index if not exists idx_posts_community_moderation on public.posts(community_id, moderation_status);

-- Update RLS policies for posts to handle moderation
-- Regular users can only see approved posts
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
  on public.posts
  for select
  to authenticated
  using (
    moderation_status = 'approved'
    or user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.community_moderators cm
      where cm.community_id = posts.community_id and cm.user_id = auth.uid()
    )
  );

-- 4. Create moderation_logs table
create table if not exists public.moderation_logs (
  id bigserial primary key,
  community_id bigint not null references public.communities(id) on delete cascade,
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  post_id bigint references public.posts(id) on delete set null,
  action text not null check (action in ('approve_post', 'reject_post', 'mark_for_review', 'delete_post', 'mark_safe')),
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_logs_community_id on public.moderation_logs(community_id);
create index if not exists idx_moderation_logs_created_at on public.moderation_logs(created_at desc);
create index if not exists idx_moderation_logs_post_id on public.moderation_logs(post_id);

alter table public.moderation_logs enable row level security;

-- Policies: Only moderators/creators can view logs
drop policy if exists "moderation_logs_select_moderators" on public.moderation_logs;
create policy "moderation_logs_select_moderators"
  on public.moderation_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.community_moderators cm
      where cm.community_id = moderation_logs.community_id and cm.user_id = auth.uid()
    )
  );

-- Policies: Only moderators/creators can insert logs
drop policy if exists "moderation_logs_insert_moderators" on public.moderation_logs;
create policy "moderation_logs_insert_moderators"
  on public.moderation_logs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.community_moderators cm
      where cm.community_id = moderation_logs.community_id and cm.user_id = auth.uid()
    )
  );

-- 5. Add status column to post_reports
alter table public.post_reports 
add column if not exists status text not null default 'pending'
check (status in ('pending', 'resolved_deleted', 'resolved_safe'));

create index if not exists idx_post_reports_status on public.post_reports(status);

-- Update post_reports RLS to allow moderators/creators to view reports for their communities
drop policy if exists "Users can view their own reports" on public.post_reports;
create policy "Users can view their own reports"
  on public.post_reports
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.posts p
      inner join public.communities c on c.id = p.community_id
      where p.id = post_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.posts p
      inner join public.community_moderators cm on cm.community_id = p.community_id
      where p.id = post_id and cm.user_id = auth.uid()
    )
  );

-- Policy: Moderators/creators can update report status
drop policy if exists "moderation_can_update_reports" on public.post_reports;
create policy "moderation_can_update_reports"
  on public.post_reports
  for update
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      inner join public.communities c on c.id = p.community_id
      where p.id = post_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.posts p
      inner join public.community_moderators cm on cm.community_id = p.community_id
      where p.id = post_id and cm.user_id = auth.uid()
    )
  );

-- 6. Helper function to check if user is moderator or creator
create or replace function public.is_community_moderator(p_community_id bigint, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.community_moderators 
    where community_id = p_community_id and user_id = p_user_id
  ) or exists (
    select 1 from public.communities
    where id = p_community_id and owner_id = p_user_id
  );
$$;

-- Policy: Moderators/creators can update post moderation_status
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.community_moderators cm
      where cm.community_id = posts.community_id and cm.user_id = auth.uid()
    )
  );

-- Comment for documentation
comment on table public.community_moderators is 'Tracks users who have moderation privileges for communities';
comment on table public.moderation_logs is 'Audit trail of all moderation actions taken by moderators and community creators';
comment on column public.communities.post_permission is 'Controls who can post: anyone_follows, moderated (requires approval), or private (mods/creator only)';
comment on column public.posts.moderation_status is 'Tracks whether post is pending review, approved, or rejected';
comment on column public.post_reports.status is 'Tracks resolution status of reported content';
