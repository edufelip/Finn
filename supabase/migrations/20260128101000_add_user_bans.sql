-- Global user bans for platform-level enforcement
create table if not exists public.user_bans (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid not null references public.profiles(id) on delete set null,
  reason text,
  source_post_id bigint references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_user_bans_user_id on public.user_bans(user_id);
create index if not exists idx_user_bans_banned_by on public.user_bans(banned_by);
create index if not exists idx_user_bans_created_at on public.user_bans(created_at desc);

alter table public.user_bans enable row level security;

create or replace function public.is_staff_or_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('staff', 'admin')
  );
$$;

-- Staff/admin can view all bans; users can view their own ban record
create policy "user_bans_select_authenticated"
  on public.user_bans
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_staff_or_admin(auth.uid()));

-- Staff/admin can create bans
create policy "user_bans_insert_staff"
  on public.user_bans
  for insert
  to authenticated
  with check (public.is_staff_or_admin(auth.uid()));

-- Staff/admin can remove bans
create policy "user_bans_delete_staff"
  on public.user_bans
  for delete
  to authenticated
  using (public.is_staff_or_admin(auth.uid()));

-- Service role can view all bans
create policy "user_bans_select_service"
  on public.user_bans
  for select
  to service_role
  using (true);

comment on table public.user_bans is 'Global user bans enforced across the app.';
