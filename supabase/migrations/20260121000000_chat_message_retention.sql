-- Chat message 14-day retention policy
-- Messages older than 14 days are automatically deleted

-- Add a function to delete messages older than 14 days
create or replace function public.delete_old_chat_messages()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  -- Delete messages older than 14 days
  with deleted as (
    delete from public.chat_messages
    where created_at < now() - interval '14 days'
    returning thread_id
  )
  select count(*) into deleted_count from deleted;

  -- Update thread previews for affected threads
  -- If all messages were deleted, clear the preview
  update public.chat_threads ct
  set 
    last_message_preview = coalesce(
      (
        select content
        from public.chat_messages cm
        where cm.thread_id = ct.id
        order by cm.created_at desc
        limit 1
      ),
      null
    ),
    last_message_at = (
      select created_at
      from public.chat_messages cm
      where cm.thread_id = ct.id
      order by cm.created_at desc
      limit 1
    )
  where exists (
    select 1
    from public.chat_messages cm
    where cm.thread_id = ct.id
    and cm.created_at >= now() - interval '14 days'
  )
  or not exists (
    select 1
    from public.chat_messages cm
    where cm.thread_id = ct.id
  );

  return deleted_count;
end;
$$;

-- Create an index to optimize the deletion query
create index if not exists idx_chat_messages_created_at
  on public.chat_messages (created_at);

-- Grant execute permission to authenticated users (for manual cleanup if needed)
grant execute on function public.delete_old_chat_messages() to authenticated;

-- Note: Scheduled execution needs to be set up via:
-- 1. Supabase Database Webhooks (cron-like scheduling)
-- 2. Or pg_cron extension (if available)
-- 3. Or Supabase Edge Function with scheduled invocation
-- 
-- Example pg_cron setup (if extension is available):
-- SELECT cron.schedule(
--   'delete-old-chat-messages',
--   '0 2 * * *', -- Run daily at 2 AM UTC
--   $$SELECT public.delete_old_chat_messages();$$
-- );
