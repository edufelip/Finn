-- Track sender of latest message for accurate unread badges.

alter table public.chat_threads
  add column if not exists last_message_sender_id uuid references public.profiles(id) on delete set null;

-- Backfill sender from latest message if available.
update public.chat_threads ct
set last_message_sender_id = (
  select cm.sender_id
  from public.chat_messages cm
  where cm.thread_id = ct.id
  order by cm.created_at desc
  limit 1
)
where last_message_sender_id is null;

-- Keep sender in sync during retention cleanup.
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
    ),
    last_message_sender_id = (
      select sender_id
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
