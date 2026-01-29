-- Add user roles for staff/admin moderation access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'staff', 'admin');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Service role can update roles for admin tooling
CREATE POLICY "profiles_update_service"
  ON public.profiles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON COLUMN public.profiles.role IS 'Application-level role: user, staff, admin.';
