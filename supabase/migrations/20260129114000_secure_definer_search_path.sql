-- Harden security definer functions with a fixed search_path
create or replace function public.is_staff_or_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('staff', 'admin')
      and not exists (
        select 1 from public.user_bans ub
        where ub.user_id = uid
      )
  );
$$;

create or replace function public.handle_user_block_report()
returns trigger
language plpgsql
security definer
set search_path = public
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
