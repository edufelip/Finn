-- Migration: Fix chat_messages RLS policies to match updated chat_threads policies
-- Purpose: Align RLS policies to check participant_a/participant_b instead of chat_members
--
-- Context: The inbox filtering migration (20260121010000) updated chat_threads RLS
-- policies to directly check participant_a/participant_b for better performance and
-- simplicity. However, chat_messages policies were not updated, causing a mismatch.
-- This migration fixes that inconsistency.

-- Drop old chat_messages policies that check chat_members
DROP POLICY IF EXISTS "chat_messages_select_member" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_member" ON public.chat_messages;

-- Policy: Users can view messages in threads they're participants in
CREATE POLICY "chat_messages_select_participant"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
        AND (chat_threads.participant_a = auth.uid() 
             OR chat_threads.participant_b = auth.uid())
    )
  );

-- Policy: Users can insert messages in threads they're participants in
CREATE POLICY "chat_messages_insert_participant"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
        AND (chat_threads.participant_a = auth.uid() 
             OR chat_threads.participant_b = auth.uid())
    )
  );

-- Add helpful comment
COMMENT ON TABLE public.chat_messages IS 
  'Chat messages. RLS policies check chat_threads.participant_a/b for membership.';
