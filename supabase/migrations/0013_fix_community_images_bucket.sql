insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', false)
on conflict (id) do nothing;

drop policy if exists "Community images readable by authenticated" on storage.objects;
drop policy if exists "Community images insert by owner" on storage.objects;
drop policy if exists "Community images update by owner" on storage.objects;
drop policy if exists "Community images delete by owner" on storage.objects;

create policy "Community images readable by authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'community-images');

create policy "Community images insert by owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'community-images' and auth.uid() = owner);

create policy "Community images update by owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'community-images' and auth.uid() = owner);

create policy "Community images delete by owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'community-images' and auth.uid() = owner);
