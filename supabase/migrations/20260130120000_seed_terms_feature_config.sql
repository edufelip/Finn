-- Seed Terms config values in feature_config
insert into public.feature_config (key, value, description, created_at, updated_at)
values
  (
    'terms_version',
    to_jsonb('2026-01-28'::text),
    'Current Terms of Service version required for acceptance.',
    now(),
    now()
  ),
  (
    'terms_url',
    to_jsonb('https://www.portfolio.eduwaldo.com/projects/finn/terms_eula'::text),
    'Public Terms of Service URL.',
    now(),
    now()
  )
on conflict (key)
  do update set
    value = excluded.value,
    description = excluded.description,
    updated_at = excluded.updated_at;
