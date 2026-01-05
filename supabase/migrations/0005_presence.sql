-- Presence and visibility metadata for profiles

alter table public.profiles
  add column if not exists online_visible boolean not null default true,
  add column if not exists last_seen_at timestamptz not null default now();

update public.profiles
  set last_seen_at = coalesce(last_seen_at, created_at, now());

create index if not exists profiles_last_seen on public.profiles (last_seen_at desc);
