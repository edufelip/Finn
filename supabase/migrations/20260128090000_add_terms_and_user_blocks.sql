-- Add terms acceptance fields to profiles
alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

-- Create user_blocks table for user-level blocking
create table if not exists public.user_blocks (
  id bigserial primary key,
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) >= 15 and char_length(reason) <= 300),
  source_post_id bigint references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists idx_user_blocks_blocker_id on public.user_blocks(blocker_id);
create index if not exists idx_user_blocks_blocked_id on public.user_blocks(blocked_id);
create index if not exists idx_user_blocks_created_at on public.user_blocks(created_at desc);

alter table public.user_blocks enable row level security;

-- Users can view their own blocks
create policy "user_blocks_select_own"
  on public.user_blocks
  for select
  to authenticated
  using (auth.uid() = blocker_id);

-- Users can create blocks for themselves
create policy "user_blocks_insert_own"
  on public.user_blocks
  for insert
  to authenticated
  with check (auth.uid() = blocker_id and blocker_id <> blocked_id);

-- Users can remove their own blocks
create policy "user_blocks_delete_own"
  on public.user_blocks
  for delete
  to authenticated
  using (auth.uid() = blocker_id);

-- Service role can view all blocks (for developer moderation tooling)
create policy "user_blocks_select_service"
  on public.user_blocks
  for select
  to service_role
  using (true);

comment on table public.user_blocks is 'Tracks user blocks and reasons to support abuse reporting workflows.';
comment on column public.profiles.terms_version is 'Last accepted terms version.';
comment on column public.profiles.terms_accepted_at is 'Timestamp of latest terms acceptance.';
