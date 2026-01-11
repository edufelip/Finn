-- Trigger cleanup of user assets after profile deletion.

create extension if not exists pg_net;

create or replace function public.trigger_delete_user_assets()
returns trigger
language plpgsql
security definer
as $$
declare
  endpoint text;
  anon_key text;
  payload jsonb;
begin
  endpoint := current_setting('app.settings.delete_user_assets_url', true);
  anon_key := current_setting('app.settings.anon_key', true);

  if endpoint is null or endpoint = '' then
    return old;
  end if;

  payload := jsonb_build_object('userId', old.id);

  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(anon_key, '')
    ),
    body := payload
  );

  return old;
end;
$$;

drop trigger if exists delete_user_assets_trigger on public.profiles;

create trigger delete_user_assets_trigger
after delete on public.profiles
for each row
execute function public.trigger_delete_user_assets();
