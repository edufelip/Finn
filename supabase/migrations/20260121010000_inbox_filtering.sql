-- Migration: Add inbox filtering support (message requests and archiving)
-- Purpose: Enable filtering of chat threads by request status and archive state

-- Add request_status column to chat_threads
-- Default to 'accepted' for existing threads
ALTER TABLE public.chat_threads 
  ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'accepted' NOT NULL;

-- Add archived_by column to track which users archived a thread
-- Both participants can independently archive the same thread
ALTER TABLE public.chat_threads 
  ADD COLUMN IF NOT EXISTS archived_by UUID[] DEFAULT '{}' NOT NULL;

-- Add check constraint for request_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_threads_request_status_check'
  ) THEN
    ALTER TABLE public.chat_threads
      ADD CONSTRAINT chat_threads_request_status_check 
      CHECK (request_status IN ('pending', 'accepted', 'refused'));
  END IF;
END $$;

-- Add index for efficient filtering by request status
CREATE INDEX IF NOT EXISTS idx_chat_threads_request_status 
  ON public.chat_threads(request_status);

-- Add index for efficient filtering by archived_by (GIN index for array contains)
CREATE INDEX IF NOT EXISTS idx_chat_threads_archived_by 
  ON public.chat_threads USING GIN(archived_by);

-- Add index for filtering threads by participant (for getThreadsForUser queries)
CREATE INDEX IF NOT EXISTS idx_chat_threads_participant_a 
  ON public.chat_threads(participant_a);

CREATE INDEX IF NOT EXISTS idx_chat_threads_participant_b 
  ON public.chat_threads(participant_b);

-- Function: Auto-set request_status based on follow relationship
-- Called on thread creation to determine if thread should be 'pending' or 'accepted'
CREATE OR REPLACE FUNCTION auto_set_chat_request_status()
RETURNS TRIGGER AS $$
DECLARE
  mutual_follow BOOLEAN;
BEGIN
  -- Check if participants follow each other
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE (follower_id = NEW.participant_a AND following_id = NEW.participant_b)
       OR (follower_id = NEW.participant_b AND following_id = NEW.participant_a)
  ) INTO mutual_follow;

  -- If either participant follows the other, auto-accept
  -- Otherwise, set to pending (creator is sending a request)
  IF mutual_follow THEN
    NEW.request_status := 'accepted';
  ELSE
    NEW.request_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-set request_status on new thread creation
DROP TRIGGER IF EXISTS trg_auto_set_chat_request_status ON public.chat_threads;

CREATE TRIGGER trg_auto_set_chat_request_status
  BEFORE INSERT ON public.chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_chat_request_status();

-- Function: Auto-upgrade pending threads to accepted when follow relationship is created
-- If User A sends a pending request to User B, and later User B follows User A,
-- the thread should automatically be upgraded to 'accepted'
CREATE OR REPLACE FUNCTION auto_upgrade_pending_threads()
RETURNS TRIGGER AS $$
BEGIN
  -- When a follow relationship is created, check for pending threads
  -- between these two users and upgrade them to 'accepted'
  UPDATE public.chat_threads
  SET request_status = 'accepted'
  WHERE request_status = 'pending'
    AND (
      (participant_a = NEW.follower_id AND participant_b = NEW.following_id)
      OR
      (participant_a = NEW.following_id AND participant_b = NEW.follower_id)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-upgrade pending threads when follow relationship is created
DROP TRIGGER IF EXISTS trg_auto_upgrade_pending_threads ON public.user_follows;

CREATE TRIGGER trg_auto_upgrade_pending_threads
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION auto_upgrade_pending_threads();

-- Update RLS policies for chat_threads to respect request_status and archived_by

-- Policy: Users can view threads they're participants in (regardless of status)
DROP POLICY IF EXISTS "chat_threads_select_participant" ON public.chat_threads;

CREATE POLICY "chat_threads_select_participant"
  ON public.chat_threads
  FOR SELECT
  USING (
    auth.uid() = participant_a 
    OR auth.uid() = participant_b
  );

-- Policy: Users can insert threads (status will be auto-set by trigger)
DROP POLICY IF EXISTS "chat_threads_insert_participant" ON public.chat_threads;

CREATE POLICY "chat_threads_insert_participant"
  ON public.chat_threads
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_a 
    OR auth.uid() = participant_b
  );

-- Policy: Users can update threads they're participants in
-- (for accepting/refusing requests and archiving)
DROP POLICY IF EXISTS "chat_threads_update_participant" ON public.chat_threads;

CREATE POLICY "chat_threads_update_participant"
  ON public.chat_threads
  FOR UPDATE
  USING (
    auth.uid() = participant_a 
    OR auth.uid() = participant_b
  )
  WITH CHECK (
    auth.uid() = participant_a 
    OR auth.uid() = participant_b
  );

-- Add helpful comment
COMMENT ON COLUMN public.chat_threads.request_status IS 
  'Message request status: pending (awaiting acceptance), accepted (can chat), refused (declined by recipient)';

COMMENT ON COLUMN public.chat_threads.archived_by IS 
  'Array of user IDs who archived this thread. Both participants can independently archive.';
