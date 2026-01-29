-- Restrict role updates to admins/service role and add admin update policy

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role = 'admin'
  );
$$;

comment on function public.is_admin is 'Checks whether a user has the admin role.';

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    if auth.role() <> 'service_role' and auth.uid() is not null and not public.is_admin(auth.uid()) then
      raise exception 'Only admins can change user roles.';
    end if;
  end if;
  return new;
end;
$$;

comment on function public.prevent_role_change is 'Guards profile role updates to admins/service role.';

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
before update on public.profiles
for each row execute function public.prevent_role_change();

drop policy if exists "profiles_update_admin_roles" on public.profiles;
create policy "profiles_update_admin_roles"
  on public.profiles
  for update
  to authenticated
  using (
    public.is_admin(auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin(auth.uid())
  );
