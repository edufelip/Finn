-- Remote-config style feature flags and values
create table if not exists public.feature_config (
  key text primary key,
  value jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feature_config_updated_at on public.feature_config(updated_at desc);

alter table public.feature_config enable row level security;

-- Read access for all clients
create policy "feature_config_select_all"
  on public.feature_config
  for select
  to anon, authenticated
  using (true);

-- Admin-only writes (block banned admins)
create policy "feature_config_insert_admin"
  on public.feature_config
  for insert
  to authenticated
  with check (
    public.is_admin(auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

create policy "feature_config_update_admin"
  on public.feature_config
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
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

create policy "feature_config_delete_admin"
  on public.feature_config
  for delete
  to authenticated
  using (
    public.is_admin(auth.uid())
    and not exists (
      select 1 from public.user_bans ub
      where ub.user_id = auth.uid()
    )
  );

comment on table public.feature_config is 'Remote-config values for client features and moderation rules.';
