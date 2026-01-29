-- Community bans for enforcing ejections after objectionable content
create table if not exists public.community_bans (
  id bigserial primary key,
  community_id bigint not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid not null references public.profiles(id) on delete set null,
  reason text,
  source_post_id bigint references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create index if not exists idx_community_bans_community_id on public.community_bans(community_id);
create index if not exists idx_community_bans_user_id on public.community_bans(user_id);
create index if not exists idx_community_bans_created_at on public.community_bans(created_at desc);

alter table public.community_bans enable row level security;

-- Moderators/owners can view bans for their community
create policy "community_bans_select_moderators"
  on public.community_bans
  for select
  to authenticated
  using (public.is_community_moderator(community_id, auth.uid()));

-- Moderators/owners can add bans
create policy "community_bans_insert_moderators"
  on public.community_bans
  for insert
  to authenticated
  with check (
    public.is_community_moderator(community_id, auth.uid())
    and auth.uid() = banned_by
  );

-- Moderators/owners can remove bans
create policy "community_bans_delete_moderators"
  on public.community_bans
  for delete
  to authenticated
  using (public.is_community_moderator(community_id, auth.uid()));

-- Service role can view all bans
create policy "community_bans_select_service"
  on public.community_bans
  for select
  to service_role
  using (true);

-- Update posts policies to hide content from banned users and prevent posting

drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
  on public.posts
  for select
  to authenticated
  using (
    (
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
    )
    and not exists (
      select 1 from public.community_bans cb
      where cb.community_id = posts.community_id and cb.user_id = posts.user_id
    )
  );

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.community_bans cb
      where cb.community_id = posts.community_id and cb.user_id = auth.uid()
    )
  );

-- Allow moderators/owners to delete posts (needed for report resolution)
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts
  for delete
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

-- Prevent banned users from commenting and hide their comments

drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated"
  on public.comments
  for select
  to authenticated
  using (
    not exists (
      select 1
      from public.community_bans cb
      inner join public.posts p on p.id = comments.post_id
      where cb.community_id = p.community_id and cb.user_id = comments.user_id
    )
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
      from public.community_bans cb
      inner join public.posts p on p.id = comments.post_id
      where cb.community_id = p.community_id and cb.user_id = auth.uid()
    )
  );

comment on table public.community_bans is 'Tracks users removed from communities due to objectionable content.';
