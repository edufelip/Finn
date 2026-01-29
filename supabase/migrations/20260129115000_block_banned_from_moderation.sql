-- Ensure globally banned users cannot access moderation APIs

-- User bans: prevent banned staff/admin from acting on bans, but allow users to read their own ban
DROP POLICY IF EXISTS "user_bans_select_authenticated" ON public.user_bans;
CREATE POLICY "user_bans_select_authenticated"
  ON public.user_bans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    or (
      public.is_staff_or_admin(auth.uid())
      and not exists (
        select 1 from public.user_bans ub
        where ub.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "user_bans_insert_staff" ON public.user_bans;
CREATE POLICY "user_bans_insert_staff"
  ON public.user_bans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff_or_admin(auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_bans_delete_staff" ON public.user_bans;
CREATE POLICY "user_bans_delete_staff"
  ON public.user_bans
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

-- Community bans: block banned users from viewing or managing community bans
DROP POLICY IF EXISTS "community_bans_select_moderators" ON public.community_bans;
CREATE POLICY "community_bans_select_moderators"
  ON public.community_bans
  FOR SELECT
  TO authenticated
  USING (
    public.is_community_moderator(community_id, auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_bans_insert_moderators" ON public.community_bans;
CREATE POLICY "community_bans_insert_moderators"
  ON public.community_bans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_community_moderator(community_id, auth.uid())
    and auth.uid() = banned_by
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_bans_delete_moderators" ON public.community_bans;
CREATE POLICY "community_bans_delete_moderators"
  ON public.community_bans
  FOR DELETE
  TO authenticated
  USING (
    public.is_community_moderator(community_id, auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

-- Post reports: block banned users from moderation access
DROP POLICY IF EXISTS "Users can view their own reports" ON public.post_reports;
CREATE POLICY "Users can view their own reports"
  ON public.post_reports
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
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
    )
  );

DROP POLICY IF EXISTS "moderation_can_update_reports" ON public.post_reports;
CREATE POLICY "moderation_can_update_reports"
  ON public.post_reports
  FOR UPDATE
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
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
    )
  );

-- Moderation logs: block banned users from moderation access
DROP POLICY IF EXISTS "moderation_logs_select_moderators" ON public.moderation_logs;
CREATE POLICY "moderation_logs_select_moderators"
  ON public.moderation_logs
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or exists (
        select 1 from public.communities c
        where c.id = community_id and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.community_moderators cm
        where cm.community_id = moderation_logs.community_id and cm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "moderation_logs_insert_moderators" ON public.moderation_logs;
CREATE POLICY "moderation_logs_insert_moderators"
  ON public.moderation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      public.is_staff_or_admin(auth.uid())
      or exists (
        select 1 from public.communities c
        where c.id = community_id and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.community_moderators cm
        where cm.community_id = moderation_logs.community_id and cm.user_id = auth.uid()
      )
    )
  );

-- Community reports: block banned users from moderation access
DROP POLICY IF EXISTS "Users can view their own community reports" ON public.community_reports;
CREATE POLICY "Users can view their own community reports"
  ON public.community_reports
  FOR SELECT
  TO authenticated
  USING (
    not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
    and (
      auth.uid() = user_id
      or public.is_staff_or_admin(auth.uid())
    )
  );
