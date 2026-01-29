-- Update RLS policies to enforce global user bans and staff/admin access

-- Profiles: hide globally banned users from others
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      auth.uid() = id
      or public.is_staff_or_admin(auth.uid())
      or not exists (
        select 1 from public.user_bans ub
        where ub.user_id = profiles.id
      )
    )
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

-- Communities: hide communities owned by globally banned users
DROP POLICY IF EXISTS "communities_select_authenticated" ON public.communities;
CREATE POLICY "communities_select_authenticated"
  ON public.communities
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or not exists (
        select 1 from public.user_bans ub
        where ub.user_id = communities.owner_id
      )
    )
  );

DROP POLICY IF EXISTS "communities_insert_own" ON public.communities;
CREATE POLICY "communities_insert_own"
  ON public.communities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "communities_update_own" ON public.communities;
CREATE POLICY "communities_update_own"
  ON public.communities
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "communities_delete_own" ON public.communities;
CREATE POLICY "communities_delete_own"
  ON public.communities
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

-- Posts: restrict updates for globally banned users and allow staff/admin
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or auth.uid() = user_id
      or exists (
        select 1 from public.communities c
        where c.id = community_id and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.community_moderators cm
        where cm.community_id = posts.community_id and cm.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

-- Posts: hide posts from globally banned users and block banned viewers
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
CREATE POLICY "posts_select_authenticated"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or (
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
        and not exists (
          select 1 from public.user_bans ub
          where ub.user_id = posts.user_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and not exists (
      select 1 from public.community_bans cb
      where cb.community_id = posts.community_id and cb.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
CREATE POLICY "posts_delete_own"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or auth.uid() = user_id
      or exists (
        select 1 from public.communities c
        where c.id = community_id and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.community_moderators cm
        where cm.community_id = posts.community_id and cm.user_id = auth.uid()
      )
    )
  );

-- Comments: hide comments from globally banned users and block banned viewers
DROP POLICY IF EXISTS "comments_select_authenticated" ON public.comments;
CREATE POLICY "comments_select_authenticated"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or (
        not exists (
          select 1
          from public.community_bans cb
          inner join public.posts p on p.id = comments.post_id
          where cb.community_id = p.community_id and cb.user_id = comments.user_id
        )
        and not exists (
          select 1 from public.user_bans ub
          where ub.user_id = comments.user_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and not exists (
      select 1
      from public.community_bans cb
      inner join public.posts p on p.id = comments.post_id
      where cb.community_id = p.community_id and cb.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

-- Post reports: allow staff/admin to view/update
DROP POLICY IF EXISTS "Users can view their own reports" ON public.post_reports;
CREATE POLICY "Users can view their own reports"
  ON public.post_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    or public.is_staff_or_admin(auth.uid())
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

DROP POLICY IF EXISTS "moderation_can_update_reports" ON public.post_reports;
CREATE POLICY "moderation_can_update_reports"
  ON public.post_reports
  FOR UPDATE
  TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
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

-- Moderation logs: allow staff/admin to view/create
DROP POLICY IF EXISTS "moderation_logs_select_moderators" ON public.moderation_logs;
CREATE POLICY "moderation_logs_select_moderators"
  ON public.moderation_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.community_moderators cm
      where cm.community_id = moderation_logs.community_id and cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "moderation_logs_insert_moderators" ON public.moderation_logs;
CREATE POLICY "moderation_logs_insert_moderators"
  ON public.moderation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff_or_admin(auth.uid())
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.community_moderators cm
      where cm.community_id = moderation_logs.community_id and cm.user_id = auth.uid()
    )
  );

-- Community reports: allow staff/admin to view
DROP POLICY IF EXISTS "Users can view their own community reports" ON public.community_reports;
CREATE POLICY "Users can view their own community reports"
  ON public.community_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    or public.is_staff_or_admin(auth.uid())
  );
