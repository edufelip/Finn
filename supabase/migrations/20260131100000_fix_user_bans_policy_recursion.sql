-- Fix recursive RLS on user_bans by removing self-referential checks

DROP POLICY IF EXISTS "user_bans_select_authenticated" ON public.user_bans;
CREATE POLICY "user_bans_select_authenticated"
  ON public.user_bans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_staff_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "user_bans_insert_staff" ON public.user_bans;
CREATE POLICY "user_bans_insert_staff"
  ON public.user_bans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "user_bans_delete_staff" ON public.user_bans;
CREATE POLICY "user_bans_delete_staff"
  ON public.user_bans
  FOR DELETE
  TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
  );
