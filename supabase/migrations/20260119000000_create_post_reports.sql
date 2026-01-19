-- Create post_reports table for tracking reported posts
create table if not exists public.post_reports (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) >= 15 and char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

-- Add index for querying reports by post
create index if not exists idx_post_reports_post_id on public.post_reports(post_id);

-- Add index for querying reports by user (to prevent spam)
create index if not exists idx_post_reports_user_id on public.post_reports(user_id);

-- Add index for querying recent reports
create index if not exists idx_post_reports_created_at on public.post_reports(created_at desc);

-- Enable RLS
alter table public.post_reports enable row level security;

-- Policy: Users can create reports for any post
create policy "Users can report posts"
  on public.post_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can view their own reports
create policy "Users can view their own reports"
  on public.post_reports
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Service role can view all reports (for moderation)
create policy "Service role can view all reports"
  on public.post_reports
  for select
  to service_role
  using (true);

-- Add unique constraint to prevent duplicate reports from same user on same post
create unique index if not exists idx_post_reports_user_post_unique 
  on public.post_reports(user_id, post_id);

-- Comment for documentation
comment on table public.post_reports is 'Stores user reports for posts that violate community guidelines';
