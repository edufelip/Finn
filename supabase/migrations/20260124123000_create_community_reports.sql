-- Create community_reports table for tracking reported communities
create table if not exists public.community_reports (
  id bigserial primary key,
  community_id bigint not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) >= 15 and char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

-- Add index for querying reports by community
create index if not exists idx_community_reports_community_id on public.community_reports(community_id);

-- Add index for querying reports by user (to prevent spam)
create index if not exists idx_community_reports_user_id on public.community_reports(user_id);

-- Add index for querying recent reports
create index if not exists idx_community_reports_created_at on public.community_reports(created_at desc);

-- Enable RLS
alter table public.community_reports enable row level security;

-- Policy: Users can create reports for any community
create policy "Users can report communities"
  on public.community_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can view their own reports
create policy "Users can view their own community reports"
  on public.community_reports
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Service role can view all reports (for moderation)
create policy "Service role can view all community reports"
  on public.community_reports
  for select
  to service_role
  using (true);

-- Add unique constraint to prevent duplicate reports from same user on same community
create unique index if not exists idx_community_reports_user_community_unique
  on public.community_reports(user_id, community_id);

-- Comment for documentation
comment on table public.community_reports is 'Stores user reports for communities that violate community guidelines';
