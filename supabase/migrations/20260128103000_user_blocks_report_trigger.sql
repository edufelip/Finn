-- Auto-create post report when a user blocks someone (notifies moderation inbox)
create or replace function public.handle_user_block_report()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.source_post_id is not null then
    insert into public.post_reports (post_id, user_id, reason)
    values (new.source_post_id, new.blocker_id, new.reason)
    on conflict (user_id, post_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_user_block_report on public.user_blocks;
create trigger on_user_block_report
  after insert on public.user_blocks
  for each row
  execute function public.handle_user_block_report();
