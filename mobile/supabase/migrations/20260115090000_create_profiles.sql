create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  online_visible boolean not null default true,
  notifications_enabled boolean not null default true,
  last_seen_at timestamptz,
  bio text,
  location text
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);
