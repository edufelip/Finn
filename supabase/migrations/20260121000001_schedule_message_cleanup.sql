-- Schedule daily cleanup of old chat messages using pg_cron
-- This will run every day at 2 AM UTC

-- Enable pg_cron extension if not already enabled
-- Note: pg_cron requires superuser privileges and may not be available in all environments
do $$
begin
  create extension if not exists pg_cron;
exception when insufficient_privilege then
  raise notice 'pg_cron extension requires superuser privileges. Please enable it manually or use an alternative scheduling method.';
  raise exception 'Cannot enable pg_cron extension';
when others then
  raise notice 'Error enabling pg_cron: %', sqlerrm;
  raise;
end $$;

-- Schedule the cleanup job
-- This will fail gracefully if pg_cron is not available
do $$
begin
  perform cron.schedule(
    'cleanup-old-chat-messages',     -- Job name
    '0 2 * * *',                      -- Cron schedule: Daily at 2 AM UTC
    $$select public.delete_old_chat_messages();$$  -- SQL command to execute
  );
  raise notice 'Successfully scheduled cleanup-old-chat-messages job';
exception when others then
  raise notice 'Error scheduling cleanup job: %', sqlerrm;
  raise;
end $$;

-- Verify the job was scheduled
select jobname, schedule, command, active 
from cron.job 
where jobname = 'cleanup-old-chat-messages';
